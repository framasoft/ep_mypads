/**
*  # Socket.io Module
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
*  This module holds all public functions, used for the WebSocket API of
*  mypads. Please refer to binded function when no details are given.
*/

// External dependencies
var ld = require('lodash');
var passport = require('passport');
var express;
try {
  // Normal case : when installed as a plugin
  express = require('../ep_etherpad-lite/node_modules/express');
}
catch (e) {
  // Testing case : we need to mock the express dependency
  express = require('express');
}

// Local dependencies
var conf = require('./configuration.js');
var auth = require('./auth.js');

module.exports = (function () {
  'use strict';

  var sockio = {};
  sockio.initialNamespace = '/mypads/api/';

  /**
  * `init` is the first function that takes the socket.io server `io` as
  * argument. It initializes all API requirements in a specific namespace,
  * particularly mypads handling routes.
  */

  sockio.init = function (app, io) {
    app.use('/mypads', express.static(__dirname + '/static'));
    app.use('/mypads/functest', express.static(__dirname + '/spec/frontend'));
    var api = io.of(sockio.initialNamespace);
    api.on('connect', function (socket) {
      auth.init();
      authAPI(socket);
      configurationAPI(socket); 
    });
  };

  /**
  * ## Configuration API
  *
  * All methods needs `fn.ensureAuthentificated`
  */

  var configurationAPI = function (socket) {
    var pre = 'configuration:';

    /**
    * get method : get all configuration if logged, else public fields
    */

    var getPath = pre + 'get';
    socket.on(getPath, function () {
      //var isAuth = (isAuthenticated() || req.session.login);
      var isAuth = false;
      var action = isAuth ? 'all' : 'public';
      conf[action](function (err, value) {
        if (err) { return socket.emit(getPath, { error: err }); }
        socket.emit(getPath, { value: value });
      });
    });

  };

  /**
  * ## Authentificaton API
  */

  var authAPI = function (socket) {
    var pre = 'auth:';

    /**
    * check method : check method returning success or error if given *login*
    * and *password* do not match to what is stored into database
    */

    var checkPath = pre + 'check';
    socket.on(checkPath, function (data) {
      data = data || {};
      try {
        auth.fn.localFn(data.login, data.password, function (err) {
          if (err) { return socket.emit(checkPath, { error: err.message }); }
          socket.emit(checkPath, { success: true });
        });
      }
      catch (e) {
        socket.emit(checkPath, { error: e.message });
      }
    });

    /**
    * login method : returning user object minus password if auth is a success,
    * plus fixes a `login` session.
    */

    var loginPath = pre + 'login';
    socket.on(loginPath, function (data) {
      console.log(data);
      passport.authenticate('jwt', function () {
        console.log('here');
        if (err) { return socket.emit({ error: err.message }); }
        if (!user) { return socket.emit({ error: info.message }); }
        socket.emit({
          success: true,
          user: ld.omit(user, 'password')
        });
      });
    });
  };

  return sockio;
}).call(this);
