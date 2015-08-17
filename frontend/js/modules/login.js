/**
*  # Login module
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
*  This module contains the login markup.
*/

module.exports = (function () {
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var form = require('../helpers/form.js');
  var notif = require('../widgets/notification.js');
  var layout = require('./layout.js');
  var user = require('./user.js');

  var login = {};

  /**
  * ## Controller
  *
  * Used for module state and actions.
  * And user submission.
  *
  */

  login.controller = function () {
    var c = {};
    form.initFields(c, ['login', 'password']);

    /**
    * `submit` internal calls the public API to login with given login and
    * password. It displays errors if needed or success and fixes local cached
    * data for the user. It also updates UI lang if needed.
    */

    c.submit = function (e) {
      e.preventDefault();
      m.request({
        method: 'POST',
        url: conf.URLS.LOGIN,
        data: c.data
      }).then(function (resp) {
        auth.isAuthenticated(true);
        auth.userInfo(resp.user);
        var lang = auth.userInfo().lang;
        if (lang !== conf.USERLANG) {
          conf.updateLang(lang);
        }
        document.title += ' - ' + conf.LANG.USER.AUTH.WELCOME + ' ' +
          resp.user.login;
        notif.success({ body: conf.LANG.USER.AUTH.SUCCESS });
        m.route('/');
      }, function (err) {
        notif.error({ body: ld.result(conf.LANG, err.error) });
      });
    };
    return c;
  };

  /**
  * ## Views
  *
  * Nothing special here, just simple `main` and `form` views.
  */

  var view = {};

  view.form = function (c) {
    var login = user.view.field.login(c);
    login.input.attrs.config = form.focusOnInit;
    var password = user.view.field.password(c);
    return m('form.block', {
      id: 'login-form', onsubmit: c.submit }, [
      m('fieldset.block-group', [
        m('legend', conf.LANG.USER.MYPADS_ACCOUNT),
        login.label, login.input, login.icon,
        password.label, password.input, password.icon,
        m('p.block.passlost', [
          m('a', {
            href: '/passrecover',
            config: m.route
          }, conf.LANG.USER.PASSWORD_LOST)
        ]),
        m('input.block.send', {
          form: 'login-form',
          type: 'submit',
          value: conf.LANG.USER.LOGIN
        })
      ])
    ]);
  };

  view.main = function (c) {
    return m('section', { class: 'block-group user' }, [
      m('h2.block', [
        m('span', conf.LANG.USER.FORM),
        m('a', { href: '/subscribe', config: m.route }, conf.LANG.USER.ORSUB)
      ]),
      view.form(c)
    ]);
  };

  login.view = function (c) {
    return layout.view(view.main(c), user.view.aside.common(c));
  };
  return login;
}).call(this);
