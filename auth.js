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
var session;
var cookieParser;
var testMode = false;
try {
  // Normal case : when installed as a plugin
  session = require('../ep_etherpad-lite/node_modules/express-session');
  cookieParser = require('../ep_etherpad-lite/node_modules/cookie-parser');
}
catch (e) {
  // Testing case : we need to mock the express dependency
  testMode = true;
  session = require('express-session');
  cookieParser = require('cookie-parser');
}
var passport = require('passport');
var JWTStrategy = require('passport-jwt').Strategy;
var cuid = require('cuid');
// secret per express-session
var secret = cuid();

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
  *
  * These functions are not private like with closures, for testing purposes,
  * but they are expected be used only internally by other MyPads functions.
  */

  auth.fn = {};

  /**
  * ### local
  *
  * `local` is a synchronous function used to set up JWT strategy.
  */

  auth.fn.local = function () {
    passport.serializeUser(function(user, done) {
      done(null, user.login);
    });
    passport.deserializeUser(function(id, done) {
      user.get(id, done);
    });
    passport.use(new JWTStrategy({ secretOrKey: secret },
      function (jwt_payload, callback) {
        var isFS = function (s) { return (ld.isString(s) && !ld.isEmpty(s)); };
        if (!isFS(jwt_payload.login)) {
          throw new TypeError('BACKEND.ERROR.TYPE.LOGIN_STR');
        }
        if (!isFS(jwt_payload.password)) {
          throw new TypeError('BACKEND.ERROR.TYPE.PASSWORD_STR');
        }
        if (!ld.isFunction(callback)) {
          throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
        }
        auth.fn.localFn(jwt_payload.login, jwt_payload.password, callback);
      }
    ));
  };


  /**
  * ### localFn
  *
  * `localFn` is the function used by `localStrategy` for verifying if login and
  * password are correct. It takes :
  *
  * - a `login` string
  * - a `password` string
  * - a `callback` function, returning
  *   - *Error* if there is a problem
  *   - *null*, *false* and an object for auth error
  *   - *null* and the *user* object for auth success
  */

  auth.fn.localFn = function (login, password, callback) {
    user.get(login, function (err, u) {
      if (err) { return callback(err); }
      auth.fn.isPasswordValid(u, password, function (err, isValid) {
        if (err) { return callback(err); }
        if (!isValid) {
          var emsg = 'BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT';
          callback(new Error(emsg), false);
        } else {
          callback(null, u);
        }
      });
    });
  };

  /**
  * ### isPasswordValid
  *
  * `isPasswordValid` compares the hash of given password and saved salt with
  * the one saved in database.
  * It takes :
  *
  * - the `u` user object
  * - the `password` string
  * - a `callback` function, returning *Error* or *null* and a boolean
  */

  auth.fn.isPasswordValid = function (u, password, callback) {
    if (!ld.isString(password)) {
      return callback(new TypeError('BACKEND.ERROR.TYPE.PASSWORD_MISSING'));
    }
    user.fn.hashPassword(u.password.salt, password, function (err, res) {
      if (err) { return callback(err); }
      callback(null, (res.hash === u.password.hash));
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
  * - uses of passport middlwares for express
  * - launch session middleware bundled with express, using secret phrase saved
  *   in database
  * - mocks admin behavior if in testingMode
  */

  auth.init = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());
    if (testMode) {
      app.use(cookieParser());
      var cuid = require('cuid');
      var hour = 3600000;
      app.use(session({
        secret: cuid(),
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: hour }
      }));
      app.get('/admin', function (req, res) {
        req.session.user = { is_admin: true };
        return res.status(200).send({ success: true });
      });
      app.get('/admin/logout', function (req, res) {
        req.session.user = { is_admin: false };
        return res.status(200).send({ success: true });
      });
    }
    auth.fn.local();
  };

  return auth;

}).call(this);
