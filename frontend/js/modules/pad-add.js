/**
*  # Pad creation and edition module
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
*  Short module for pad adding and updating by name
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var m = require('mithril');
  var auth = require('../auth.js');
  var conf = require('../configuration.js');
  var model = require('../model/group.js');
  var notif = require('../widgets/notification.js');

  var add = {};

  /**
  * ## Controller
  *
  * Used for authentication enforcement and confirmation before removal. In all
  * cases, redirection to parent group view.
  */

  add.controller = function () {
    if (!auth.isAuthenticated()) { return m.route('/login'); }
    var key = m.route.param('pad');
    var gkey = m.route.param('group');
    var opts;
    if (key) {
      opts = {
        pad: model.pads()[key],
        method: 'PUT',
        url: conf.URLS.PAD + '/' + key,
        promptMsg: conf.LANG.GROUP.PAD.ADD_PROMPT,
        successMsg: conf.LANG.GROUP.INFO.PAD_EDIT_SUCCESS
      };
    } else {
      opts = {
        pad: { name: '' },
        method: 'POST',
        url: conf.URLS.PAD,
        promptMsg: conf.LANG.GROUP.PAD.EDIT_PROMPT,
        successMsg: conf.LANG.GROUP.INFO.PAD_ADD_SUCCESS
      };
    }
    opts.pad.group = gkey;
    var name = window.prompt(opts.promptMsg, opts.pad.name);
    if (name) {
      opts.pad.name = name;
      m.request({
        method: opts.method,
        url: opts.url,
        data: opts.pad
      }).then(function (resp) {
        var pads = model.pads();
        pads[resp.key] = resp.value;
        model.pads(pads);
        if (!key) {
          var groups = model.data();
          groups[gkey].pads.push(resp.key);
          model.data(groups);
        }
        notif.success({ body: opts.successMsg });
        m.route('/mypads/group/' + gkey + '/view');
      }, function (err) { notif.error({ body: err.error }); });
    } else {
      m.route('/mypads/group/' + gkey + '/view');
    }
  };

  add.view = function () {};

  return add;
}).call(this);
