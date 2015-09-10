/**
*  # Admin logout module
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
*  This module contains only admin disconnect and redirection
*/

module.exports = (function () {
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var notif = require('../widgets/notification.js');

  var logout = {};

  /**
  * ## Controller
  *
  * Used to check if user is authorized, send login/pass and updates settings.
  */

  logout.controller = function () {
    m.route('/');
    m.request({
      url: conf.URLS.AUTH + '/admin/logout',
      method: 'GET',
      data: { auth_token: auth.admToken() }
    }).then(function () {
      document.title = conf.SERVER.title;
      localStorage.removeItem('admToken');
      notif.success({ body: conf.LANG.USER.AUTH.SUCCESS_OUT });
    }, function (err) {
      notif.error({ body: ld.result(conf.LANG, err.error) });
    });
  };

  return logout;

}).call(this);
