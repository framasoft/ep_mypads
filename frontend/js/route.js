/**
*  # Routing module
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
*  This module contains all MyPads client-side routing using Mithril included
*  router. It initializes all in search mode.
*/

module.exports = (function () {
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var auth = require('./auth.js');
  var login = require('./modules/login.js');
  var admin = require('./modules/admin.js');

  var route = { model: {} };

  /*
  * ## Model
  *
  * `routes` contains all routes, minus login and logout.
  * This will helps to have a clear view on routes, even if we need
  * authentification in most of them.
  */

  route.model.routes = {
    '/admin': admin
  };

  route.init = function () {
    var authRoutes = ld.transform(route.model.routes, function (memo, mod, r) {
      memo[r] = auth.isAuthenticated() ? mod : login;
    });
    m.route(document.body, '/', ld.defaults({
      '/': login,
      '/login': login
    }, authRoutes));
  };

  return route;
}).call(this);
