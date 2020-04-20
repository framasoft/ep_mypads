/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
  var m         = require('mithril');
  var ld        = require('lodash');
  var conf      = require('../configuration.js');
  var auth      = require('../auth.js');
  var notif     = require('../widgets/notification.js');
  var expandPad = require('../helpers/expandPad.js');

  var layout = {};

  var views = {};

  /**
  * ## Internal views
  *
  * ### menuMain
  *
  * Returns views for auth and unauth.
  */

  views.menuMain = function () {
    var _routes = {
      auth: [
        {
          route: '/mypads',
          icon: 'duplicate',
          txt: conf.LANG.MENU.PAD
        },
        {
          route: '/mybookmarks',
          icon: 'star',
          txt: conf.LANG.MENU.BOOKMARK
        }
      ],
      admin: [
        {
          route: '/admin',
          icon: 'wrench',
          txt: conf.LANG.MENU.CONFIG
        },
        {
          route: '/admin/users',
          icon: 'user',
          txt: conf.LANG.MENU.USERS
        },
        {
          route: '/admin/logout',
          icon: 'off',
          txt: conf.LANG.MENU.LOGOUT
        }
      ],
      unauth: [
        {
          route: '/login',
          icon: 'lock',
          txt: conf.LANG.USER.LOGIN
        },
        {
          route: '/subscribe',
          icon: 'user',
          txt: conf.LANG.USER.SUBSCRIBE
        }
      ]
    };
    if (!conf.SERVER.allPadsPublicsAuthentifiedOnly) {
      _routes.auth.push({
        route: '/myuserlists',
        icon: 'user',
        txt: conf.LANG.MENU.USERLIST
      });
    }
    if (!conf.SERVER.disableUserProfile) {
      _routes.auth.push({
        route: '/myprofile',
        icon: 'home',
        txt: conf.LANG.MENU.PROFILE
      });
    }
    if (!conf.SERVER.disableLogoutButton) {
      _routes.auth.push({
        route: '/logout',
        icon: 'off',
        txt: conf.LANG.MENU.LOGOUT
      });
    }
    if (conf.SERVER.authMethod !== 'internal' || conf.SERVER.openRegistration === false) {
      _routes.unauth = [
        {
          route: '/login',
          icon: 'lock',
          txt: conf.LANG.USER.LOGIN
        }
      ];
    }
    var activeRoute = function (r) {
      var isActive = (m.route().slice(0, r.route.length) === r.route);
      if (m.route().indexOf('/admin') === 0) {
        isActive = (m.route() === r.route);
      }
      return m('li', { class: (isActive ? 'active' : '') }, [
        m('a', { href: r.route, config: m.route }, [
          m('i', { class: 'glyphicon glyphicon-' + r.icon, title: r.txt }),
          m('span', ' '+r.txt)
        ])
      ]);
    };
    if (auth.isAuthenticated()) {
      if (!conf.SERVER.hideHelpBlocks && auth.userInfo().hideHelp) {
        document.getElementsByTagName('body')[0].classList.add('hidehelpblocks');
      }
      return ld.map(_routes.auth, activeRoute);
    } else if (auth.isAdmin()) {
      return ld.map(_routes.admin, activeRoute);
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

  var padViewRouteRegex = new RegExp('/mypads/group/[^/]*/pad/view/[^/]*');
  var indexRouteRegex   = new RegExp('/mypads$');

  layout.view = function (main, aside) {
    var header  = 'header';
    var footer  = 'footer.container.ombre';
    var asideC  = 'aside.col-md-3.col-xs-12';
    var mainC   = 'main.container.ombre';
    var section = 'section.col-md-9.col-xs-12';
    // If the user wants to expand pad and if we are on the view pad page
    if (expandPad.wantExpandedPad() && m.route().match(padViewRouteRegex)) {
      header  = header+'.hidden';
      footer  = footer+'.hidden';
      asideC  = asideC+'.hidden';
      mainC   = 'main.container-fluid.ombre';
      section = 'section.col-md-12.col-xs-12';
    }
    if (m.route().match(indexRouteRegex)) {
      section = section+'.groupList';
    }
    return [
      m(header, [
        m('div.lang.container.form-inline', [
          m('select.form-control', ld.reduce(conf.SERVER.languages,
            function (memo, val, key) {
              var opts = {
                onclick: conf.updateLang.bind(null, key),
                value: key
              };
              if (key === conf.USERLANG) {
                opts.selected = 'selected';
              }
              memo.push(m('option', opts, val));
              return memo;
            }, [])
          ),
        ]),
        m('div.container.ombre', [
          m('h1', conf.SERVER.title),
          m('hr.trait', {role: 'presentation'}),
          m('nav', { class: 'menu-main' }, [
            m('ul.nav.nav-tabs', views.menuMain())
          ])
        ])
      ]),
      m(mainC, [
        m(section, { config: expandPad.autoExpand }, main || ''),
        m(asideC, aside || '')
      ]),
      m('section', { class: 'notification' }, notif.view(notif.controller())),
      m(footer, m('p', [
        m('span', m.trust(conf.LANG.GLOBAL.FOOTER + ' | ')),
        m('a', { href: '/admin', config: m.route }, conf.LANG.MENU.ADMIN)
      ]))
    ];
  };

  return layout;

}).call(this);
