/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Account confirmation module
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
*  This module contains the account confirmation process
*/

module.exports = (function () {
  // Global dependencies
  var m  = require('mithril');
  var ld = require('lodash');

  // Local dependencies
  var conf  = require('../configuration.js');
  var notif = require('../widgets/notification.js');

  var account = {};

  account.controller = function () {
    var token = m.route.param('token');

    m.request({
      url: conf.URLS.ACCOUNT_CONFIRMATION,
      method: 'POST',
      data: { token: token }
    }).then(function () {
      m.route('/login');
      notif.success({ body: conf.LANG.USER.INFO.ACCOUNT_CONFIRMATION_SUCCESS });
    }, function (err) {
      m.route('/login');
      notif.error({ body: ld.result(conf.LANG, err.error) });
    });
  };

  account.view = function () {};

  return account;

}).call(this);
