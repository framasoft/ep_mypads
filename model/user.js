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
  var ld = require('lodash');
  var cuid = require('cuid');
  var slugg = require('slugg');
  var asyncMod = require('async');
  var conf = require('../configuration.js');
  var storage = require('../storage.js');
  var common = require('./common.js');
  var userCache = require ('./user-cache.js');
  var deleteGroup = require('./group.js').del;
  var UPREFIX = storage.DBPREFIX.USER;
  var CPREFIX = storage.DBPREFIX.CONF;
  var auth;

  /**
  *  ## Description
  *
  * The `user` is the masterpiece of the MyPads plugin.
  *
  * It initially contains :
  *
  * - `logins`, an in memory object to map `_id` to `login` field and ensures
  *   uniqueness of logins
  * - `emails`, which have the same purpose for emails
  */

  var user = {};

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
        common.hashPassword(null, u.password, function (err, pass) {
          if (err) { return callback(err); }
          u.password = pass;
          callback(null, u);
        });
      };
      if (old) {
        var oldp = old.password;
        common.hashPassword(oldp.salt, u.password, function (err, p) {
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
  * ### assignProps
  *
  * `assignProps` takes `params` object and assign defaults if needed. It adds
  * a `groups` array field, which will hold `model.group` of pads ids. It also
  * adds a `userlists` object, with uid keys and userlist Object (name field,
  * users array). It returns the user object.
  */

  user.fn.assignProps = function (params) {
    var p = params;
    var u = ld.reduce(['firstname', 'lastname', 'organization', 'color', 'padNickname'],
      function (res, v) {
        res[v] = ld.isString(p[v]) ? p[v] : '';
        return res;
    }, {});
    u.groups = [];
    u.bookmarks = { groups: [], pads: [] };
    u.userlists = {};
    if (!p._id) { u.active = !conf.get('checkMails'); }
    if (ld.isBoolean(p.useLoginAndColorInPads)) {
      u.useLoginAndColorInPads = p.useLoginAndColorInPads;
    } else {
      u.useLoginAndColorInPads = true;
    }
    if (ld.isBoolean(p.hideHelp)) {
      u.hideHelp = p.hideHelp;
    } else {
      u.hideHelp = false;
    }
    var langs = ld.keys(conf.cache.languages);
    var defaultLang = conf.get('defaultLanguage');
    u.lang = (ld.includes(langs, p.lang) ? p.lang : defaultLang);
    return ld.assign({
      _id: p._id,
      login: p.login,
      password: p.password,
      email: p.email
    }, u);
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
      var exists = (!ld.isUndefined(userCache.logins[u.login]) ||
        (ld.includes(ld.values(userCache.logins), u._id)));
      if (exists) {
        var e = new Error('BACKEND.ERROR.USER.ALREADY_EXISTS');
        return callback(e);
      }
      return callback(null);
    } else {
      // u.login has changed for existing user
      if (ld.isUndefined(userCache.logins[u.login])) {
        var key = ld.findKey(userCache.logins, function (uid) {
          return uid === _id;
        });
        delete userCache.logins[key];
      }
      return callback(null);
    }
  };

  /**
  * ### checkEmail
  *
  * This is a function which check if email is already taken for new
  * users and if the email has changed for existing users (updates).
  *
  * It takes, as arguments
  *
  * - the given `id`, from `params._id` from `user.set`
  * - the assigned `u` user object
  * - a callback
  *
  * It returns, through the callback, an *Error* if the email is already here,
  * *null* otherwise.
  */

  user.fn.checkEmail = function (_id, u, callback) {
    if (!_id) {
      var exists = (!ld.isUndefined(userCache.emails[u.email]) ||
        (ld.includes(ld.values(userCache.emails), u._id)));
      if (exists) {
        var e = new Error('BACKEND.ERROR.USER.EMAIL_ALREADY_EXISTS');
        return callback(e);
      }
      return callback(null);
    } else {
      if (ld.isUndefined(userCache.emails[u.email])) {
        var key = ld.findKey(userCache.emails, function (uid) {
          return uid === _id;
        });
        delete userCache.emails[key];
      }
      return callback(null);
    }
  };


  /**
  * ### getDel
  *
  * Local `getDel` wrapper that uses `user` in memory indexes to ensure
  * uniqueness of login, email and _id fields before returning `common.getDel`
  * with *UPREFIX* fixed.
  * It also handles secondary indexes for *model.group* elements and removes
  * all groups where the user was the only administrator.
  *
  * It takes the mandatory `loginOrEmail` string as argument and return an
  * error if login already exists. It also takes a mandatory `callback`
  * function.
  *
  */

  user.fn.getDel = function (del, loginOrEmail, callback) {
    if (!ld.isString(loginOrEmail) || ld.isEmpty(loginOrEmail)) {
      throw new TypeError('BACKEND.ERROR.TYPE.LOGIN_STR');
    }
    var uid = userCache.logins[loginOrEmail] || userCache.emails[loginOrEmail];
    if (ld.isUndefined(uid)) {
      return callback(new Error('BACKEND.ERROR.USER.NOT_FOUND'));
    }
    var cb = callback;
    if (del) {
      cb = function (err, u) {
        delete userCache.logins[u.login];
        delete userCache.emails[u.email];
        delete userCache.firstname[u._id];
        delete userCache.lastname[u._id];
        if (u.groups.length) {
          var GPREFIX = storage.DBPREFIX.GROUP;
          storage.fn.getKeys(
            ld.map(u.groups, function (g) { return GPREFIX + g; }),
            function (err, groups) {
              if (err) { return callback(err); }
              groups = ld.reduce(groups, function (memo, g) {
                if (g.admins.length === 1) {
                  memo.del.push(g._id);
                } else {
                  ld.pull(g.users, u._id);
                  ld.pull(g.admins, u._id);
                  memo.set[GPREFIX + g._id] = g;
                }
                return memo;
              }, { set: {}, del: [] });
              storage.fn.setKeys(groups.set, function (err) {
                if (err) { return callback(err); }
                asyncMod.map(groups.del, deleteGroup, function(err) {
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
    common.getDel(del, UPREFIX, uid, cb);
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
      userCache.logins[u.login]    = u._id;
      userCache.emails[u.email]    = u._id;
      userCache.firstname[u._id] = u.firstname;
      userCache.lastname[u._id]  = u.lastname;
      if (!auth) { auth = require('../auth.js'); }
      ld.assign(auth.tokens[u.login], u);
      return callback(null, u);
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
  *   - required `email` string, used for communication
  *   - optional `firstname` string
  *   - optional `lastname` string
  *   - optional `padNickname` string
  *   - optional `organization` string
  *   - optional `color` string
  *   - optional `useLoginAndColorInPads` boolean
  *
  * - a classic `callback` function returning *Error* if error, *null* otherwise
  *   and the user object
  *
  * It takes care of updating correcly the `userCache.logins` and `userCache.emails`
  * in-memory indexes. `groups` array and `bookmarks` object can't be fixed
  * here but will be retrieved from database in case of update.
  */

  user.set = function (params, callback) {
    common.addSetInit(params, callback, ['login', 'password']);
    if (!ld.isEmail(params.email)) {
      throw new TypeError('BACKEND.ERROR.TYPE.MAIL');
    }
    var u = user.fn.assignProps(params);
    user.fn.checkLogin(params._id, u, function (err) {
      if (err) { return callback(err); }
      user.fn.checkEmail(params._id, u, function (err) {
        if (err) { return callback(err); }
        // Update/Edit case
        if (params._id) {
          u._id = params._id;
          user.get(u.login, function (err, dbuser) {
            if (err) { return callback(err); }
            ld.assign(u, ld.pick(dbuser,
              ['ctime', 'groups', 'bookmarks', 'userlists', 'active']));
            user.fn.genPassword(dbuser, u, function (err, u) {
              if (err) { return callback(err); }
              user.fn.set(u, callback);
            });
          });
        } else {
          u._id = (slugg(u.login) + '-' + cuid.slug());
          u.ctime = Date.now();
          user.fn.genPassword(null, u, function (err, u) {
            if (err) { return callback(err); }
            user.fn.set(u, callback);
          });
        }
      });
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
  * ### userlist
  *
  * This asynchronous function handles creation, update, removal of user lists.
  * It also return all userlists with readable users when needed.
  * It takes:
  *
  * - a JS object with fields :
  *
  *   - `crud` element, that must be either *get*, *add*, *set*, or *del* for
  *   creation, update and removal;
  *   - `login`, mandatory for the targeted user;
  *   - `ulistid`, mandatory in case of *set* or *del*;
  *   - optional `uids` element, an array of user unique identifiers. If
  *   absent, creation will be done without users and update won't update
  *   current list of users;
  *   - a `name` for the group, required in case of creation, optional
  *   otherwise (only usefull in case of *set*)
  *
  * - a `callback` function, for error and result, the whole user object.
  *
  *   `userlist` takes care of arguments, user existence and filters them on
  *   creation and update. For performance reason, all userlists are not
  *   updated when an user is removed from MyPads but only when the userlist
  *   itself is updated.
  */

  user.userlist = function (opts, callback) {
    if (!ld.isFunction(callback)) {
      throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
    }
    var crudType = ['get', 'add', 'set', 'del'];
    if (!ld.includes(crudType, opts.crud)) {
      throw new TypeError('BACKEND.ERROR.TYPE.USERLIST_CRUD');
    }
    if ((ld.includes(['set', 'del'], opts.crud)) &&
      (ld.isUndefined(opts.ulistid))) {
        throw new TypeError('BACKEND.ERROR.TYPE.USERLIST_ID');
    }
    if ((opts.crud === 'add') && (!ld.isString(opts.name))) {
      throw new TypeError('BACKEND.ERROR.TYPE.USERLIST_NAME');
    }
    if ((opts.crud === 'set') && 
      (ld.every([opts.name, opts.uids], ld.isUndefined))) {
        return callback(new Error('BACKEND.ERROR.USER.USERLIST_SET_PARAMS'));
    }
    user.get(opts.login, function (err, u) {
      if (err) { return callback(err); }
      var setUids = function () {
        var allUids = ld.values(userCache.logins);
        var uids = ld.filter(opts.uids, ld.partial(ld.includes, allUids));
        u.userlists[opts.ulistid].uids = uids;
      };
      switch (opts.crud) {
        case 'get':
          var keys = ld.reduce(u.userlists, function (memo, ul) {
            return memo.concat(ul.uids);
          }, []);
          keys = ld.map(ld.uniq(keys), function (k) { return UPREFIX + k; });
          storage.fn.getKeys(keys, function (err, results) {
            if (err) { return callback(err); }
            results = ld.transform(results, function (memo, v, k) {
              memo[k] = ld.pick(v, '_id', 'login', 'firstname', 'lastname',
                'email', 'padNickname');
            });
            u.userlists = ld.reduce(u.userlists, function (memo, ul, k) {
              ul.users = ld.map(ul.uids, function (uid) {
                return results[UPREFIX + uid];
              });
              memo[k] = ul;
              return memo;
            }, {});
            return callback(null, u);
          });
          break;
        case 'add':
          opts.ulistid = (slugg(opts.name) + '-' + cuid.slug());
          u.userlists[opts.ulistid] = { name: opts.name };
          if (opts.uids) {
            setUids();
          } else {
            u.userlists[opts.ulistid].uids = [];
          }
          break;
        case 'set':
          if (!u.userlists[opts.ulistid]) {
            return callback(new Error('BACKEND.ERROR.USER.USERLIST_NOT_FOUND'));
          }
          if (opts.name) {
            u.userlists[opts.ulistid].name = opts.name;
          }
          if (opts.uids) { setUids(); }
          break;
        case 'del':
          if (!u.userlists[opts.ulistid]) {
            return callback(new Error('BACKEND.ERROR.USER.USERLIST_NOT_FOUND'));
          }
          delete u.userlists[opts.ulistid];
          break;
      }
      if (opts.crud !== 'get') {
        user.fn.set(u, function (err) {
          if (err) { return callback(err); }
          user.userlist({ crud: 'get', login: opts.login }, function (err, u) {
            if (err) { return callback(err); }
            return callback(null, u);
          });
        });
      }
    });
  };

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

  return user;

}).call(this);
