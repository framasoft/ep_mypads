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
  var ld = require('lodash');
  var storage = require('../storage.js');
  var conf = require('../configuration.js');
  var common = require('./common.js');

/**
*  ## Description
*
*  The `user` is the masterpiece of the MyPads plugin.
*/

  var user = {};
  // Database key PREFIX for users
  user.DBPREFIX = 'mypads:user:';

  /**
  * ## Public Functions
  *
  * ### add
  *
  * The creation sets the defaults and checks if required fields have been
  * fixed. It takes :
  *
  * - a `params` object, with
  *   - required `login` string
  *   - required `password` string, between *conf.passwordMin* and
  *   *conf.passwordMax*
  *   - optional `email` string, used for communication
  *   - optional `firstname` string
  *   - optional `lastname` string
  *   - optional `organization` string
  *
  * - a classic `callback` function returning error if error, null otherwise
  *   and the user object;
  * - a special `edit` boolean, defaults to *false* for reusing the function for
  *   set (edit) an existing user.
  */

  user.add = function (params, callback, edit) {
    edit = !!edit;
    common.addSetInit(params, callback);
    var isFullStr = function (s) { return (ld.isString(s) && !ld.isEmpty(s)); };
    if (!(isFullStr(params.login) && isFullStr(params.password))) {
      throw(new TypeError('login and password must be strings'));
    }
    user.fn.getPasswordConf(function (err, results) {
      if (err) { return callback(err); }
      var _params = ld.assign(results, { password: params.password });
      var e = user.fn.checkPassword(_params);
      if (e) { return callback(e); }
      var u = user.fn.assignProps(params);
      var ukey = user.DBPREFIX + u.login;
      var _final = function () {
        storage.db.set(ukey, u, function (err) {
          if (err) { return callback(err); }
          return callback(null, u);
        });
      };
      if (edit) {
        _final();
      } else {
        common.checkExistence(ukey, function (err, res) {
          if (err) { return callback(err); }
          if (res) {
            var e = 'user already exists, please choose another login';
            return callback(new Error(e));
          }
          _final();
        });
      }
    });
  };

  /**
  *  ### get
  *
  *  User reading
  *
  *  This function uses `common.getDel` with `del` to *false* and DBPREFIX
  *  fixed.  It will takes mandatory key string and callback function. See
  *  `common.getDel` for documentation.
  */

  user.get = ld.partial(common.getDel, false, user.DBPREFIX);

  /**
  *  ### set
  *
  *  The modification of an user can be done for every field.
  *  In fact `user.add` with special attribute `add` to *false*.
  *  Please refer to `user.add` for documentation.
  */

  user.set = ld.partialRight(user.add, true);

  /**
  * ### del
  *
  * User removal
  *
  *  This function uses `common.getDel` with `del` to *false* and DBPREFIX
  *  fixed.  It will takes mandatory key string and callback function. See
  *  `common.getDel` for documentation.
  */

  user.del = ld.partial(common.getDel, true, user.DBPREFIX);

  /**
  *  ## Internal Functions
  */

  user.fn = {};

  /**
  * ### getPasswordConf
  *
  * `getPasswordConf` is an asynchronous function that get from database values
  * for minimum and maximum passwords. It takes a `callback` function as unique
  * argument called with error or null and results.
  * Internally, it uses `storage.getKeys`.
  */

  user.fn.getPasswordConf = function (callback) {
    var _keys = [conf.DBPREFIX + 'passwordMin', conf.DBPREFIX + 'passwordMax'];
    storage.fn.getKeys(_keys, function (err, results) {
      if (err) { return callback(err); }
      return callback(null, results);
    });
  };

  /**
  * ### checkPassword
  *
  *  `checkPassword` is a private helper aiming at respecting the minimum
  *  length fixed into MyPads configuration.
  *
  *  It takes a params argument, with fields
  *
  *    - `passwordMin` size
  *    - `passwordMax` size
  *    - `password` string
  *
  *  It returns an error message if the verification has failed.
  */

  user.fn.checkPassword = function (params) {
    var pass = params.password;
    var min = params[conf.DBPREFIX + 'passwordMin'];
    var max = params[conf.DBPREFIX + 'passwordMax'];
    if (pass.length < min || pass.length > max) {
      return new TypeError('password length must be between ' + min + ' and ' +
      max + ' characters');
    }
  };

  /**
  *  ### hashPassword
  *
  *  TODO: `hashPassword` takes the password and returns a hashed password, for
  *  storing in database and verification.
  */

  user.fn.hashPassword = ld.noop;

  /**
  * ### assignProps
  *
  * `assignProps` takes params object and assign defaults if needed.  It adds a
  * `groups` array field, which will holds `model.group` of pads ids.  It
  * returns the user object.
  */

  user.fn.assignProps = function (params) {
    var u = ld.reduce(['firstname', 'lastname', 'organization'],
      function (res, v) {
        res[v] = ld.isString(params[v]) ? params[v] : '';
        return res;
    }, {});
    u.email = (ld.isEmail(params.email)) ? params.email : '';
    u.groups = [];
    u = ld.assign({ login: params.login, password: params.password }, u);
    return u;
  };

  /**
  * ## lodash mixins
  *
  * Here are lodash extensions for MyPads.
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
