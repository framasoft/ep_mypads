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
  var passRecover = require('./modules/passrecover.js');
  var accountConfirm = require('./modules/accountconfirm.js');
  var subscribe = require('./modules/subscribe.js');
  var bookmark = require('./modules/bookmark.js');
  var userlist = require('./modules/userlist.js');
  var userlistForm = require('./modules/userlist-form.js');
  var userlistRemove = require('./modules/userlist-remove.js');
  var group = require('./modules/group.js');
  var groupView = require('./modules/group-view.js');
  var groupForm = require('./modules/group-form.js');
  var groupRemove = require('./modules/group-remove.js');
  var padForm = require('./modules/pad-form.js');
  var padRemove = require('./modules/pad-remove.js');
  var padRemoveChatHistory = require('./modules/pad-remove-chat-history.js');
  var padView = require('./modules/pad-view.js');
  var padMove = require('./modules/pad-move.js');
  var userInvite = require('./modules/user-invitation.js');
  var admin = require('./modules/admin.js');
  var adminLogout = require('./modules/admin-logout.js');
  var adminUsers = require('./modules/admin-users.js');
  var adminUserForm = require('./modules/admin-users-form.js');
  var adminUserRemove = require('./modules/admin-users-remove.js');

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
    '/passrecover': passRecover,
    '/passrecover/:token': passRecover,
    '/accountconfirm/:token': accountConfirm,
    '/subscribe': subscribe,
    '/myprofile': subscribe,
    '/mybookmarks': bookmark,
    '/myuserlists': userlist,
    '/myuserlists/add': userlistForm,
    '/myuserlists/:key/edit': userlistForm,
    '/myuserlists/:key/remove': userlistRemove,
    '/mypads': group,
    '/mypads/group': group,
    '/mypads/group/list': group,
    '/mypads/group/add': groupForm,
    '/mypads/group/:key/view': groupView,
    '/mypads/group/:key/edit': groupForm,
    '/mypads/group/:key/remove': groupRemove,
    '/mypads/group/:group/pad/add': padForm,
    '/mypads/group/:group/pad/move': padMove,
    '/mypads/group/:group/pad/edit/:pad': padForm,
    '/mypads/group/:group/pad/remove/:pad': padRemove,
    '/mypads/group/:group/pad/remove/chat/history/:pad': padRemoveChatHistory,
    '/mypads/group/:group/pad/view/:pad': padView,
    '/mypads/group/:group/user/:action': userInvite,
    '/admin': admin,
    '/admin/logout': adminLogout,
    '/admin/users': adminUsers,
    '/admin/users/:login/edit': adminUserForm,
    '/admin/users/:login/remove': adminUserRemove
  };

  var myPadsBox = document.getElementById('mypads');
  route.init = function () { m.route(myPadsBox, '/', route.model.routes); };

  return route;
}).call(this);
