/**
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
  var crypto = require('crypto');
  var ld = require('lodash');
  var cuid = require('cuid');
  var conf = require('../configuration.js');
  var storage = require('../storage.js');
  var common = require('./common.js');
  var UPREFIX = storage.DBPREFIX.USER;
  var CPREFIX = storage.DBPREFIX.CONF;

  /**
  *  ## Description
  *
  * The `user` is the masterpiece of the MyPads plugin.
  *
  * It initially contains :
  *
  * - `ids`, an in memory object to map `_id` to `login` field and ensures
  *   uniqueness of logins
  */

  var user = { ids: {} };

  /**
  * ## Internal Functions
  *
  * These functions are not private like with closures, for testing purposes,
  * but they are expected be used only internally by other MyPads functions.
  */

  user.fn = {};

  /**
  * ### getPasswordConf
  *
  * `getPasswordConf` is an asynchronous function that get from database values
  * for minimum and maximum passwords. It takes a `callback` function as unique
  * argument called with *Error* or *null* and results.
  * Internally, it uses `storage.getKeys`.
  */

  user.fn.getPasswordConf = function (callback) {
    var _keys = [CPREFIX + 'passwordMin', CPREFIX + 'passwordMax'];
    storage.fn.getKeys(_keys, function (err, results) {
      if (err) { return callback(err); }
      return callback(null, results);
    });
  };

  /**
  * ### checkPasswordLength
  *
  * `checkPasswordLength` is a private helper aiming at respecting the minimum
  * length fixed into MyPads configuration.
  *
  * It takes two arguments, with fields
  *
  *   - `password` string
  *   - a `params` object with
  *     - `passwordMin` size
  *     - `passwordMax` size
  *
  *  It returns a *TypeError* if the verification has failed.
  */

  user.fn.checkPasswordLength = function (password, params) {
    var pass = password;
    var min = params[CPREFIX + 'passwordMin'];
    var max = params[CPREFIX + 'passwordMax'];
    if (pass.length < min || pass.length > max) {
      return new TypeError('BACKEND.ERROR.TYPE.PASSWORD_SIZE');
    }
  };

  /**
  * ### genPassword
  *
  * `genPassword` is an asynchronous function which do :
  *
  * - if the size is between `conf.passwordMin` and `conf.passwordMax`
  * - if the given `password` matches the already used one in case of update
  * - in addition or if it does not match, generates a new `salt` and hashed
  *   `password`
  *
  *   It takes
  *
  *   - an `old` user object, *null* in case of creation
  *   - the `user` object
  *   - a `callback` function returning *Error* if needed, or *null* and the
  *   updated `user` object
  */

  user.fn.genPassword = function (old, u, callback) {
    user.fn.getPasswordConf(function (err, res) {
      if (err) { return callback(err); }
      err = user.fn.checkPasswordLength(u.password, res);
      if (err) { return callback(err); }
      var newPass = function () {
        user.fn.hashPassword(null, u.password, function (err, pass) {
          if (err) { return callback(err); }
          u.password = pass;
          callback(null, u);
        });
      };
      if (old) {
        var oldp = old.password;
        user.fn.hashPassword(oldp.salt, u.password, function (err, p) {
          if (err) { return callback(err); }
          if (p.hash === oldp.hash) {
            u.password = oldp;
            callback(null, u);
          } else {
            newPass();
          }
        });
      } else {
        newPass();
      }
    });
  };

  /**
  * ### hashPassword
  *
  * `hashPassword` is an asynchronous function that use `crypto.randomBytes` to
  * generate a strong `salt` if needed and return a `sha512` `hash` composed of
  * the `salt` and the given `password`. It takes
  *
  * - an optional `salt` string
  * - the mandatory `password` string
  * - a `callback` function which returns an object with `hash`ed password and
  *   the `salt`.
  */

  user.fn.hashPassword = function (salt, password, callback) {
    crypto.randomBytes(40, function (ex, buf) {
      if (ex) { return callback(ex); }
      salt = salt || buf.toString('hex');
      var sha512 = crypto.createHash('sha512');
      sha512.update(salt);
      callback(null, {
        salt: salt,
        hash: sha512.update(password).digest('hex')
      });
    });
  };

  /**
  * ### assignProps
  *
  * `assignProps` takes `params` object and assign defaults if needed. It adds a
  * `groups` array field, which will hold `model.group` of pads ids. It
  * returns the user object.
  *
  */

  user.fn.assignProps = function (params) {
    var p = params;
    var u = ld.reduce(['firstname', 'lastname', 'organization', 'color'],
      function (res, v) {
        res[v] = ld.isString(p[v]) ? p[v] : '';
        return res;
    }, {});
    u.email = (ld.isEmail(p.email)) ? p.email : '';
    u.groups = [];
    u.bookmarks = { groups: [], pads: [] };
    if (ld.isBoolean(p.useLoginAndColorInPads)) {
      u.useLoginAndColorInPads = p.useLoginAndColorInPads;
    } else {
      u.useLoginAndColorInPads = true;
    }
    var langs = ld.keys(conf.cache.languages);
    u.lang = (ld.includes(langs, p.lang) ? p.lang : 'en');
    return ld.assign({ _id: p._id, login: p.login, password: p.password }, u);
  };

  /**
  * ### checkLogin
  *
  * This is a function which check if id or login are already taken for new
  * users and if the login has changed for existing users (updates).
  *
  * It takes, as arguments
  *
  * - the given `id`, from `params._id` from `user.set`
  * - the assigned `u` user object
  * - a callback
  *
  * It returns, through the callback, an *Error* if the user or login are
  * already here, *null* otherwise.
  *
  * TODO: split in two functions to allow login change (used in cunjunction
  * with getDel by login)
  */

  user.fn.checkLogin = function (_id, u, callback) {
    if (!_id) {
      var exists = (!ld.isUndefined(user.ids[u.login]) ||
        (ld.includes(ld.values(user.ids), u._id)));
      if (exists) {
        var e = new Error('BACKEND.ERROR.USER.ALREADY_EXISTS');
        return callback(e);
      }
      return callback(null);
    } else {
      // u.login has changed for existing user
      if (ld.isUndefined(user.ids[u.login])) {
        var key = ld.findKey(user.ids, function (uid) {
          return uid === _id;
        });
        delete user.ids[key];
      }
      return callback(null);
    }
  };

  /**
  * ### getIdsFromLogins
  *
  * `getIdsFromLogins` is a private asynchronous function that checks if given
  * data, users or admins logins, are correct and transforms it to expected
  * values : unique identifiers, before saving it to database.
  *
  * It takes :
  *
  * - array of users  `logins`;
  * - `callback` function with *null* and the array with unique identifiers.
  */

  user.fn.getIdsFromLogins = function (logins, callback) {
    if (!ld.isArray(logins)) {
      throw new TypeError('BACKEND.ERROR.TYPE.LOGINS_ARR');
    }
    if (!ld.isFunction(callback)) {
      throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
    }
    callback(null, ld.reduce(logins, function (memo, login) {
      var key = user.ids[login];
      if (key) { memo.push(key); }
      return memo;
    }, []));
  };

  /**
  * ### getDel
  *
  * Local `getDel` wrapper that uses `user.ids` object to ensure uniqueness of
  * login and _id fields before returning `common.getDel` with *UPREFIX* fixed.
  * It also handles secondary indexes for *model.group* elements and removes
  * all groups where the user was the only administrator.
  *
  * It takes the mandatory `login` string as argument and return an error if
  * login already exists. It also takes a mandatory `callback` function.
  *
  */

  user.fn.getDel = function (del, login, callback) {
    if (!ld.isString(login) || ld.isEmpty(login)) {
      throw new TypeError('BACKEND.ERROR.TYPE.LOGIN_STR');
    }
    if (ld.isUndefined(user.ids[login])) {
      return callback(new Error('BACKEND.ERROR.USER.NOT_FOUND'));
    }
    var cb = callback;
    if (del) {
      cb = function (err, u) {
        delete user.ids[u.login];
        if (u.groups.length) {
          var GPREFIX = storage.DBPREFIX.GROUP;
          storage.fn.getKeys(
            ld.map(u.groups, function (g) { return GPREFIX + g; }),
            function (err, groups) {
              if (err) { return callback(err); }
              groups = ld.reduce(groups, function (memo, g) {
                if (g.admins.length === 1) {
                  memo.del.push(GPREFIX + g._id);
                } else {
                  ld.pull(g.users, u._id);
                  ld.pull(g.admins, u._id);
                  memo.set[GPREFIX + g._id] = g;
                }
                return memo;
              }, { set: {}, del: [] });
              storage.fn.setKeys(groups.set, function (err) {
                if (err) { return callback(err); }
                storage.fn.delKeys(groups.del, function (err) {
                  if (err) { return callback(err); }
                  callback(null, u);
                });
              });
            }
          );
        } else {
          callback(null, u);
        }
      };
    }
    common.getDel(del, UPREFIX, user.ids[login], cb);
  };

  /**
  * ### set
  *
  * `set` is a function with real user setting into the database and secondary
  * index handling. It takes :
  *
  * - a `u` user object
  * - a `callback` function, returning an *Error* or *null* and the `u` object
  */

  user.fn.set = function (u, callback) {
    storage.db.set(UPREFIX + u._id, u, function (err) {
      if (err) { return callback(err); }
      user.ids[u.login] = u._id;
      return callback(null, u);
    });
  };

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

  user.init = function (callback) {
    storage.db.findKeys(UPREFIX + '*', null, function (err, keys) {
      if (err) { return callback(err); }
      storage.fn.getKeys(keys, function (err, results) {
        if (results) {
          user.ids = ld.transform(results, function (memo, val, key) {
            memo[val.login] = key.replace(UPREFIX, '');
          });
        }
        callback(null);
      });
    });
  };

  /**
  * ### set
  *
  * Creation and update sets the defaults and checks if required fields have
  * been fixed. It takes
  *
  * - a `params` object, with
  *   - optional `_id` string, for update only and existing user
  *   - required `login` string
  *   - required `password` string, between *conf.passwordMin* and
  *   *conf.passwordMax*, will be an object with `hash` and `salt` strings
  *   - optional `email` string, used for communication
  *   - optional `firstname` string
  *   - optional `lastname` string
  *   - optional `organization` string
  *   - optional `color` string
  *   - optional `useLoginAndColorInPads` boolean
  *
  * - a classic `callback` function returning *Error* if error, *null* otherwise
  *   and the user object
  *
  * It takes care of updating correcly the `user.ids` in-memory index.
  * `groups` array and `bookmarks` object can't be fixed here but will be
  * retrieved from database in case of update.
  */

  user.set = function (params, callback) {
    common.addSetInit(params, callback, ['login', 'password']);
    var u = user.fn.assignProps(params);
    u._id = u._id || cuid();
    user.fn.checkLogin(params._id, u, function (err) {
      if (err) { return callback(err); }
      // Update/Edit case
      if (params._id) {
        user.get(u.login, function (err, dbuser) {
          if (err) { return callback(err); }
          u.groups = dbuser.groups;
          u.bookmarks = dbuser.bookmarks;
          user.fn.genPassword(dbuser, u, function (err, u) {
            if (err) { return callback(err); }
            user.fn.set(u, callback);
          });
        });
      } else {
        user.fn.genPassword(null, u, function (err, u) {
          if (err) { return callback(err); }
          user.fn.set(u, callback);
        });
      }
    });
  };

  /**
  *  ### get
  *
  *  User reading
  *
  *  This function uses `user.fn.getDel` and `common.getDel` with `del` to
  *  *false* . It takes mandatory `login` string and `callback` function.
  */

  user.get = ld.partial(user.fn.getDel, false);

  /**
  * ### del
  *
  * User removal
  *
  *  This function uses `user.fn.getDel` and `common.getDel` with `del` to
  *  *true* . It takes mandatory `login` string and `callback` function.
  */
  user.del = ld.partial(user.fn.getDel, true);

  /**
  * ### mark
  *
  * This asynchronous function toggles bookmark from `bookmarks` user field.
  * It takes :
  *
  * - `login` string
  * - `type` field, for example *groups*
  * - `key `database unique *identifier* for model, at the moment *groups* or
  *   *pads*, which existence will be checked with `common.checkExistence`
  * - `callback` function, called with *error* or *null*
  */

  user.mark = function (login, type, key, callback) {
    if (!ld.includes(['pads', 'groups'], type)) {
      throw new TypeError('BACKEND.ERROR.TYPE.TYPE_PADSORGROUPS');
    }
    user.get(login, function (err, u) {
      if (err) { return callback(err); }
      var p = (type === 'pads') ? storage.DBPREFIX.PAD : storage.DBPREFIX.GROUP;
      common.checkExistence(p + key, function (err, res) {
        if (err) { return callback(err); }
        if (!res) {
          return callback(new Error('BACKEND.ERROR.USER.BOOKMARK_NOT_FOUND'));
        }
        if (ld.includes(u.bookmarks[type], key)) {
          ld.pull(u.bookmarks[type], key);
        } else {
          u.bookmarks[type].push(key);
        }
        user.fn.set(u, function (err) {
          if (err) { return callback(err); }
          callback(null);
        });
      });
    });
  };

  /**
  * ## lodash mixins
  *
  * Here are lodash user extensions for MyPads.
  *
  * ### isEmail
  *
  * `isEmail` checks if given string is an email or not. It takes a value and
  * returns a boolean.
  *
  * For reference, used regular expression is :
  * /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  */

  ld.mixin({ isEmail: function (val) {
    var rg = new RegExp(['[a-z0-9!#$%&\'*+/=?^_`{|}~-]+',
      '(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9]',
      '(?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9]',
      '(?:[a-z0-9-]*[a-z0-9])?'].join(''));
    return (ld.isString(val) && rg.test(val));
  }});

  return user;

}).call(this);
