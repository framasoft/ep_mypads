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
  var css = require('../css.js');
  var auth = require('../auth.js');
  var notif = require('./notification.js');

  var layout = {};


  /**
  * ## CSS local styles
  *
  * Here are essentially menu styles.
  */

  var colors = css.vars.colors;
  layout.css = {};
  layout.css.mainMenu = {
    nav: { textAlign: 'right' },
    ul: { listStyleType: 'none' },
    li: {
      padding: '1em',
      display: 'inline',
      fontWeight: 'bold'
    },
    a: {
      background: 'none',
      textDecoration: 'none'
    },
    span: { display: 'none' },
    spanLarge: { display: 'inherit' },
    itemActive: { backgroundColor: css.vars.colors.purplemid },
    itemFocus: { backgroundColor: css.vars.colors.purpledark },
  };

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
          route: '/mypads',
          icon: 'doc-text',
          txt: LANG.MENU.PAD
        },
        {
          route: '/mybookmarks',
          icon: 'bookmarks',
          txt: LANG.MENU.BOOKMARK
        },
        {
          route: '/myprofile',
          icon: 'user',
          txt: LANG.MENU.PROFILE
        },
        {
          route: '/admin',
          icon: 'tools',
          txt: LANG.MENU.ADMIN
        },
        {
          route: '/logout',
          icon: 'logout',
          txt: LANG.MENU.LOGOUT
        }
      ],
      unauth: [
        {
          route: '/login',
          icon: 'login',
          txt: LANG.LOGIN.LOGIN
        },
        {
          route: '/subscribe',
          icon: 'thumbs-up',
          txt: LANG.LOGIN.SUBSCRIBE
        }
      ]
    };
    var mcss = layout.css.mainMenu;
    var largetablet = css.medias.breaks.largetablet;
    var activeRoute = function (r) {
      var liStyle = ld.clone(mcss.li);
      liStyle.backgroundColor = (m.route() === r.route) ? colors.purplemid : '';
      var spanStyle = largetablet.matches ? mcss.spanLarge : mcss.span;
      return m('li', {
        style: liStyle,
        onmouseover: function () {
          liStyle.backgroundColor = colors.purpledark;
        },
      }, [
        m('a', {
          style: mcss.a,
          href: r.route,
          config: m.route
        }, [
          m('i', { class: 'icon-' + r.icon, title: r.txt }),
          m('span', { style: spanStyle }, r.txt)
        ])
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
        m('nav', { style: layout.css.mainMenu.nav }, [
          m('ul', { style: layout.css.mainMenu.ul }, views.menuMain())
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
