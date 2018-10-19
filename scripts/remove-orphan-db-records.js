#! /usr/bin/env node
// vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
'use strict';

// Dependencies
var program = require('commander'),
      fs    = require('fs'),
      path  = require('path');

var _cliProgress = require('cli-progress');

var ueberDB      = require('ueberdb2'),
    jsonminify   = require('jsonminify'),
    eachSeries   = require('async/eachSeries'),
    eachOfSeries = require('async/eachOfSeries');

// Arguments handling
program
  .version('0.1.0')
  .option('-s, --settings <file>', '[MANDATORY] the path to your Etherpad\'s settings.json file')
  .option('-n, --dryrun',          '(optional) just count the number of pads that would have been normally deleted')
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
var db = new ueberDB.database(settings.dbType, settings.dbSettings);

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

/*
 * Start searching
 */
db.init(function(err) {
  if (err) { return exitIfErr(err); }

  db.get('mypads:conf:allowEtherPads', function(err, val) {
    if (err) { return exitIfErr(err); }

    // Yeah, we don't want to remove anonymous pads
    if (val !== false) {
      console.log(' _______________');
      console.log('|===============|');
      console.log('|: .---------. :|');
      console.log('|: | HAL-9000| :|');
      console.log('|: \'---------\' :|');
      console.log('|:             :|    ________________________________________');
      console.log('|:             :|   / I\'m sorry, Dave, I\'m afraid I can\'t do \\');
      console.log('|:             :|   \\ that.                                  /');
      console.log('|:             :|    ----------------------------------------');
      console.log('|:      _      :|    /');
      console.log('|:   ,`   `.   :| __/');
      console.log('|:   : (o) :   :|');
      console.log('|:   `. _ ,`   :|');
      console.log('|:             :|');
      console.log('|:_____________:|');
      console.log('|:=============:|');
      console.log('|:*%*%*%*%*%*%*:|');
      console.log('|:%*%*%*%*%*%*%:|');
      console.log('|:*%*%*%*%*%*%*:|');
      console.log('|:%*%*%*%*%*%*%:|');
      console.log('\'===============\'');
      console.log('');
      console.log('================================================');
      console.log('It seems that you allow anonymous pads.');
      console.log('This script would delete all the anonymous pads.');
      console.log('Exiting');
      console.log('================================================');
      return db.doShutdown(function() { process.exit(1); });
    }

    // readonly2pad:* records are leftovers of deleted pads before #197 was solved
    db.findKeys('readonly2pad:*', null, function(err, keys) {
      if (err) { return exitIfErr(err); }

      var candidatesForDeletion = 0;

      if (keys.length === 0) {
        console.log('No pads to check.');
        return db.doShutdown(function() { process.exit(0); });
      }

      console.log(keys.length+' pad(s) to check.');

      // I love progress bars, it's cool
      var bar = new _cliProgress.Bar({
        format: '[{bar}] {percentage}% | ETA: {eta}s | {val}/{tot}',
        stopOnComplete: true,
        hideCursor: true,
        barsize: 60,
        fps: 60
      }, _cliProgress.Presets.shades_grey);
      bar.start(2 * keys.length, 0, { val: 0, tot: keys.length });

      // For each readonly2pad record, do pad existence check
      eachOfSeries(keys, function(readonly2pad, index, next) {
        bar.increment(1, { val: index + 1 });

        // First, get the padId
        db.get(readonly2pad, function(err, padId) {
          if (err) { return exitIfErr(err); }

          // Then, check if the pad exists in MyPads
          db.get('mypads:pad:'+padId, function(err, val) {
            if (err) { return exitIfErr(err); }

            // Launch a delete process if the pad doesn't exist
            if (val === null) {
              if (program.dryrun) {
                bar.increment();
                candidatesForDeletion++;
                return next();
              }
              // Cascade deletion process
              // 1. Delete the readonly2pad record
              db.remove(readonly2pad, function(err) {
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
                          eachSeries(keys, removeRecord, function(err){
                            if (err) { return exitIfErr(err); }
                            bar.increment();
                            return next();
                          });
                        });
                      });
                    });
                  });
                });
              });
            } else {
              // No deletion needed
              bar.increment();
              return next();
            }
          });
        });
      }, function(err) {
        if (err) { return exitIfErr(err); }

        // Give time for progress bar to update before exiting
        setTimeout(function() {
          console.log(keys.length+' pad(s) checked.');

          if (program.dryrun) {
            console.log(candidatesForDeletion+' pad(s) would have been deleted.');
          }

          return db.doShutdown(function() { process.exit(0); });
        }, 100);
      });
    });
  });
});
