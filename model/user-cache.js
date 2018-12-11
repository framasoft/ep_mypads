/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # User Model
*
*  ## License
*
*  Licensed to the Apache Software Foundation (ASF) under one
*  or more contributor license agreements.  See the NOTICE file
*  distributed with this work for additional information
*  regarding copyright ownership.  The ASF licenses this file
*  to you under the Apache License, Version 2.0 (the
*  "License"); you may not use this file except in compliance
*  with the License.  You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing,
*  software distributed under the License is distributed on an
*  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
*  KIND, either express or implied.  See the License for the
*  specific language governing permissions and limitations
*  under the License.
*/

module.exports = (function () {
  'use strict';

  // Dependencies
  require('../helpers.js'); // Helpers auto-init
  var ld      = require('lodash');
  var conf    = require('../configuration.js');
  var storage = require('../storage.js');
  var UPREFIX = storage.DBPREFIX.USER;

  /**
  *  ## Description
  *
  * The `userCache` is the masterpiece of the MyPads plugin.
  *
  * It initially contains :
  *
  * - `logins`, an in memory object to map `_id` to `login` field and ensures
  *   uniqueness of logins
  * - `emails`, which have the same purpose for emails
  * - `firstname`, to ease search with firstname
  * - `lastname`, to ease search with lastname
  */

  var userCache = { logins: {}, emails: {}, firstname: {}, lastname: {}, userCacheReady: false };

  userCache.fn  = {};

  /**
  * ## Public Functions
  *
  * ### init
  *
  * `init` is a function that is called once at the initialization of mypads
  * and loops over all users to map their *login* to their *_id* and then
  * ensures uniqueness.
  *
  * It takes a callback function which is returned with *null* when finished.
  */

  userCache.init = function (callback) {
    storage.db.findKeys(UPREFIX + '*', null, function (err, keys) {
      if (err) { return callback(err); }
      // If you want to delay the user cache readyness (to test #141 for example),
      // put storage.fn.getKeys function below in
      // setTimeout(function() { }, 30000);
      // (NB: won't work with mockupserver since it waits for cache to be
      // ready before providing the web interface)
      storage.fn.getKeysUncached(keys, function (err, results) {
        if (results) {
          var memo = ld.reduce(results, function (memo, val, key) {
            if (val) {
              var k                  = key.replace(UPREFIX, '');
              memo.logins[val.login] = k;
              var email              = (conf.get('insensitiveMailMatch')) ? val.email.toLowerCase() : val.email;
              memo.emails[email]     = k;
              memo.firstname[k]      = val.firstname;
              memo.lastname[k]       = val.lastname;
            }
            return memo;
          }, { logins: {}, emails: {}, firstname: {}, lastname: {} });
          memo.userCacheReady = true;
          ld.assign(userCache, memo);
        }
        callback(null);
      });
    });
  };

  /**
  * ### getIdsFromLoginsOrEmails
  *
  * `getIdsFromLoginsOrEmails` is a private synchronous function that checks
  * if given data, users or admins logins or emails, are correct and transforms
  * it to expected values : unique identifiers, before saving it to database.
  *
  * It takes an array of users `logins` and `emails`.
  * It returns an object with :
  *
  * - `uids` for found users
  * - `present` users logins or emails
  * - `absent` users logins or emails
  */

  userCache.fn.getIdsFromLoginsOrEmails = function (loginsMails) {
    if (!ld.isArray(loginsMails)) {
      throw new TypeError('BACKEND.ERROR.TYPE.LOGINS_ARR');
    }
    return ld.reduce(loginsMails, function (memo, lm) {
      var email = (conf.get('insensitiveMailMatch')) ? lm.toLowerCase() : lm;
      var uid   = userCache.logins[lm] || userCache.emails[email];
      if (uid) {
        memo.uids.push(uid);
        memo.present.push(lm);
      } else {
        memo.absent.push(lm);
      }
      return memo;
    }, { uids: [], present: [], absent: [] });
  };

  /**
  * ### searchUserInfos
  *
  * `searchUserInfos` is a private synchronous function that search a user
  * in the cache.
  *
  * The search string can be a login, an email, a first or a last name.
  *
  * It returns a hash table with the login of the user as a key, and the value
  * is a hash table containing the email, first name and last name.
  *
  * exemple: {
  *   foo: {
  *     email: foo@bar.org,
  *     firstname: Foo,
  *     lastname: Bar
  *   }
  * }
  */
  userCache.fn.searchUserInfos = function (search) {
    search = search.toLowerCase();

    var emails  = ld.reduce(userCache.emails, function (result, n, key) {
      result[n] = key;
      return result;
    }, {});
    var users = ld.reduce(userCache.logins, function (result, n, key) {
      if (key.toLowerCase()                    === search ||
          emails[n].toLowerCase()              === search ||
          userCache.lastname[n].toLowerCase()  === search ||
          userCache.firstname[n].toLowerCase() === search) {
        result[key] = {
          email: emails[n],
          firstname: userCache.firstname[n],
          lastname: userCache.lastname[n]
        };
      }
      return result;
    }, {});
    return users;
  };

  return userCache;

}).call(this);
