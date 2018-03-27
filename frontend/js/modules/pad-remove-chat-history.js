/**
*  # Pad remove chat history module
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
*  Short module for pad chat history removal
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var auth = require('../auth.js');
  var conf = require('../configuration.js');
  var model = require('../model/group.js');
  var notif = require('../widgets/notification.js');

  var remove = {};

  /**
  * ## Controller
  *
  * Used for authentication enforcement and confirmation before removal. In all
  * cases, redirection to parent group view.
  */

  remove.controller = function () {
    if (!auth.isAuthenticated()) {
      conf.unauthUrl(true);
      return m.route('/login');
    }
    var key = m.route.param('pad');
    var gkey = m.route.param('group');
    if (window.confirm(conf.LANG.GROUP.INFO.CHAT_HISTORY_REMOVE_SURE)) {
      m.request({
        method: 'DELETE',
        url: conf.URLS.PAD + '/chathistory/' + key,
        data: { auth_token: auth.token() }
      }).then(function (resp) {
        notif.success({ body: conf.LANG.GROUP.INFO.CHAT_HISTORY_REMOVE_SUCCESS });
        m.route('/mypads/group/' + gkey + '/view');
      }, function (err) {
        notif.error({ body: ld.result(conf.LANG, err.error) });
      });
    } else {
      m.route('/mypads/group/' + gkey + '/view');
    }
  };

  remove.view = function () {};

  return remove;
}).call(this);
