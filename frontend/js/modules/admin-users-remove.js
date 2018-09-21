/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Admin user remove module
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
*  This module contains only admin user removal
*/

module.exports = (function () {
  // Global dependencies
  var m  = require('mithril');
  var ld = require('lodash');

  // Local dependencies
  var conf  = require('../configuration.js');
  var auth  = require('../auth.js');
  var notif = require('../widgets/notification.js');

  var remove = {};

  /**
  * ## Controller
  *
  * This controller informs the admin about that no return will be possible and
  * removes the user and its groupds and pads, server-side.
  */

  remove.controller = function () {
    if (!auth.isAdmin()) { return m.route('/admin'); }
    var login = m.route.param('login');
    m.route('/admin/users');
    if (window.confirm(conf.LANG.ADMIN.INFO.USER_REMOVE_SURE)) {
      m.request({
        method: 'DELETE',
        url: conf.URLS.USER + '/' + login,
        data: { auth_token: auth.admToken() }
      }).then(function () {
        notif.success({
          body: conf.LANG.USER.INFO.REMOVE_ACCOUNT_SUCCESS
        });
      }, function (err) {
        notif.error({ body: ld.result(conf.LANG, err.error) });
      });
    }
  };

  return remove;

}).call(this);
