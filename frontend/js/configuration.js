/**
*  # Configuration
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
*  This module contains configuration-like for frontend.
*/

module.exports = (function () {
  // Dependencies
  var Backbone = require('backbone');
  Backbone.$ = window.jQuery || window.Zepto || window.ender || window.$;
  var ContainerView = require(
    '../../node_modules/backbone.containerview/backbone.containerview.js'
  );
  ContainerView.install();

  var config = {};
  config.URLS = { BASE: '/mypads/api' };
  config.URLS.CONF = config.URLS.BASE + '/configuration';
  config.URLS.AUTH = config.URLS.BASE + '/auth';
  config.URLS.LOGIN = config.URLS.AUTH + '/login';
  config.URLS.LOGOUT = config.URLS.AUTH + '/logout';
  // FIXME : tmp to EN only
  config.LANG = require('../l10n/en.js');

  /**
  * `serverCollection` is a `Backbone` `Collection` intended to gather the
  * server configuration and pass it to other modules.
  */

  var serverCollection = Backbone.Collection.extend({
    url: config.URLS.CONF,
    parse: function (data) { return data.value; }
  });
  var server = new serverCollection();

  /**
  * ## init
  *
  * `init` is an asynchronous function that calls for the public configuration
  * of MyPads and push them to the `server` field.
  * It takes a callback function to be called after configuration
  * initialization.
  */

  config.init = function (cb) {
    server.fetch({
      success: function () {
        config.server = server.at(0); 
        cb();
      },
      failure: function () { /* TODO */ return null; }
    });
  };

  return config;
}).call(this);
