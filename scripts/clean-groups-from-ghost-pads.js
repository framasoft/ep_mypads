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
  .version('0.2.0')
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
var db = new ueberDB.database(settings.dbType, settings.dbSettings, {cache: 0, writeInterval: 0});

/*
 * Functions
 */
function exitIfErr(err) {
  console.log('=====================');
  console.error(err);
  return db.doShutdown(function() { process.exit(1); });
}

/*
 * Start searching
 */
db.init(function(err) {
  if (err) { return exitIfErr(err); }

  // We will check in every group if all children pads exists in mypads:pad: namespace
  db.findKeys('mypads:group:*', null, function(err, keys) {
    if (err) { return exitIfErr(err); }

    var candidatesForDeletion = 0;

    if (keys.length === 0) {
      console.log('No groups to check.');
      return db.doShutdown(function() { process.exit(0); });
    }

    // I love progress bars, it's cool
    var bar = new _cliProgress.Bar({
      format: '[{bar}] {percentage}% | ETA: {eta}s | {val}/{tot}',
      stopOnComplete: true,
      hideCursor: true,
      barsize: 60,
      fps: 60
    }, _cliProgress.Presets.shades_grey);
    bar.start(2 * keys.length, 0, { val: 0, tot: keys.length });

    // For each group, do pad existence check
    eachOfSeries(keys, function(group, index, next) {
      bar.increment();
      // Get the record of the group
      db.get(group, function(err, value) {
        // Don't look at groups with no pads
        if (value.pads.length > 0) {
          var groupPads = [];
          // Check if every pad exists in mypads:pad: namespace
          eachOfSeries(value.pads, function(pad, index, next2) {
            db.findKeys('mypads:pad:'+pad, null, function(err, keys) {
              if (err) { return exitIfErr(err); }

              // If the pad exist, leave it in the group
              if (keys.length !== 0) {
                groupPads.push(pad);
              } else {
                candidatesForDeletion++;
              }
              return next2();
            });
          }, function(err) {
            if (err) { return exitIfErr(err); }

            if (!program.dryrun) {
              // Only update groups with changes
              if (value.pads.length !== groupPads.length) {
                value.pads = groupPads;
                db.set(group, value, function(err) {
                  if (err) { return exitIfErr(err); }

                  bar.increment();
                  return next();
                });
              }
            }
            bar.increment();
            return next();
          });
        } else {
          bar.increment();
          return next();
        }
      });
    }, function(err){
      if (err) { return exitIfErr(err); }

      // Give time for progress bar to update before exiting
      setTimeout(function() {
        console.log(keys.length+' group(s) checked.');

        if (program.dryrun) {
          console.log(candidatesForDeletion+' pad(s) would have been removed from group(s).');
        } else {
          console.log(candidatesForDeletion+' pad(s) have been removed from group(s).');
        }

        return db.doShutdown(function() { process.exit(0); });
      }, 100);
    });
  });
});
