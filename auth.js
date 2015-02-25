/**
*  # Authentification Module
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
*
*  ## Description
*
*  This module contains all functions about authentification of MyPads users.
*  It's mainly based upon the excellent *passport* Node library.
*
*  TODO : usage of JWT instead of session-based strategy.
*/

// External dependencies
var ld = require('lodash');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

// Local dependencies
var user = require('./model/user.js');

module.exports = (function () {
  'use strict';

  /**
  * ## Authentification functions
  */

  var auth = {};

  /**
  * ## Internal functions
  */

  auth.fn = {};

  /**
  * ### local
  *
  * `local` is a synchronous function used to set up local strategy.
  * It takes :
  *
  * - a `login` string,
  * - a `password` string,
  * - a `callback` function, returning
  *   - an *Error* if there is one
  *   - *null*, *false* and an Object describing the problem if
  *   authentification fails
  *   - *null* and the `model.user` object otherwise
  *
  * It uses `model.user` internally.
  */

  auth.fn.local = function () {
    passport.use(new localStrategy({
      usernameField: 'login',
      passwordField: 'password'
    },
    function (login, password, callback) {
      user.get(login, function (err, u) {
        if (err) { return callback(err); }
        if (auth.checkPassword(u, password)) {
          callback(null, u);
        } else {
          callback(null, false, { message: 'login or user are not correct' });
        }
      });
    }));
  };

  /**
  * ### isPasswordValid
  *
  * `isPasswordValid` compares the hash of given password and saved salt with
  * the one saved in database.
  * It takes :
  *
  * - the `u` user object,
  * - the `password` string,
  * - a `callback` function, returning *Error* or *null* and a boolean
  */

  auth.fn.isPasswordValid = function (u, password, callback) {
    user.fn.hashPassword(u.password.salt, password, function (err, res) {
      if (err) { callback(err); }
      if (res.hash === u.password.hash) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    });
  };

  /**
  * ## Public functions
  *
  * ### init
  *
  * `iniŧ` is a synchronous function used to set up authentification. It :
  *
  * - initializes local strategy by default
  *
  */

  auth.init = function (app) {
    auth.fn.local();
  };


  return auth;

}).call(this);
