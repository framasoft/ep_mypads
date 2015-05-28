/**
*  # Pad bookmarking module
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
*  Short module for pad bookmark and unmark
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var auth = require('../auth.js');
  var conf = require('../configuration.js');
  var GROUP = conf.LANG.GROUP;
  var notif = require('../widgets/notification.js');

  var mark = {};

  /**
  * ## Controller
  *
  * Used for authentication enforcement and confirmation before removal. In all
  * cases, redirection to parent group view.
  */

  mark.controller = function () {
    var user = auth.userInfo();
    if (!auth.isAuthenticated()) { return m.route('/login'); }
    var key = m.route.param('pad');
    var gkey = m.route.param('group');
    if (ld.includes(user.bookmarks.pads, key)) {
      ld.pull(user.bookmarks.pads, key);
    } else {
      user.bookmarks.pads.push(key);
    }
    m.request({
      url: conf.URLS.USERMARK,
      method: 'POST',
      data: { type: 'pads', key: key }
    }).then(function () {
      notif.success({ body: GROUP.MARK_SUCCESS });
    }, function (err) { return notif.error({ body: err.error }); });
    m.route('/mypads/group/' + gkey + '/view');
  };

  mark.view = function () {};

  return mark;
}).call(this);
