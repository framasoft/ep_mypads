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
*  This module is the main one, containing all cached frontend data.
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
      groups: m.prop({}),
      pads: m.prop({}),
      users: m.prop([]),
      admins: m.prop([]),
      tags: m.prop([]),
      tmp: m.prop({ groups: m.prop({}), pads: m.prop({}) })
    });
  };
  model.init();

  /**
  * `fetch`
  *
  * This function takes an optional `callback`, called with *error* or
  * *result*. It uses the usefull group.GET API call to populate local groups,
  * pads, users and admins objects. It also call userlist API to populate them
  * too.
  */

  model.fetch = function (callback) {
    var errFn = function (err) {
      notif.error({ body: ld.result(conf.LANG, err.error) });
      if (callback) { callback(err); }
    };
    var isAuth = auth.isAuthenticated();
    var data = (isAuth ?  { auth_token: auth.token() } : undefined);
    m.request({
      url: conf.URLS.GROUP,
      method: 'GET',
      data: data
    }).then(
      function (resp) {
        model.groups(resp.value.groups); 
        model.pads(resp.value.pads);
        var u = auth.userInfo();
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
          method: 'GET',
          data: data
        }).then(function (resp) {
          u.userlists = resp.value;
          auth.userInfo(u);
          if (callback) { callback(null, resp); }
        }, errFn);
      }, errFn);
  };

  /**
  * ## fetchObject
  *
  * This function is used for unauth users or non-invited authenticated users.
  * It calls group.GET/id API and populates local models. If group is denied
  * and `keys.pad` is fixed, it tries access to pad only. It takes mandatory :
  *
  * - `keys` JS object containing `group` and optional `pad` id string
  * - `password` string, can be set as *undefined*. If given, will be sent as
  *   data parameter
  * - `callback` function, called with *error* or *result*
  */

  model.fetchObject = function (keys, password, callback) {
    var errFn = function (err) {
      notif.error({ body: ld.result(conf.LANG, err.error) });
      if (callback) { callback(err); }
    };

    var fetchPad = function (group) {
      var opts = {
        url: conf.URLS.PAD + '/' + keys.pad + '?',
        method: 'GET'
      };
      if (password) { opts.url += '&password=' + password; }
      if (auth.isAuthenticated()) { opts.url += '&auth_token=' + auth.token(); }
      m.request(opts).then(
        function (resp) {
          var data = model.tmp();
          var pads = data.pads();
          pads[resp.key] = resp.value;
          data.pads(pads);
          model.tmp(data);
          if (callback) { callback(null, resp); }
        }, function (err) {
          if (err.error === 'BACKEND.ERROR.TYPE.PASSWORD_MISSING') {
            var value = { _id: keys.pad, visibility: 'private' };
            var data = model.tmp();
            var pads = data.pads();
            pads[keys.pad] = value;
            data.pads(pads);
            model.tmp(data);
            return callback(null, { key: keys.pad, value: value });
          }
          if (err.error === 'BACKEND.ERROR.PERMISSION.UNAUTHORIZED') {
            return errFn(err);
          }
          if (group) {
            return callback(null, group);
          }
          errFn(err);
        });
    };

    var fetchGroup = function () {
      var opts = {
        url: conf.URLS.GROUP + '/' + keys.group + '?',
        method: 'GET',
      };
      if (password) { opts.url += '&password=' + password; }
      if (auth.isAuthenticated()) { opts.url += '&auth_token=' + auth.token(); }
      m.request(opts).then(
        function (resp) {
          var data = model.tmp();
          var groups = data.groups();
          groups[resp.key] = resp.value;
          data.groups(groups);
          data.pads(ld.merge(data.pads(), resp.pads));
          model.tmp(data);
          var padPass = (!keys.pad || ld.includes(resp.pads, keys.pad));
          if (padPass) {
            if (callback) { callback(null, resp); }
          } else {
            fetchPad(resp);
          }
        }, function (err) {
          if (keys.pad) { return fetchPad(); }
          errFn(err);
        });
    };

    fetchGroup();
  };

  return model;
}).call(this);
