/**
*  # Hooks Module
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
*  This module contains server-side hooks used by etherpad.
*
*  ## Hooks
*/

module.exports = (function () {
  'use strict';

  // Dependencies
  var configuration = require('./configuration.js');
  var padAndAuthor = require('./perm.js').padAndAuthor;

  var hooks = {};

  /**
  * `init` hook is runned once after plugin installation. At the moment, it
  * only populates database.
  */

  hooks.init = function (name, args, callback) {
    configuration.init(function (err) {
      if (err) { console.log(err); }
      callback();
    });
  };

  /**
  * `expressConfigure` hook profits from the args.app express instance to
  * initialize authentication, right before other things : MyPads routes etc.
  */

  hooks.expressConfigure = function (name, args, callback) {
    var auth = require('./auth.js');
    auth.init(args.app);
    callback();
  };

  /**
  * `expressCreateServer` hook profits from the args.app express instance to
  * initialize all MyPads routes from its own API and local indexes from
  * storage.
  */

  hooks.expressCreateServer = function (name, args, callback) {
    var storage = require('./storage.js');
    var api = require('./api.js');
    var mail = require('./mail.js');
    storage.init(function () {
      var lang = configuration.get('defaultLanguage');
      mail.init();
      api.init(args.app, lang, callback);
    });
  };

  /**
  * `clientVars` hook will use user login per default for pad `authorName` and
  * profile selected `userColor`. Authenticated user can overwrite default
  * values.
  */

  hooks.clientVars = function (name, context, callback) {
    var opts = padAndAuthor[context.pad.id];
    return callback(opts);
  };

  return hooks;

}).call(this);
