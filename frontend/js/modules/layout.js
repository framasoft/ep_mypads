/**
*  # Layout
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
*  This module contains the main layout of MyPads application.
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var conf = require('../configuration.js');
  var LANG = conf.LANG;
  var auth = require('../auth.js');
  var notif = require('./notification.js');

  var layout = {};

  var views = {};

  /**
  * ## Internal views
  *
  * ### menuMain
  *
  * Returns views for auth and unauth.
  */

  views = {};
  views.menuMain = function () {
    var _routes = {
      auth: [
        {
          route: '/mypads/',
          cls: ['menu-main', 'icon-doc-text' ],
          txt: LANG.MENU.PAD
        },
        {
          route: '/mybookmarks/',
          cls: ['menu-main', 'icon-bookmarks' ],
          txt: LANG.MENU.BOOKMARK
        },
        {
          route: '/myprofile/',
          cls: ['menu-main', 'icon-user' ],
          txt: LANG.MENU.PROFILE
        },
        {
          cls: ['menu-main', 'icon-tools' ],
          txt: LANG.MENU.ADMINS
        }
      ],
      unauth: [
        {
          route: '/login/',
          cls: ['menu-main', 'icon-login' ],
          txt: LANG.LOGIN.LOGIN
        },
        {
          route: '/subscribe/',
          cls: ['menu-main', 'icon-thumbs-up' ],
          txt: LANG.LOGIN.SUBSCRIBE
        }
      ]
    };
    var activeRoute = function (r) {
      if (m.route() === r.route) { r.cls.push('is-active'); }
      return m('li', { class: r.cls.join(' ') }, [
        m('a.menu-main', { href: r.route, config: m.route }, r.txt)
      ]);
    };
    if (auth.isAuthenticated()) {
      return ld.map(_routes.auth, activeRoute);
    } else {
      return ld.map(_routes.unauth, activeRoute);
    }
  };
  /*
  * ## Layout View
  *
  * The main function, used by nearly all others, that fixes the layout DOM.
  * It takes optional :
  *
  * - `main` vdom content;
  * - `aside` vdom content.
  */

  layout.view = function (main, aside) {
    return [
      m('header.block', [
        m('h1', conf.SERVER.title),
        m('nav.menu-main', [
          m('ul.menu-main', views.menuMain())
        ])
      ]),
      m('main.block', [
        m('section.block', main || ''),
        m('aside.block', aside || '')
      ]),
      m('section.notification', notif.view(notif.controller())),
      m('footer.block', m('p', m.trust(LANG.GLOBAL.FOOTER)))
    ];
  };

  return layout;

}).call(this);
