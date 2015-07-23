/**
*  # Admin module
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
*  This module contains global administration and settings for authorized
*  users.
*/

module.exports = (function () {
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var form = require('../helpers/form.js');
  var notif = require('../widgets/notification.js');
  var layout = require('./layout.js');
  var user = require('./user.js');

  var admin = {};

  /**
  * ## Controller
  *
  * Used to check if user is authorized, send login/pass and updates settings.
  */

  admin.controller = function () {
    var c = {};
    c.isAdmin = m.prop(false);
    form.initFields(c, ['login', 'password']);

    c.submit = function (e) {
      e.preventDefault();
      var credentials = c.data.login() + ':' + c.data.password();
      var url = document.location.protocol + '//' + credentials + '@' +
        document.location.host + '/admin';
      m.request({
        url: url,
        method: 'GET'
      }).then(function () {
        c.isAdmin(true);
        notif.success({ body: conf.LANG.USER.AUTH.SUCCESS });
      }, function (err) {
        notif.error({ body: ld.result(conf.LANG, err.error) });
      });
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  /**
  * ### form
  *
  * For admin login. Reuses login and password components from user login but
  * overwrites some attributes.
  */

  view.form = function (c) {
    var login = user.view.field.login(c);
    login.icon.attrs['data-msg'] = conf.LANG.ADMIN.INFO.LOGIN;
    var password = user.view.field.password(c);
    password.icon.attrs['data-msg'] = conf.LANG.USER.PASSWORD;
    delete password.input.attrs.pattern;
    delete password.input.attrs.minlength;
    delete password.input.attrs.maxlength;
    return m('form.block', {
      id: 'login-form', onsubmit: c.submit }, [
      m('fieldset.block-group', [
        m('legend', conf.LANG.ADMIN.ETHERPAD_ACCOUNT),
        login.label, login.input, login.icon,
        password.label, password.input, password.icon,
        m('input.block.send', {
          form: 'login-form',
          type: 'submit',
          value: conf.LANG.USER.LOGIN
        })
      ]),
    ]);
  };

  view.settings = function (c) {};

  view.main = function (c) {
    var elements = (function () {
      if (c.isAdmin()) {
        return [
          m('h2.block', conf.LANG.ADMIN.FORM_SETTINGS),
          view.settings(c)
        ];
      } else {
        return [
          m('h2.block', conf.LANG.ADMIN.FORM_LOGIN),
          view.form(c)
        ];
      }
    })();
    return m('section', { class: 'block-group user' }, elements);
  };
  view.aside = function (c) {
    var helpKey = (c.isAdmin() ? 'HELP_SETTINGS' : 'HELP_LOGIN');
    return m('section.user-aside', [
      m('h2', conf.SERVER.title),
      m('article', m.trust(conf.LANG.ADMIN[helpKey]))
    ]);
  };

  admin.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return admin;
}).call(this);
