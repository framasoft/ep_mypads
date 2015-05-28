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
  // Modules
  var home = require('./modules/home.js');
  var login = require('./modules/login.js');
  var logout = require('./modules/logout.js');
  var subscribe = require('./modules/subscribe.js');
  var group = require('./modules/group.js');
  var groupView = require('./modules/group-view.js');
  var groupForm = require('./modules/group-form.js');
  var groupRemove = require('./modules/group-remove.js');
  var admin = require('./modules/admin.js');

  var route = { model: {} };

  /*
  * ## Model
  *
  * `routes` contains all routes and called modules.
  */

  route.model.routes = {
    '/': home,
    '/login': login,
    '/logout': logout,
    '/subscribe': subscribe,
    '/myprofile': subscribe,
    '/mypads': group,
    '/mypads/group': group,
    '/mypads/group/list': group,
    '/mypads/group/add': groupForm,
    '/mypads/group/view/:key': groupView,
    '/mypads/group/edit/:key': groupForm,
    '/mypads/group/remove/:key': groupRemove,
    '/admin': admin
  };

  route.init = function () { m.route(document.body, '/', route.model.routes); };

  return route;
}).call(this);
