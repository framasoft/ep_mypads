/**
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
    if (!auth.isAuthenticated()) { return m.route('/login'); }
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
      m('a', {
        href: ulistRoute + '/edit',
        config: m.route,
        title: conf.LANG.GROUP.EDIT
      }, [ m('i.icon-pencil') ]),
      m('a', {
        href: ulistRoute + '/remove',
        config: m.route,
        title: conf.LANG.GROUP.REMOVE
      }, [ m('i.icon-trash') ])
    ];
    return m('li.block', [
      m('header.group.block-group', [
        m('h4.block', ul.name),
        m('section.block', actions)
      ]),
      m('dl.block-group.group', [
        m('dt.block', conf.LANG.USERLIST.FIELD.USERS),
        m('dd.block', ld.size(ul.uids))
      ])
    ]);
  };

  view.main = function (c) {
    var ulists = ld.reduce(c.userlists, function (memo, ul, key) {
      memo.push(view.userlist(c, ul, key));
      return memo;
    }, []);
    return m('section', { class: 'block-group group' }, [
      m('h2.block', [
        m('span', conf.LANG.MENU.USERLIST),
        m('a', {
          href: '/myuserlists/add',
          config: m.route
        }, [
          m('i.icon-plus-squared'),
          m('span', conf.LANG.USERLIST.ADD)
        ]),
      ]),
      m('section.block-group.group', [
        m('ul.group', ulists)
      ])
    ]);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(conf.LANG.USERLIST.HELP))
    ]);
  };

  userlist.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return userlist;

}).call(this);
