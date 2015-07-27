/**
*  # Group List module
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
*  This module is the main one, containing groups.
*/

module.exports = (function () {
  'use strict';
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var notif = require('../widgets/notification.js');

  var model = {};
  model.init = function () {
    ld.assign(model, {
      data: m.prop({}),
      pads: m.prop({}),
      users: m.prop([]),
      admins: m.prop([]),
      tags: m.prop([])
    });
  };
  model.init();

  model.fetch = function (callback) {
    var errFn = function (err) {
      notif.error({ body: ld.result(conf.LANG, err.error) });
      if (callback) { callback(err); }
    };
    m.request({
      url: conf.URLS.GROUP,
      method: 'GET'
    }).then(
      function (resp) {
        model.data(resp.value.groups); 
        model.pads(resp.value.pads);
        model.admins(resp.value.admins);
        var u = auth.userInfo();
        if (ld.size(model.admins()) === 0) {
          var admins = {};
          admins[u._id] = u;
          model.admins(admins);
        }
        model.users(resp.value.users);
        var tags = ld(resp.value.groups)
          .values()
          .pluck('tags')
          .flatten()
          .union()
          .value();
        model.tags(tags);
        m.request({
          url: conf.URLS.USERLIST,
          method: 'GET'
        }).then(function (resp) {
          u.userlists = resp.value;
          auth.userInfo(u);
          if (callback) { callback(resp); }
        }, errFn);
      }, errFn);
  };

  model.fetchPublicGroup = function (gid, callback) {
    var errFn = function (err) {
      notif.error({ body: ld.result(conf.LANG, err.error) });
      if (callback) { callback(err); }
    };
    m.request({
      url: conf.URLS.GROUP + '/' + gid,
      method: 'GET'
    }).then(
      function (resp) {
        var data = model.data();
        data[resp.key] = resp.value;
        model.data(data);
        model.pads(ld.merge(model.pads(), resp.pads));
        if (callback) { callback(resp); }
      }, errFn);
  };

  return model;
}).call(this);
