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
  var und = require('underscore');
  var Backbone = require('backbone');
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var LANG = conf.LANG;

  var layout = {};

  var menuItems = {};

  menuItems.auth = new Backbone.Collection([
    {
      route:'mypads',
      cls: 'doc-text',
      txt: LANG.MENU.PAD
    }, {
      route:'mybookmarks',
      icon: 'bookmarks',
      txt: LANG.MENU.BOOKMARK
    }, {
      route:'myprofile',
      icon: 'user',
      txt: LANG.MENU.PROFILE
    }, {
      route:'admin',
      icon: 'tools',
      txt: LANG.MENU.ADMIN
    }, {
      route:'logout',
      icon: 'logout',
      txt: LANG.MENU.LOGOUT
    }
  ]);
  menuItems.unauth = new Backbone.Collection([
    {
      route:'login',
      icon: 'login',
      txt: LANG.USER.LOGIN
    }, {
      route:'subscribe',
      icon: 'thumbs-up',
      txt: LANG.USER.SUBSCRIBE
    }
  ]);

  var views = {};

  views.menuMain = {};
  views.menuMain.container = Backbone.ContainerView.extend({
    el: '#menu-main',
    initialize: function () {
      //this.$el.html()
      this.append(new views.menuMain.header(), '#menu-main-header');
      this.append(new views.menuMain.body(), '#menu-main-body');
    }
  });
  views.menuMain.header = Backbone.View.extend({
    tagName: 'div',
    template: und.template($('#menu-main-header-tpl').html()),
    initialize: function () { this.render(); },
    render: function () {
      var html = this.template({
        title: conf.server.get('title'),
        menuToggle: LANG.MENU.TOGGLE
      });
      this.$el.html(html);
      return this;
      }
  });
  views.menuMain.body = Backbone.View.extend({
    tagName: 'ul',
    className: 'nav navbar-nav',
    template: und.template($('#menu-main-item-tpl').html()),
    initialize: function () { this.render(); },
    render: function () {
      var me = this;
      var items = (auth.isAuthenticated) ? menuItems.auth : menuItems.unauth;
      var html = items.map(function (item) {
        //var isActive = (Backbone.History.getFragment() === r.route);
        var isActive = false;
        return me.template({ isActive: isActive, item: item });
      });
      this.$el.html(html.join(''));
      return this;
    }
  });

  views.footer = Backbone.View.extend({
    el: 'footer',
    template: und.template($('#footer-body').html()),
    initialize: function () { this.render(); },
    render: function () {
      var html = this.template({ footer: LANG.GLOBAL.FOOTER });
      this.$el.html(html);
      return this;
    }
  });

  layout.init = function () {
    new views.menuMain.container();
    new views.footer();
  };

  /**
  * ## Internal views
  *
  * ### menuMain
  *
  * Returns views for auth and unauth.

  views.menuMain = function () {
    var _routes = {
      auth: [
        {
          route:'mypads',
          cls: 'doc-text',
          txt: LANG.MENU.PAD
        },
        {
          route:'mybookmarks',
          icon: 'bookmarks',
          txt: LANG.MENU.BOOKMARK
        },
        {
          route:'myprofile',
          icon: 'user',
          txt: LANG.MENU.PROFILE
        },
        {
          route:'admin',
          icon: 'tools',
          txt: LANG.MENU.ADMIN
        },
        {
          route:'logout',
          icon: 'logout',
          txt: LANG.MENU.LOGOUT
        }
      ],
      unauth: [
        {
          route:'login',
          icon: 'login',
          txt: LANG.USER.LOGIN
        },
        {
          route:'subscribe',
          icon: 'thumbs-up',
          txt: LANG.USER.SUBSCRIBE
        }
      ]
    };
    var activeRoute = function (r) {
      var liCls = (m.route() === r.route) ? classes.itemActive + ' ' : '';
      liCls += classes.li;
      return m('li', { class: liCls }, [
        m('a', {
          class: classes.a,
          href: r.route,
          config: m.route
        }, [
          m('i', { class: 'icon-' + r.icon, title: r.txt }),
          m('span', { class: classes.span }, r.txt)
        ])
      ]);
    };
    if (auth.isAuthenticated()) {
      return ld.map(_routes.auth, activeRoute);
    } else {
      return ld.map(_routes.unauth, activeRoute);
    }
  };
  */

  return layout;

}).call(this);
