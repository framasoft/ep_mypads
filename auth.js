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
*  It's mainly based upon the excellent *passport* and *jsonwebtoken* Node
*  libraries.
*
*  TODO: abstract passport.authenticate to allow more easily custom errors
*/

// External dependencies
var ld = require('lodash');
var jwt = require('jsonwebtoken');
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

// Local dependencies
var user = require('./model/user.js');

module.exports = (function () {
  'use strict';

  /**
  * ## Authentification
  *
  * - `tokens` holds all actives tokens with user logins as key and user data
  *   as value, plus a special `key` attribute to check validity
  * - `secret` is the temporary random string key. It will be reinitialized
  *   after server relaunch, invaliditing all active users
  */

  var auth = {
    tokens: {},
    secret: cuid() // secret per etherpad session
  };

  /**
  * ## Internal functions
  *
  * These functions are not private like with closures, for testing purposes,
  * but they are expected be used only internally by other MyPads functions.
  */

  auth.fn = {};

  /**
  * ### getUser
  *
  * `getUser` is a synchronous function that checks if the given encrypted
  * `token` is valid, ie if login has been already found in local cache and if
  * the given key is the same as the generated one.
  * It returns the *user* object in case of success and *false* otherwise.
  *
  * TODO: unit test missing
  */

  auth.fn.getUser = function (token) {
    var jwt_payload = jwt.decode(token, auth.secret);
    if (!jwt_payload) { return false; }
    var login = jwt_payload.login;
    var userAuth = (login && auth.tokens[login]);
    if (userAuth && (auth.tokens[login].key === jwt_payload.key)) {
      return auth.tokens[login];
    } else {
      return false;
    }
  };

  /**
  * ### local
  *
  * `local` is a synchronous function used to set up JWT strategy.
  */

  auth.fn.local = function () {
    var opts = { secretOrKey: auth.secret, passReqToCallback: true };
    passport.use(new JWTStrategy(opts,
      function (req, jwt_payload, callback) {
        //var fail = this.fail;
        var isFS = function (s) { return (ld.isString(s) && !ld.isEmpty(s)); };
        if (!isFS(jwt_payload.login)) {
          //return fail(new TypeError('BACKEND.ERROR.TYPE.LOGIN_STR'), 400);
          throw new TypeError('BACKEND.ERROR.TYPE.LOGIN_STR');
        }
        if (!ld.isFunction(callback)) {
          throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
        }
        auth.fn.JWTFn(req, jwt_payload, callback);
      }
    ));
  };

  /*
  * ### JWTFn
  *
  * `JWTFn` is the function used by JWT strategy for verifying if used
  * encrypted jwt token is correct. It takes:
  *
  * - the `req` Express request object, automatically populated from the
  *   strategy
  * - the JWT decoded token `jwt_payload` object
  * - a `password` string
  * - a `callback` function, returning
  *   - *Error* if there is a problem
  *   - *null*, *false* and an object for auth error
  *   - *null* and the *user* or *token* object for auth success
  *
  *  TODO: expiration handling?
  */

  auth.fn.JWTFn = function (req, jwt_payload, callback) {
    var login = jwt_payload.login;
    var token = auth.tokens[login];
    if (!token || !jwt_payload.key) {
      var pass = jwt_payload.password;
      if (!ld.isString(pass)) {
        return callback(new Error('BACKEND.ERROR.TYPE.PASSWORD_STR'));
      }
      user.get(login, function (err, u) {
        if (err) { return callback(err); }
        auth.fn.isPasswordValid(u, pass, function (err, isValid) {
          if (err) { return callback(err); }
          if (!isValid) {
            var emsg = 'BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT';
            return callback(new Error(emsg), false);
          }
          auth.tokens[login] = u;
          auth.tokens[login].key = cuid();
          return callback(null, u);
        });
      });
    } else {
      if (token.key !== jwt_payload.key) {
        var emsg = 'BACKEND.ERROR.AUTHENTICATION.NOT_AUTH';
        return callback(new Error(emsg), false);
      }
      req.mypadsLogin = login;
      callback(null, token);
    }
  };

  /**
  * ### localFn
  *
  * `localFn` is a function that checks if login and password are correct. It
  * takes :
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
