#! /usr/bin/env node
// vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
'use strict';

const util = require('util');

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
    ld           = require('lodash');

// Arguments handling
program
  .version('0.2.0')
  .option('-s, --settings <file>', '[MANDATORY] the path to your Etherpad\'s settings.json file')
  .option('-n, --dryrun',          '(optional) just count the number of users that would have been normally merged')
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
    var baseUsersForMerge  = 0;
    var logins     = {};
    var userInList = {};

    if (keys.length === 0) {
      console.log('No users to check.');
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
    eachSeries(keys, function(user, next) {
      bar.increment();
      // Get the record of the user and populate hash tables
      db.get(user, function(err, value) {
        if (err) { return exitIfErr(err); }

        // Populate logins cache
        if (typeof(logins[value.login]) === 'undefined') {
          logins[value.login] = [value];
        } else if (value.email === logins[value.login][0].email) {
          // Only push if same email
          logins[value.login].push(value);
        }

        // Populate userInList cache
        for (var list in value.userlists) {
          for (var uid of value.userlists[list].uids) {
            // put each user id in userInList cache, with a list of the users that reference
            // the user and the name of the list to modify
            if (typeof(userInList[uid]) === 'undefined') {
              userInList[uid] = {};
              userInList[uid].users = {};
              userInList[uid].users[value._id] = [list];
            } else if (typeof(userInList[uid][value._id]) === 'undefined') {
              userInList[uid].users[value._id] = [list];
            } else {
              userInList[uid].users[value._id].push(list);
            }
          }
        }
        bar.increment();
        return next();
      });
    }, function(err) {
      if (err) { return exitIfErr(err); }


      // Find duplicates
      eachOfSeries(logins, function(users, login, next2) {
        if (users.length <= 1) {
          // No duplicates
          if (typeof(userInList[users[0]._id]) !== 'undefined') {
            delete userInList[users[0]._id];
          }
          return next2();
        }

        baseUsersForMerge++;

        // Sort users by creation time
        sortBy(users, function(user, next3) {
          next3(null, user.ctime);
        }, function(err, result) {
          if (err) { return exitIfErr(err); }

          var baseUser = result.shift();
          if (typeof(userInList[baseUser._id]) !== 'undefined') {
            delete userInList[baseUser._id];
          }
          // Time to merge
          for (var u of result) {
            candidatesForMerge++;

            if (typeof(userInList[u._id]) === 'undefined') {
              userInList[u._id] = {};
            }
            userInList[u._id].baseUser = baseUser._id;
            baseUser.groups            = ld.union(baseUser.groups,           u.groups);
            baseUser.bookmarks.groups  = ld.union(baseUser.bookmarks.groups, u.bookmarks.groups);
            baseUser.bookmarks.pads    = ld.union(baseUser.bookmarks.pads,   u.bookmarks.pads);
            for (var b in u.userlists) {
              if (typeof(baseUser.userlists[b]) === 'undefined') {
                baseUser.userlists[b] = u.userlists[b];
              } else {
                baseUser.userlists[b].uids = ld.union(baseUser.userlists[b].uids, u.userlists[b].uids);
              }
            }
          }

          // Write merged user in DB
          if (!program.dryrun) {
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
                    if (err) { return exitIfErr(err); }

                    if (value === null) {
                      return next5();
                    }

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

                  console.log(util.inspect(userInList, false, null, true));
                  // need to clean userlists
                  eachOfSeries(userInList, function(struct, userToRemove, next6) {
                    let baseUser = struct.baseUser;
                    console.log(baseUser);
                    eachOfSeries(struct.users, function(lists, userId, next7) {
                      db.get('mypads:user:'+userId, function(err, value) {
                        if (err) { return exitIfErr(err); }
                        if (value === null) { return next7(); }

                        for (var list of lists) {
                          /*if (typeof(value.userlists[list]) === 'undefined') {
                            value.userlists[list] = { name: '', uids: [] };
                          }*/

                          value.userlists[list].uids.push(baseUser);
                          value.userlists[list].uids = ld.uniq(value.userlists[list].uids);

                          var uIndex = value.userlists[list].uids.indexOf(userToRemove);
                          value.userlists[list].uids.splice(uIndex, 1);
                        }
                        db.set('mypads:user:'+userId, value, function(err) {
                          if (err) { return exitIfErr(err); }

                          return next7();
                        });
                      });
                    }, function(err) {
                      if (err) { return exitIfErr(err); }

                      return next6();
                    });
                  }, function(err) {
                    if (err) { return exitIfErr(err); }

                    return next2();
                  });
                });
              });
            });
          } else {
            return next2();
          }
        });
      }, function(err) {
        if (err) { return exitIfErr(err); }

        // Give time for progress bar to update before exiting
        setTimeout(function() {
          console.log(keys.length+' user(s) checked.');
          if (!program.dryrun) {
            console.log(candidatesForMerge+' user(s) merged into '+baseUsersForMerge+' user(s)');
          } else {
            console.log(candidatesForMerge+
              ' user(s) would have been merged into '+baseUsersForMerge+' user(s) (this script has been launched with the dryrun option)');
          }

          return db.doShutdown(function() { process.exit(0); });
        }, 100);
      });
    });
  });
});
