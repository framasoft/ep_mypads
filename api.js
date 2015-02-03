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

module.exports = (function () {
  'use strict';

  var api = {};

  /**
  * `init` is the first function that takes an Express app as argument.
  * It initializes all mypads routes.
  */

  api.init = function (app) {
    /**
    *  FIXME: authentification
    *
    *  ## Configuration
    */
    var initialRoute = '/mypads/api/';
    var configuration = (function() {
      var route = initialRoute + 'configuration/';
      // Get simple key
      app.get(route + ':key', function (req, res) {
        conf.get(req.params.key, function (err, value) {
          if (err) { return res.send(500, { error: err }); }
          if (!value) { return res.send(404, { key: req.params.key }); }
          res.send({ key: req.params.key, value: value });
        });
      });
      // Set configuration key with POST and PUT
      var _set = function (req, res) {
        var key = req.body.key;
        var value = req.body.value;
        try {
          conf.set(key, value, function (err) {
            if (err) { return res.send(500, { error: err }); }
            res.send({ success: true, key: key, value: value });
          });
        }
        catch (e) {
          res.send(400, { error: e.message });
        }
      };
      app.post(route, _set);
      app.put(route, _set);
      // Removal of configuration item with DELETE
      app.delete(route + ':key', function (req, res) {
        conf.remove(req.params.key, function (err) {
          if (err) { return res.send(400, { error: err }); }
          res.send({ success: true, key: req.params.key });
        });
      });
      // Get all configuration
      app.get(route, function (req, res) {
        conf.all(function (err, value) {
          if (err) { return res.send(400, { error: err }); }
          res.send({ value: value });
        });
      });
    }).call(this);
  };

  /**
  *  ## Authentification
  *  
  *  ## Users
  *  
  *  `createUser`
  *  
  *  `updateUser`
  *  
  *  `deleteUser`
  *  
  *  `getUser`
  *  
  *  `setLoginOfUser`
  *  
  *  `passwordRecoveryForUser`
  *  
  *  ## Groups
  *  
  *  ## Pads
  *  
  */ 
  return api;

}).call(this);
