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

/**
*  ## Description
*  
*  The `user` is the masterpiece of the MyPads plugin.
*/

  var user = {};
  // Database key prefix for users
  user.PREFIX = 'mypads:user:';

  /**
  * The creation sets the defaults and checks if required fields have been
  * fixed. It takes :
  *
  * - a parameters object, with
  *   - required login string
  *   - required password string, between conf.passwordMin and conf.passwordMax
  *   - optional email string, used for communicartion
  *   - firstname string
  *   - lastname string
  *   - organization string
  *
  * - a classic `callback` function returning error if error, null otherwise
  *   and the user object;
  * - a special `edit` boolean, defaults to *false* for reusing the function for
  *   add, set (edit).
  *
  */

  user.add = function(params, callback, edit) {
    edit = edit || false;
    if (ld.isUndefined(params)) {
      throw(new TypeError('parameters are mandatory for user creation'));
    }
    var isFullString = function (s) {
      return (ld.isString(s) && !ld.isEmpty(s));
    };
    if (!(isFullString(params.login) && isFullString(params.password))) {
      throw(new TypeError('login and password must be strings'));
    }
    if (!ld.isFunction(callback)) {
      throw(new TypeError('callback must be a function'));
    }
    user.fn.getPasswordConf(function (err, results) {
      if (err) { return callback(err); }
      var _params = ld.assign(results, { password: params.password });
      user.fn.checkPassword(_params, function (err) {
        if (err) { return callback(err); }
        var u = user.fn.assignUserProps(params);
        var ukey = user.PREFIX + u.login;
        var _final = function () {
          storage.db.set(ukey, u, function (err) {
            if (err) { return callback(err); }
            return callback(null, u);
          });
        };
        if (edit) {
          _final();
        } else {
          user.fn.checkUserExistence(ukey, function (err) {
            if (err) { return callback(err); } else { _final(); }
          });
        }
      });
    });
  };

  /**
  *  User reading
  */

  user.get = ld.noop;

  /**
  *  The modification of an user can be done for every field.
  *  In fact `user.add| with special attribute add to false.
  *  Please refer to `user.add` for documentation.
  */

  user.set = ld.partialRight(user.add, true);

  /**
  * User removal
  */

  user.del = ld.noop;

  /**
  *  ## Internal Functions
  */

  user.fn = {};

  /**
  * `getPasswordConf` is an asynchronous function that get from database values
  * for minimum and maximum passwords. It takes a `callback` function as unique
  * argument called with error or null and results.
  * Internally, it uses `storage.getKeys`.
  */
  user.fn.getPasswordConf = function (callback) {
    var _keys = [conf.PREFIX + 'passwordMin', conf.PREFIX + 'passwordMax'];
    storage.fn.getKeys(_keys, function (err, results) {
      if (err) { return callback(err); }
      return callback(null, results);
    });
  };

  /**
  *  `checkPassword` is a private helper aiming at respecting the minimum
  *  length fixed into MyPads configuration.
  *
  *  It takes a params argument, with fields :
  *
  *    - `passwordMin` size
  *    - `passwordMax` size
  *    - `password` string
  *
  *  It calls the callback function argument, with an error message if the
  *  verification has failed, null otherwise.
  *  FIXME: not an asynchronous fn, callback not relevant
  */

  user.fn.checkPassword = function (params, callback) {
    var pass = params.password;
    var min = params[conf.PREFIX + 'passwordMin'];
    var max = params[conf.PREFIX + 'passwordMax'];
    if (pass.length < min || pass.length > max) {
      return callback(new TypeError('password length must be between ' + min +
        ' and ' + max + ' characters'));
    } else {
      callback(null);
    }
  };

  /**
  *  `hashPassword` takes the password and returns a hashed password, for
  *  storing in database and verification.
  */

  user.fn.hashPassword = function() {};

  /**
  * `assignUserProps` takes params object and assign defaults if needed.
  * It returns the user object.
  */

  user.fn.assignUserProps = function (params) {
    var u = ld.reduce(['firstname', 'lastname', 'organization'],
      function (res, v) {
        res[v] = ld.isString(params[v]) ? params[v] : '';
        return res;
    }, {});
    u.email = (ld.isEmail(params.email)) ? params.email : '';
    u = ld.assign({ login: params.login, password: params.password }, u);
    return u;
  };

  /**
  * `checkUserExistence` is an asynchronous function that takes
  * - the full `key` composed by user.PREFIX and user login
  * - a callback function, returnning an error if the user exists, null if not
  */
  user.fn.checkUserExistence = function (ukey, callback) {
    storage.db.get(ukey, function(err, res) {
      if (err) { return callback(err); }
      if (res) {
        var e = 'User already exists, please choose another login';
        return callback(new Error(e));
      }
      return callback(err ? err : null);
    });
  };

  /**
  * ## lodash mixins
  *
  * Here are lodash extensions for MyPads.
  *
  * `isEmail` checks if given string is an email or not. It takes a value and
  * returns a boolean.
  */
  ld.mixin({ isEmail: function (val) {
    var rg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return (ld.isString(val) && rg.test(val)); 
  }});

  return user;

}).call(this);
