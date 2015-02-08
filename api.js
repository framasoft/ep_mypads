/**
*  # API Module
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
*  This module holds all public functions, used for the API of mypads.
*  Please refer to binded function when no details are given.
*/ 

var ld = require('lodash');
var conf = require('./configuration.js');
var user = require('./models/user.js');

module.exports = (function () {
  'use strict';

  var api = {};
  api.initialRoute = '/mypads/api/';

  /**
  * `init` is the first function that takes an Express app as argument.
  * It initializes all mypads routes.
  */

  api.init = function (app) {
    // FIXME: authentification
    configurationAPI(app);
    userAPI(app);
  };

  /**
  * ## Internal functions helpers
  */

  var fn = {};

  /**
  * `set` internal takes the values of key and val that will be given to the
  * `setFn` bounded function targetted the original `set` from the module used
  * in the case of this public API
  */

  fn.set = function (setFn, key, value, req, res) {
    try {
      setFn(function (err) {
        if (err) { return res.send(400, { error: err.message }); }
        res.send({ success: true, key: key, value: value });
      });
    }
    catch (e) {
      res.send(400, { error: e.message });
    }
  };

  /**
  * `del` internal takes four arguments :
  *
  * - `delFn` bounded function targetted the original `del` method from the
  *   module used
  * - classical `req` and `res` express parameters, with mandatory
  *   *req.params.key*.
  */

  fn.del = function (delFn, req, res) {
    var key = req.params.key;
    delFn(key, function (err) {
      if (err) { return res.send(404, { error: err.message }); }
      res.send({ success: true, key: key });
    });
  };

  /**
  * ## Configuration API
  */

  var configurationAPI = function (app) {
    var confRoute = api.initialRoute + 'configuration';

    /**
    * GET method : get all configuration
    * Sample URL:
    *
    * http://etherpad.ndd/mypads/api/configuration
    */

    app.get(confRoute, function (req, res) {
      conf.all(function (err, value) {
        if (err) { return res.send(400, { error: err }); }
        res.send({ value: value });
      });
    });

    /**
    * GET method : `configuration.get` key
    * Sample URL:
    *
    * http://etherpad.ndd/mypads/api/configuration/something
    */

    app.get(confRoute + '/:key', function (req, res) {
      conf.get(req.params.key, function (err, value) {
        if (err) {
          return res.send(404, { error: err.message, key: req.params.key });
        }
        res.send({ key: req.params.key, value: value });
      });
    });

    /**
    * POST/PUT methods : `configuration.set` key and value on initial
    * Sample URL for POST:
    * http://etherpad.ndd/mypads/api/configuration
    *
    * for PUT
    * http://etherpad.ndd/mypads/api/configuration/something
    */

    var _set = function (req, res) {
      var key = (req.method === 'POST') ? req.body.key : req.params.key;
      var value = req.body.value;
      var setFn = ld.partial(conf.set, key, value);
      fn.set(setFn, key, value, req, res);
    };

    app.post(confRoute, _set);
    app.put(confRoute + '/:key', _set);

    /**
    * DELETE method : `configuration.del` key
    * Sample URL:
    *
    * http://etherpad.ndd/mypads/api/configuration/something
    */

    app.delete(confRoute + '/:key', ld.partial(fn.del, conf.del));
  };

  /**
  *  ## User API
  */

  var userAPI = function (app) {
    var userRoute = api.initialRoute + 'user';

    /**
    * GET method : `user.get` login (key)
    * Sample URL:
    *
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.get(userRoute + '/:key', function (req, res) {
      try {
        user.get(req.params.key, function (err, val) {
          if (err) {
            return res.send(404, { error: err.message, key: req.params.key });
          }
          res.send({ key: req.params.key, value: val });
        });
      }
      catch (e) {
        res.send(400, { error: e.message });
      }
    });

    // _set for POST and  PUT, see below
    var _set = function (req, res) {
      var key;
      var value = req.body;
      var setFn;
      if (req.method === 'POST') {
        key = req.body.login;
        setFn = ld.partial(user.add, value);
      } else {
        key = req.params.key;
        value.login = key;
        setFn = ld.partial(user.set, value);
      }
      fn.set(setFn, key, value, req, res);
    };

    /**
    * POST method : `user.add` with user value for user creation
    * Sample URL:
    *
    * http://etherpad.ndd/mypads/api/user
    */

    app.post(userRoute, _set);

    /**
    * PUT method : `user.set` with user key/login plus value for existing user
    * Sample URL:
    *
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.put(userRoute + '/:key', _set);

    /**
    * DELETE method : `user.del` with user key/login
    * Sample URL:
    *
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.delete(userRoute + '/:key', ld.partial(fn.del, user.del));
  };

  return api;

}).call(this);
