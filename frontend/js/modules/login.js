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
  var LOG = conf.LANG.LOGIN;
  var notif = require('./notification.js');
  var layout = require('./layout.js');

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
    c.data = { login: m.prop(), password: m.prop() };
    c.valid = { login: m.prop(true), password: m.prop(true) };
    /**
    * `handleInput` private local function takes a DOM Event , fixes the real
    * value to the current data state and uses HTML5 Validation API to ensure
    * input is valid or noit.
    */
    c.handleInput = function (e) {
      var field = e.target.getAttribute('name');
      c.valid[field](e.target.checkValidity());
      c.data[field](e.target.value);
    };
    /**
    * `submit` internal calls the public API to login with given login and
    * password. It displays errors if needed or success and fixes local cached
    * data for the user.
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
        notif.success({ body: LOG.AUTH.SUCCESS });
        m.route('/');
      }, function (err) {
        notif.error({ body: err.error });
      });
    };
    return c;
  };

  /**
  * ## Views
  *
  * `main`, `aside` views.
  * `form`, `field` and `icon` views.
  */

  var view = {};
  view.icon = {};

  view.icon.login = function (isValid) {
    var icls = isValid() ? 'icon-info-circled' : 'icon-alert';
    var msg = isValid() ? LOG.INFO.LOGIN : LOG.ERR.LOGIN;
    return m('i', {
      class: 'login-main tooltip block ' + icls,
      'data-msg': msg
    });
  };

  view.icon.password = function (isValid) {
    var infoPass = LOG.INFO.PASSWORD_BEGIN + conf.SERVER.passwordMin +
    ' and ' + conf.SERVER.passwordMax + LOG.INFO.PASSWORD_END;
    var icls = isValid() ? 'icon-info-circled' : 'icon-alert';
    return m('i', {
      class: 'login-main tooltip block ' + icls,
      'data-msg': infoPass
    });
  };

  view.field = {};

  view.field.login = function (c) {
    return [
      m('label.login-main.block', { for: 'login' }, LOG.USERNAME),
      m('input', {
        class: 'login-main block',
        type: 'text',
        name: 'login',
        placeholder: LOG.LOGIN,
        required: true,
        oninput: c.handleInput
      }),
      view.icon.login(c.valid.login)
    ];
  };

  view.field.password = function (c) {
    var passMin = conf.SERVER.passwordMin;
    var passMax = conf.SERVER.passwordMax;
    return [
      m('label.login-main.block', { for: 'password' }, LOG.PASSWORD),
      m('input', {
        class: 'login-main block',
        type: 'password',
        name: 'password',
        placeholder: LOG.UNDEF,
        required: true,
        minlength: passMin,
        maxlength: passMax,
        pattern: '.{' + passMin + ',' + passMax + '}',
        oninput: c.handleInput
      }),
      view.icon.password(c.valid.password),
    ];
  };

  view.form = function (c) {
    return m('form.block', { id: 'login-form', onsubmit: c.submit }, [
      m('fieldset.login-main.block-group', ld.flatten([
        m('legend', LOG.MYPADS_ACCOUNT),
        view.field.login(c),
        view.field.password(c),
        m('input.login-main.send.block',
          { form: 'login-form', type: 'submit', value: LOG.LOGIN })
      ])),
    ]);
  };

  view.main = function (c) {
    return m('section.login-main.block-group', [
      m('h2.block', [
        m('span', LOG.FORM),
        m('a.login-main', { href: '/subscribe', config: m.route }, LOG.ORSUB)
      ]),
      view.form(c)
    ]);
  };

  view.aside = function () {
    return m('section.login-aside', [
      m('h2.login-aside', conf.SERVER.title),
      m('article.login-aside', m.trust(conf.SERVER.descr))
    ]);
  };

  login.view = function (c) {
    return layout.view(view.main(c), view.aside());
  };
  return login;
}).call(this);
