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
    eachOfSeries = require('async/eachOfSeries'),
    sortBy       = require('async/sortBy'),
    uniq         = require('lodash/uniq');

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
  db.findKeys('mypads:user:*', null, function(err, keys) {
    if (err) { return exitIfErr(err); }

    var candidatesForMerge = 0;
    var logins = {};
    var userInList;

    if (keys.length === 0) {
      console.log('No groups to check.');
      return db.doShutdown(function() { process.exit(0); });
    }

    console.log('Indexing logins and emails');
    // I love progress bars, it's cool
    var bar = new _cliProgress.Bar({
      format: '[{bar}] {percentage}% | ETA: {eta}s | {val}/{tot}',
      stopOnComplete: true,
      hideCursor: true,
      barsize: 60,
      fps: 60
    }, _cliProgress.Presets.shades_grey);
    bar.start(2 * keys.length, 0, { val: 0, tot: keys.length });

    // Populate cache
    eachOfSeries(keys, function(user, index, next) {
      bar.increment();
      // Get the record of the user and populate hash tables
      db.get(user, function(err, value) {
        // Populate logins cache
        if (typeof(logins[value.login]) === 'undefined') {
          logins[value.login] = [user];
        } else if (value.email === logins[value.login][0].email) {
          // Only push if same email
          logins[value.login].push(user);
        }

        // Populate userInList cache
        for (var list in value.userlists) {
          for (var uid of value.userlists[list].uids) {
            if (typeof(userInList[uid]) === 'undefined') {
              userInList[uid] = [value._id];
            } else {
              userInList[uid].push(value._id);
            }
          }
        }
        bar.increment();
        return next();
      });
    }, function(err) {
      if (err) { return exitIfErr(err); }

      // Find duplicates
      eachOfSeries(logins, function(login, ids, next2) {
        if (ids.length <= 1) {
          // No duplicates
          return next2();
        }

        candidatesForMerge++;

        // Sort users by creation time
        sortBy(ids, function(user, next3) {
          next3(null, user.ctime);
        }, function(err, result) {
          if (err) { return exitIfErr(err); }

          var baseUser = result.shift();
          // Time to merge
          for (var u of result) {
            baseUser.groups.push(u.groups);
            baseUser.bookmarks.groups.push(u.bookmarks.groups);
            baseUser.bookmarks.pads.push(u.bookmarks.pads);
            for (var b in result.userlists) {
              if (typeof(baseUser.userlists[b]) === 'undefined') {
                baseUser.userlists[b] = result.userlists[b];
              } else {
                baseUser.userlists[b].uids.push(result.userlists[b].uids);
              }
            }
          }
          // Clean up things
          baseUser.groups           = uniq(baseUser.groups);
          baseUser.bookmarks.groups = uniq(baseUser.bookmarks.groups);
          baseUser.bookmarks.pads   = uniq(baseUser.bookmarks.pads);
          for (var list in baseUser.userlists) {
            baseUser.userlists[list].uids = uniq(baseUser.userlists[list].uids);
          }

          // Write merged user in DB
          db.set('mypads:user:'+baseUser._id, baseUser, function(err) {
            if (err) { return exitIfErr(err); }

            // Remove other users
            eachSeries(result, function(u, next4) {
              db.remove('mypads:user:'+u._id, function(err) {
                if (err) { return exitIfErr(err); }

                return next4();
              });
            }, function(err) {
              if (err) { return exitIfErr(err); }

              // Clean up groups
              eachSeries(baseUser.groups, function(g, next5) {
                db.get('mypads:group:'+g, function(err, value) {
                  var needWrite = false;

                  // Add baseUser to group if needed
                  var uIndex = value.users.indexOf(baseUser._id);
                  var aIndex = value.admins.indexOf(baseUser._id);
                  if (uIndex === -1 && aIndex === -1) {
                    value.users.push(baseUser._id);
                    needWrite = true;
                  }

                  // Remove other users from groups if needed
                  for (var u of result) {
                    uIndex = value.users.indexOf(u._id);
                    if (uIndex !== -1) {
                      value.users.splice(uIndex, 1);
                      needWrite = true;
                    }

                    aIndex = value.admins.indexOf(u._id);
                    if (aIndex !== -1) {
                      value.admins.splice(aIndex, 1);
                      needWrite = true;
                    }
                  }

                  if (needWrite) {
                    db.set('mypads:group:'+g, value, function(err) {
                      if (err) { return exitIfErr(err); }

                      return next5();
                    });
                  } else {
                    return next5();
                  }
                });
              }, function(err) {
                if (err) { return exitIfErr(err); }
                // need to clean userlists
              });
            });
          });
        });
      });
    });
  });
});
