/**
*  # Frontend functional testing Entry Point
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
*  This module is the entry point for front JavaScript programming. It requires
*  global dependencies and main client-side file.
*/

(function () {
  var login = require('./login.spec.js');
  var subscribe = require('./subscribe.spec.js');
  var profile = require('./profile.spec.js');
  var passRecover = require('./passrecover.spec.js');
  var bookmark = require('./bookmark.spec.js');
  //var groupList = require('./group.spec.js');
  //var groupForm = require('./group-form.spec.js');
  //var groupRemove = require('./group-remove.spec.js');
  //var groupView = require('./group-view.spec.js');
  //var padForm = require('./pad-form.spec.js');
  //var userInvite = require('./user-invitation.spec.js');
  //var padView = require('./pad-view.spec.js');
  //var padMove = require('./pad-move.spec.js');
  //var userlist = require('./userlist.spec.js');
  //var tagWidget = require('./tag-widget.spec.js');
  //var admin = require('./admin.spec.js');
  //var adminUsers = require('./admin-users.spec.js');

  describe('MyPads testing', function () {
    var app = frames[0];
    beforeAll(function(done) {
      // FIXME: 1sec for simplicity but should listen search/hash changes...
      window.setTimeout(done, 1000);
    });
    login.run(app);
    subscribe.run(app);
    profile.run(app);
    passRecover.run(app);
    bookmark.run(app);
    //groupList.run(app);
    //groupForm.run(app);
    //groupRemove.run(app);
    //padForm.run(app);
    //groupView.run(app);
    //userInvite.run(app);
    //padView.run(app);
    //padMove.run(app);
    //userlist.run(app);
    //tagWidget.run(app);
    //admin.run(app);
    //adminUsers.run(app);
  });
}).call(this);
