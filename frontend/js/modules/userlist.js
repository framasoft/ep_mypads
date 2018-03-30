/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Userlists module
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
*  This module displays all userlists from a authenticated user and allow him
*  to create, rename and remove each of them.
*/

module.exports = (function () {
  'use strict';
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var layout = require('./layout.js');
  var model = require('../model/group.js');

  var userlist = {};

  /**
  * ## Controller
  *
  * Used for module state and actions.
  */

  userlist.controller = function () {
    if (!auth.isAuthenticated()) {
      conf.unauthUrl(true);
      return m.route('/login');
    }
    document.title = conf.LANG.MENU.USERLIST + ' - ' + conf.SERVER.title;

    var c = {};

    var init = function () {
      c.userlists = auth.userInfo().userlists;
    };

    if (ld.isEmpty(model.groups())) { model.fetch(init); } else { init(); }
    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.userlist = function (c, ul, key) {
    var ulistRoute = '/myuserlists/' + key;
    var actions = [
      m('a.btn.btn-default.btn-xs', {
        href: ulistRoute + '/edit',
        config: m.route,
        title: conf.LANG.GROUP.EDIT
      }, [ m('i.glyphicon.glyphicon-pencil') ]),
      m('a.btn.btn-default.btn-xs', {
        href: ulistRoute + '/remove',
        config: m.route,
        title: conf.LANG.GROUP.REMOVE
      }, [ m('i.glyphicon.glyphicon-trash.text-danger') ])
    ];
    return m('tr', [
        m('th',
          m('a', {
            href: ulistRoute + '/edit',
            config: m.route,
            title: conf.LANG.GROUP.EDIT
          }, ul.name)
        ),
        m('td', ld.size(ul.uids)),
        m('td.text-right', actions)
      ]);
  };

  view.main = function (c) {
    var ulists = ld.reduce(c.userlists, function (memo, ul, key) {
      memo.push(view.userlist(c, ul, key));
      return memo;
    }, []);
    return m('section', [
      m('h2', [
        m('span', conf.LANG.MENU.USERLIST),
        m('a.btn.btn-warning.pull-right', {
          href: '/myuserlists/add',
          config: m.route
        }, [
          m('span', conf.LANG.USERLIST.ADD)
        ]),
      ]),
      m('section.panel.panel-default',
        m('table.table.table-stripped', [
          m('thead',
            m('tr', [
              m('th', {scope: 'col'}),  // Name
              m('th', {scope: 'col'}, conf.LANG.USERLIST.FIELD.USERS),
              m('th', {scope: 'col'})   // Actions
            ])
          ),
          m('tbody', ulists)
        ])
      )
    ]);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article.well', m.trust(conf.LANG.USERLIST.HELP))
    ]);
  };

  userlist.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return userlist;

}).call(this);
