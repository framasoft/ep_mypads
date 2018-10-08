/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Admin Users Management module
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
*  This module, reserved to admins, contains research for users, creation,
*  edition and removal.
*/

module.exports = (function () {
  // Global dependencies
  var m  = require('mithril');
  var ld = require('lodash');

  // Local dependencies
  var conf   = require('../configuration.js');
  var auth   = require('../auth.js');
  var notif  = require('../widgets/notification.js');
  var layout = require('./layout.js');
  var user   = require('./user.js');
  var form   = require('../helpers/form.js');

  var admin = {};

  /**
  * ## Controller
  *
  * Used to check authentication and state.
  */

  admin.controller = function () {
    if (!auth.isAdmin()) { return m.route('/admin'); }
    document.title = conf.LANG.ADMIN.FORM_USERS_SEARCH + ' - ' +
      conf.SERVER.title;

    var c = { user: m.prop(null), users: m.prop(false), usersCount: m.prop(false) };

    c.fields = ['login'];
    form.initFields(c, c.fields);

    /**
    * ### search
    *
    * `search` async function uses user.get API to retrieve user information.
    * It caches response to local controller property.
    */

    c.search = function (e) {
      e.preventDefault();
      c.users(false);
      c.usersCount(false);
      m.request({
        method: 'GET',
        url: conf.URLS.USER + '/' + c.data.login(),
        data: { auth_token: auth.admToken() }
      }).then(function (resp) {
        c.user(resp.value);
        notif.info({ body: conf.LANG.ADMIN.INFO.USER_FOUND });
      }, function (err) {
        c.user(false);
        notif.error({ body: ld.result(conf.LANG, err.error) });
      });
    };

    c.loadAllUsers = function (e) {
      e.preventDefault();
      c.user(null);
      c.data.login(null);
      m.request({
        method: 'GET',
        url: conf.URLS.ALL_USERS,
        data: { auth_token: auth.admToken() }
      }).then(function (resp) {
        c.users(resp.users);
        c.usersCount(resp.usersCount);
        notif.info({ body: conf.LANG.ADMIN.INFO.USER_FOUND });
      }, function (err) {
        c.users(false);
        c.usersCount(false);
        notif.error({ body: ld.result(conf.LANG, err.error) });
      });
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.form = function (c) {
    var login                    = user.view.field.login(c);
    login.input.attrs.config     = form.focusOnInit;
    login.icon.attrs['data-msg'] = conf.LANG.ADMIN.INFO.USERS_SEARCH_LOGIN;
    var tab = [
      m('fieldset.block-group', [
        m('legend', conf.LANG.ADMIN.USERS_SEARCH_LOGIN),
        m('div.form-group', [ login.label, login.input ])
      ]),
      view.user(c),
      view.users(c),
      m('input.block.send', {
        form: 'users-form',
        type: 'submit',
        class: 'btn btn-default',
        value: conf.LANG.ADMIN.FIELD.SEARCH
      }),
      m('span', ' '),
      m('button.btn.btn-info', {
        onclick: c.loadAllUsers
      }, conf.LANG.ADMIN.FIELD.SHOW_ALL_USERS)
    ];
    if (conf.SERVER.authMethod === 'internal') {
      tab.push(
        m('span', ' '),
        m('a.btn.btn-info', {
          href: '/admin/users/create',
          config: m.route,
        }, conf.LANG.ADMIN.FIELD.CREATE_USER)
      );
    }
    return m('form.block', {
      id: 'users-form',
      onsubmit: c.search
    }, tab);
  };

  view.user = function (c) {
    var u = c.user();
    if (u !== null) {
      if (!u) {
        return m('p.admin-users', conf.LANG.ADMIN.INFO.USER_NONE);
      } else {
        var route   = '/admin/users';
        var actions = [
          m('a', {
            href: route + '/' + u.login + '/edit',
            config: m.route,
            title: conf.LANG.GROUP.EDIT
          }, [ m('i.glyphicon glyphicon-pencil') ]),
          m('a', {
            href: route + '/' + u.login + '/remove',
            config: m.route,
            title: conf.LANG.GROUP.REMOVE,
          }, [ m('i.glyphicon glyphicon-trash') ])
        ];
        var name = u.login;
        if (u.firstname) {
          name = [name, '(', u.firstname, u.lastname, ') '].join(' ');
        }
        return m('ul.admin-users', [
          m('li.block-group', [
            m('span.block.name', name),
            m('span.block.actions', actions)
          ])
        ]);
      }
    }
  };

  view.users = function (c) {
    var u = c.users();
    if (u) {
      var route = '/admin/users';
      var items = [];
      ld.forEach(ld.sortBy(ld.keys(u)), function (login) {
        var n       = u[login];
        var actions = [
          m('a', {
            href: route + '/' + login + '/edit',
            config: m.route,
            title: conf.LANG.GROUP.EDIT
          }, [ m('i.glyphicon glyphicon-pencil') ]),
          m('a', {
            href: route + '/' + login + '/remove',
            config: m.route,
            title: conf.LANG.GROUP.REMOVE,
          }, [ m('i.glyphicon glyphicon-trash') ])
        ];
        var name = login;
        if (n.firstname || n.lastname) {
          name = [name, '(', n.firstname, n.lastname, ' - ', n.email, ') '].join(' ');
        }
        items.push(m('li.block-group', [
          m('span.block.name', name),
          m('span.block.actions', actions)
        ]));
      });
      return m('div', [
        m('b', [ conf.LANG.ADMIN.USERS_COUNT+' ', c.usersCount() ]),
        m('ul.admin-users', items)
      ]);
    }
  };

  view.main = function (c) {
    var elements = [ m('h2.block', conf.LANG.ADMIN.FORM_USERS_SEARCH),
      view.form(c) ];
    return m('section', { class: 'block-group user admin' }, elements);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(conf.LANG.ADMIN.HELP_USERS))
    ]);
  };

  admin.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return admin;

}).call(this);
