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
  var db = require('../db.js');
  var conf = require('../configuration.js');

/**
*  ## Description
*  
*  The `user` is the masterpiece of the MyPads plugin. A user is defined by :
*  
*  - required
*    - login
*    - password
*
*  - optional
*    - firstname
*    - lastname
*    - organization.
*/

  var user = {};

  /**
  * The creation sets the defaults and checks if required fields have been
  * fixed. It takes :
  *
  * - a parameters object, with
  *   - login string
  *   - password string, between config.passwordMin and
  *   config.passwordMax
  *
  * - a classic `callback` function returning error if error, null otherwise
  *   and the result
  */

  user.add = function(params, callback) {
    if (ld.isUndefined(params)) {
      throw(new TypeError('parameters are mandatory for user creation'));
    }
    var isFullString = function (s) {
      return (ld.isString(s) && !ld.isEmpty(s));
    }
    if (!(isFullString(params.login) && isFullString(params.password))) {
      throw(new TypeError('login and password must be strings'));
    }
    if (!ld.isFunction(callback)) {
      throw(new TypeError('callback must be a function'));
    }
    var pass = params.password;
    var checkPass = function (callback) {
      if (pass.length < passwordMin || pass.length > passwordMax) {
      return callback(new TypeError('password length must be between ' +
        passwordMin + ' and ' + passwordMax + ' characters'));
      }
      callback();
    };
    var passwordMin;
    var passwordMax;
    db.get(conf.PREFIX + 'passwordMin', function (err, res) {
      if (err) { return callback(err); }
      passwordMin = res;
      db.get(conf.PREFIX + 'passwordMax', function (err, res) {
        if (err) { return callback(err); }
        passwordMax = res;
        checkPass(callback);
      });
    });
    // FIXME
    //return params;
  };

  /**
  *  User reading
  */

  user.get = ld.noop;

  /**
  *  The modification of an user can be done for every field.
  */

  user.set = function(params, callback) {};

  /**
  * User removal
  */

  user.remove = ld.noop;

  /**
  *  ## Helpers
  */

  user.helpers = {};

  /**
  *  `checkPassword` is a private helper whose the aims are :
  *  
  *  - respecting the minimum length fixed into MyPads configuration
  *  - allowing only string.
  *   
  *  It returns an error message if the verification has failed.
  */

  user.helpers._checkPassword = function(password) {};

  /**
  *  `hashPassword` takes the password and returns a hashed password, for storing
  *  in database and verification.
  */

  user.helpers.hashPassword = function() {};

  return user;

}).call(this);
