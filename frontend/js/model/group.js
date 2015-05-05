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
  var conf = require('../configuration.js');
  var notif = require('../modules/notification.js');

  var model = { data: m.prop([]) };
  model.fetch = function (callback) {
    m.request({
      url: conf.URLS.GROUP,
      method: 'GET'
    }).then(
      function (resp) {
        model.data(resp.value); 
        if (callback) { callback(); }
      },
      function (err) {
        notif.error({ body: err.error });
        if (callback) { callback(); }
      }
    );
  };

  return model;
}).call(this);
