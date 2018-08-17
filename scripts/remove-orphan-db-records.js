#! /usr/bin/env node
// vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
'use strict';

var program = require('commander'),
      fs    = require('fs'),
      path  = require('path');

var _cliProgress = require('cli-progress');

var ueberDB    = require('ueberdb2'),
    jsonminify = require('jsonminify');

program
  .version('0.1.0')
  .option('-s, --settings <file>', '[MANDATORY] the path to your Etherpad\'s settings.json file')
  .parse(process.argv);

if (!program.settings) {
  console.log('');
  console.log('=====================================================================');
  console.log('  You must provide the path to your Etherpad\'s settings.json file!');
  console.log('=====================================================================');
  program.help();
}

var settingsFilename = path.resolve(program.settings);

// Try to parse the settings
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

var db = new ueberDB.database(settings.dbType, settings.dbSettings);

// Error handling
function exitIfErr(err) {
  if(err) {
    console.log('=====================');
    console.error(err);
    db.close(function() { process.exit(1); });
  }
}

// Remove record from DB
function removeRecord(key) {
  db.remove(key, exitIfErr);
}

// Start searching
db.init(function(err) {
  exitIfErr(err);

  db.get('mypads:conf:allowEtherPads', function(err, val) {
    exitIfErr(err);

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
      process.exit(1);
    }

    db.findKeys('readonly2pad:*', null, function(err, keys) {
      exitIfErr(err);

      if (keys.length === 0) {
        console.log('No pads to check.');
        process.exit(0);
      }

      console.log(keys.length+' pads to check.');

      var bar = new _cliProgress.Bar({
        format: '[{bar}] {percentage}% | ETA: {eta}s | {val}/{tot}',
        stopOnComplete: true,
        hideCursor: true,
        barsize: 60,
        fps: 60
      }, _cliProgress.Presets.shades_grey);
      bar.start(2 * keys.length, 0, { val: 0, tot: keys.length });

      // For each readonly2pad record, do pad existence check
      keys.forEach(function(readonly2pad, index) {
        bar.increment(1, { val: index + 1 });

        // First, get the padId
        db.get(readonly2pad, function(err, padId) {
          exitIfErr(err);

          // Then, check if the pad exists in MyPads
          db.get('mypads:pad:'+padId, function(err, val) {
            exitIfErr(err);

            // Launch a delete process if the pad doesn't exist
            if (val === null) {
              // Cascade deletion process
              // 1. Delete the readonly2pad record
              db.remove(readonly2pad, function(err) {
                exitIfErr(err);

                // 2. Delete the pad2readonly:padId record
                db.remove('pad2readonly:'+padId, function(err) {
                  exitIfErr(err);

                  // 3. Delete the pad:padId record
                  db.remove('pad:'+padId, function(err) {
                    exitIfErr(err);

                    // 4. Check for revs records
                    db.findKeys('pad:'+padId+':revs:*', null, function(err, keys) {
                      exitIfErr(err);

                      // 5. Delete the revs records
                      keys.forEach(removeRecord);

                      // 6. Check for chat records
                      db.findKeys('pad:'+padId+':chat:*', null, function(err, keys) {
                        exitIfErr(err);

                        // 7. Delete the chat records
                        keys.forEach(removeRecord);
                        bar.increment();
                      });
                    });
                  });
                });
              });
            } else {
              // No deletion needed
              bar.increment();
            }
          });
        });
      });

      // Give time to progress bar to update
      setTimeout(function() {
        console.log(keys.length+' pads checked.');
        process.exit(0);
      }, 100);
    });
  });
});
