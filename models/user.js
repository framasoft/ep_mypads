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
    };
    if (!(isFullString(params.login) && isFullString(params.password))) {
      throw(new TypeError('login and password must be strings'));
    }
    if (!ld.isFunction(callback)) {
      throw(new TypeError('callback must be a function'));
    }
    var _keys = [conf.PREFIX + 'passwordMin', conf.PREFIX + 'passwordMax'];
    storage.fns.getKeys(_keys, function (err, results) {
      if (err) { return callback(err); }
      var _params = ld.assign(results, { password: params.password });
      user.helpers._checkPassword(_params, function (err) {
        if (err) { return callback(err); }
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

  user.del = ld.noop;

  /**
  *  ## Helpers
  */

  user.helpers = {};

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
  */

  user.helpers._checkPassword = function (params, callback) {
    var pass = params.password;
    var min = params[conf.PREFIX + 'passwordMin'];
    var max = params[conf.PREFIX + 'passwordMax'];
    if (pass.length < min || pass.length > max) {
      callback(new TypeError('password length must be between ' + min +
        ' and ' + min + ' characters'));
    } else {
      callback(null);
    }
  };

  /**
  *  `hashPassword` takes the password and returns a hashed password, for storing
  *  in database and verification.
  */

  user.helpers._hashPassword = function() {};

  return user;

}).call(this);
