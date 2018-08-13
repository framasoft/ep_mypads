/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Group Model
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
  var hashPassword = require('./common.js').hashPassword;

  /**
  * ## Description
  *
  * This module regroups shared functions for group and pad models.
  */

  var commonGroupPad = {};

  /**
  * ### handlePassword
  *
  * `handlePassword` is a function that ensures if `visibility` is *private*, a
  * password has been filled. Also, it encrypts the given password with a salt,
  * using `common.hashPassword`. It takes :
  *
  * - `params` group object
  * - `callback` function, called with *null* if `visibility` isn't *private* or
  *   if the password is an object, or with an error or *null* and the *password*
  *   object
  */

  commonGroupPad.handlePassword = function (params, callback) {
    if ((params.visibility !== 'private') || ld.isObject(params.password)) {
      return callback(null);
    }
    if (!ld.isString(params.password) || ld.isEmpty(params.password)) {
      var err = new Error('BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT');
      return callback(err);
    }
    hashPassword(undefined, params.password, function (err, res) {
      if (err) { return callback(err); }
      callback(null, res);
    });
  };

  return commonGroupPad;


}).call(this);
