/**
*  # Home module
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
*  This module contains the logout logic.
*/

module.exports = (function () {
  // Global dependencies
  var m = require('mithril');
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var LOG = conf.LANG.USER;
  var model = require('../model/group.js');
  var notif = require('../widgets/notification.js');

  var logout = {
    /**
    * `controller` calls the API for logout and returns either :
    *
    * - an error noticiation if the user was not authenticated
    * - a success notification if he was, with updates of local cached data
    */

    controller: function () {
      if (!auth.isAuthenticated()) { return m.route('/login'); }
      m.request({ method: 'GET', url: conf.URLS.LOGOUT })
      .then(function () {
        auth.isAuthenticated(false);
        auth.userInfo(null);
        model.init();
        notif.success({ body: LOG.AUTH.SUCCESS_OUT });
        m.route('/');
      }, function (err) {
        notif.error({ body: err.error });
        m.route('/');
      });
    },
    view: function () {}
  };

  return logout;
}).call(this);
