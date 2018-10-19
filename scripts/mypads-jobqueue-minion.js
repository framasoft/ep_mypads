#! /usr/bin/env node
// vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
'use strict';

var program = require('commander'),
    fs      = require('fs'),
    path    = require('path');

var ueberDB      = require('ueberdb2'),
    jsonminify   = require('jsonminify'),
    forever      = require('async/forever'),
    eachSeries   = require('async/eachSeries'),
    eachOfSeries = require('async/eachOfSeries');

// Arguments handling
program
  .version('0.1.0')
  .option('-s, --settings <file>', '[MANDATORY] the path to your Etherpad\'s settings.json file')
  .option('-q, --quiet', '[OPTIONAL] low verbosity')
  .option('-o, --oneshot', '[OPTIONAL] don\'t start a loop, process the jobs and exit')
  .parse(process.argv);

// Check that we have the mandatory arguments
if (!program.settings) {
  console.log('');
  console.log('=====================================================================');
  console.log('  You must provide the path to your Etherpad\'s settings.json file!');
  console.log('=====================================================================');
  program.help();
}

// Try to parse the settings
var settingsFilename = path.resolve(program.settings);
var settingsStr      = fs.readFileSync(settingsFilename).toString();
var settings;
try {
  if(settingsStr) {
    settingsStr = jsonminify(settingsStr).replace(',]',']').replace(',}','}');
    settings    = JSON.parse(settingsStr);
  }
} catch(e) {
  console.error('There was an error processing your settings.json file: '+e.message);
  process.exit(1);
}

// Open the database
var db = new ueberDB.database(settings.dbType, { cache: 0, writeInterval: 0 });

/*
 * Functions
 */
function exitIfErr(err) {
  console.log('=====================');
  console.error(err);
  return db.doShutdown(function() { process.exit(1); });
}

// Remove record from DB
function removeRecord(key, callback) {
  db.remove(key, function(err) {
    if (err) { return exitIfErr(err); }
    callback();
  });
}

function deletePads(nextLoop) {
  if (!program.quiet) { console.log('Entering loop'); }

  db.findKeys('mypads:jobqueue:deletePad:*', null, function(err, pads) {
    if (err) { return exitIfErr(err); }

    if (pads !== null && pads.length > 0) {
      if (!program.quiet) { console.log('Pads to delete: '+pads); }

      eachOfSeries(pads, function(padId, index, next) {
        padId = padId.replace('mypads:jobqueue:deletePad:', '');

        if (!program.quiet) { console.log('Starting deletion of '+padId); }

        // Cascade deletion process
        // 0. Get the readonly name of the pad
        db.get('pad2readonly:'+padId, function(err, readonly2pad) {
          if (err) { return exitIfErr(err); }

          // 1. Delete the readonly2pad record
          db.remove('readonly2pad:'+readonly2pad, function(err) {
            if (err) { return exitIfErr(err); }

            // 2. Delete the pad2readonly:padId record
            db.remove('pad2readonly:'+padId, function(err) {
              if (err) { return exitIfErr(err); }

              // 3. Delete the pad:padId record
              db.remove('pad:'+padId, function(err) {
                if (err) { return exitIfErr(err); }

                // 4. Check for revs records
                db.findKeys('pad:'+padId+':revs:*', null, function(err, keys) {
                  if (err) { return exitIfErr(err); }

                  // 5. Delete the revs records
                  eachSeries(keys, removeRecord, function(err) {
                    if (err) { return exitIfErr(err); }
                    // 6. Check for chat records
                    db.findKeys('pad:'+padId+':chat:*', null, function(err, keys) {
                      if (err) { return exitIfErr(err); }

                      // 7. Delete the chat records
                      eachSeries(keys, removeRecord, function(err) {
                        if (err) { return exitIfErr(err); }

                        // 8. Remove the job
                        db.remove('mypads:jobqueue:deletePad:'+padId, function(err) {
                          if (err) { return exitIfErr(err); }

                          if (!program.quiet) { console.log('End deletion of '+padId); }
                          return next();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }, function(err) {
        if (err) { return exitIfErr(err); }

        if (program.oneshot) {
          return db.doShutdown(function() { process.exit(0); });
        } else {
          nextLoop();
        }
      });
    } else {
      if (!program.quiet) { console.log('No pad to process'); }

      if (program.oneshot) {
        return db.doShutdown(function() { process.exit(0); });
      } else {
        setTimeout(nextLoop, 1000);
      }
    }
  });
}

/*
 * Start loop
 */
db.init(function(err) {
  if (err) { return exitIfErr(err); }

  if (program.oneshot) {
    deletePads();
  } else {
    forever(deletePads, exitIfErr);
  }
});
