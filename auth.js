/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
var ExtractJwt = require('passport-jwt').ExtractJwt;
var LdapAuth = require('ldapauth-fork');
var settings;
try {
  // Normal case : when installed as a plugin
  settings = require('ep_etherpad-lite/node/utils/Settings');
}
catch (e) {
  if (process.env.TEST_LDAP) {
    settings = {
      "users": {
        "admin": {
          "password": 'admin',
          "is_admin": true
        },
        "parker": {
          "password": 'lovesKubiak',
          "is_admin": false
        }
      },
      "ep_mypads": {
        "ldap": {
          "url": "ldap://rroemhild-test-openldap",
          "bindDN": "cn=admin,dc=planetexpress,dc=com",
          "bindCredentials": "GoodNewsEveryone",
          "searchBase": "ou=people,dc=planetexpress,dc=com",
          "searchFilter": "(uid={{username}})",
          "properties": {
            "login": "uid",
            "email": "mail",
            "firstname": "givenName",
            "lastname": "sn"
          },
          "defaultLang": "fr"
        }
      }
    };
  } else {
    // Testing case : we need to mock the express dependency
    settings = {
      users: {
        admin: { password: 'admin', is_admin: true },
        grace: { password: 'admin', is_admin: true },
        parker: { password: 'lovesKubiak', is_admin: false }
      }
    };
  }
}
var passport = require('passport');
var JWTStrategy = require('passport-jwt').Strategy;
var cuid = require('cuid');

// Local dependencies
var user = require('./model/user.js');
var conf = require('./configuration.js');

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
    adminTokens: {},
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
    var opts = {
      secretOrKey: auth.secret,
      passReqToCallback: true,
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromUrlQueryParameter('auth_token'),
        ExtractJwt.fromBodyField('auth_token'),
        ExtractJwt.fromAuthHeaderWithScheme('JWT')
      ])
    };
    passport.use(new JWTStrategy(opts,
      function (req, jwt_payload, callback) {
        var isFS = function (s) { return (ld.isString(s) && !ld.isEmpty(s)); };
        if (!isFS(jwt_payload.login)) {
          throw new TypeError('BACKEND.ERROR.TYPE.LOGIN_STR');
        }
        if (!ld.isFunction(callback)) {
          throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
        }
        auth.fn.JWTFn(req, jwt_payload, false, callback);
      }
    ));
  };

  /**
  * ### checkMyPadsUser
  *
  * `checkMyPadsUser` checks user existence from given `login` and `pass`. It
  * uses the last argument, `callback` function, to return an *error* or *null*
  * and the *user* object.
  */

  auth.fn.checkMyPadsUser = function (login, pass, callback) {
    if (conf.get('authMethod') === 'ldap') {
      var ldapConf = conf.get('authLdapSettings');
      var lauth    = new LdapAuth(ldapConf);
      lauth.authenticate(login, pass, function(err, ldapuser) {
        lauth.close(function(error) { });
        if (err) {
          var emsg = err;
          // openldap error message || active directory error message
          if (typeof(err.lde_message) === 'string' && (err.lde_message === 'Invalid Credentials' || err.lde_message.match(/data 52e,/))) {
            emsg = 'BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT';
          } else if (
              (typeof(err) === 'string' && err.match(/no such user/)) ||
              (typeof(err.lde_message) === 'string' && (err.lde_message.match(/no such user/) || err.lde_message.match(/data 525,/)))
          ) {
            emsg = 'BACKEND.ERROR.USER.NOT_FOUND';
          } else {
            console.error('LdapAuth error: ', err);
          }
          return callback(new Error(emsg), false);
        }
        user.get(login, function(err, u) {
          if (err) {
            // We have to create the user in mypads database
            var mail;
            var props = ldapConf.properties;
            if (Array.isArray(ldapuser[props.email])) {
              mail = ldapuser[props.email][0];
            } else {
              mail = ldapuser[props.email];
            }
            user.set({
                login: ldapuser[props.login],
                password: 'soooooo_useless',
                firstname: ldapuser[props.firstname],
                lastname: ldapuser[props.lastname],
                email: mail,
                lang: (ldapConf.defaultLang) ? ldapConf.defaultLang : 'en'
              }, callback);
          } else {
            return callback(null, u);
          }
        });
      });
    } else {
      user.get(login, function (err, u) {
        if (err) { return callback(err); }
        auth.fn.isPasswordValid(u, pass, function (err, isValid) {
          if (err) { return callback(err); }
          if (!isValid) {
            var emsg = 'BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT';
            return callback(new Error(emsg), false);
          }
          return callback(null, u);
        });
      });
    }
  };

  /**
  * ### checkAdminUser
  *
  * `checkAdminUser` checks admin existence from given `login` and `pass`. It
  * uses the last argument, `callback` function, to return an *error* or *null*
  * and the *user* object.
  */

  auth.fn.checkAdminUser = function (login, pass, callback) {
    if (!settings || !settings.users || !settings.users[login]) {
      return callback(new Error('BACKEND.ERROR.USER.NOT_FOUND'), null);
    }
    var u = settings.users[login];
    u.login = login;
    var emsg;
    if (pass !== u.password) {
      emsg = 'BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT';
      return callback(new Error(emsg, false));
    }
    if (!u.is_admin) {
      emsg = 'BACKEND.ERROR.AUTHENTICATION.ADMIN';
      return callback(new Error(emsg, false));
    }
    return callback(null, u);
  };


  /**
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

  auth.fn.JWTFn = function (req, jwt_payload, admin, callback) {
    var checkFn = (admin ? auth.fn.checkAdminUser : auth.fn.checkMyPadsUser);
    var ns = (admin ? 'adminTokens' : 'tokens');
    var login = jwt_payload.login;
    var token = auth[ns][login];
    if (!token || !jwt_payload.key) {
      var pass = jwt_payload.password;
      if (!ld.isString(pass)) {
        return callback(new Error('BACKEND.ERROR.TYPE.PASSWORD_STR'));
      }
      checkFn(login, pass, function (err, u) {
        if (err) { return callback(err, u); }
        auth[ns][u.login] = u;
        auth[ns][u.login].key = cuid();
        return callback(null, u);
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
    // if u.visibility is defined, u is a group, which we shouldn't authenticate against LDAP
    if (conf.get('authMethod') === 'ldap' && typeof(u.visibility) === 'undefined') {
      var lauth = new LdapAuth(conf.get('authLdapSettings'));
      if (typeof(u) === 'undefined' || u === null || typeof(u.login) === 'undefined' || u.login === null) {
        return callback(null, false);
      } else {
        lauth.authenticate(u.login, password, function(err, ldapuser) {
          lauth.close(function(error) { });
          if (err) {
            var emsg = err;
            if (err.lde_message === 'Invalid Credentials') {
              err = 'BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT';
            } else if (err.match(/no such user/)) {
              err = 'BACKEND.ERROR.USER.NOT_FOUND';
            }
            console.error('LdapAuth error: ', err);
            return callback(null, false);
          }
          return callback(null, true);
        });
      }
    } else {
      user.fn.hashPassword(u.password.salt, password, function (err, res) {
        if (err) { return callback(err); }
        callback(null, (res.hash === u.password.hash));
      });
    }
  };

  /**
  * ## Public functions
  *
  * ### init
  *
  * `init` is a synchronous function used to set up authentification. It :
  *
  * - initializes local strategy by default
  * - uses of passport middlwares for express
  * - launch session middleware bundled with express, using secret phrase saved
  *   in database
  * - mocks admin behavior if in testingMode
  */

  auth.init = function (app) {
    app.use(passport.initialize());
    auth.fn.local();
  };

  return auth;

}).call(this);
