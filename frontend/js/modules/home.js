/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
*  This module contains the home of MyPads.
*/

module.exports = (function () {
  // Global dependencies
  var m = require('mithril');
  // Local dependencies
  var auth = require('../auth.js');
  var layout = require('./layout.js');

  var home = {
    controller: function () {
      if (auth.isAdmin()) {
        return m.route('/admin');
      }
      if (auth.isAuthenticated()) {
        return m.route('/mypads');
      }
      m.route('/login');
    },
    view: function () {
      return layout.view(m('p', 'empty home'), m('p', 'empty aside'));
    }
  };

  return home;
}).call(this);
