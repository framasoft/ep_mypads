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
  var loginStyle = require('../../style/login.js');
  var auth = require('../auth.js');
  var LOG = conf.LANG.LOGIN;
  var notif = require('./notification.js');
  var layout = require('./layout.js');
  var tooltipStyle = require('../../style/tooltip.js');
  var classes = { tooltip: tooltipStyle.sheet.main.classes };

  var login = {};

  /**
  * ## Controller
  *
  * Used for module state and actions.
  * And user submission.
  *
  */

  login.controller = function () {
    loginStyle.attach();
    classes.login = loginStyle.sheet.main.classes;
    this.onunload = loginStyle.detach;
    var c = {};
    c.data = { login: m.prop(), password: m.prop() };
    c.valid = { login: m.prop(true), password: m.prop(true) };
    /**
    * `handleInput` private local function takes a DOM Event , fixes the real
    * value to the current data state and uses HTML5 Validation API to ensure
    * input is valid or not.
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
    var icls = isValid() ? ['icon-info-circled'] : ['icon-alert'];
    icls.push(classes.tooltip.global);
    icls.push(classes.login.i);
    icls.push('block');
    var msg = isValid() ? LOG.INFO.LOGIN : LOG.ERR.LOGIN;
    return m('i', {
      class: icls.join(' '),
      'data-msg': msg
    });
  };

  view.icon.password = function (isValid) {
    var infoPass = LOG.INFO.PASSWORD_BEGIN + conf.SERVER.passwordMin +
    ' and ' + conf.SERVER.passwordMax + LOG.INFO.PASSWORD_END;
    var icls = isValid() ? ['icon-info-circled'] : ['icon-alert'];
    icls.push(classes.tooltip.global);
    icls.push(classes.login.i);
    icls.push('block');
    return m('i', {
      class: icls.join(' '),
      'data-msg': infoPass
    });
  };

  view.field = {};

  view.field.login = function (c) {
    return [
      m('label', {
        class: 'block ' + classes.login.label,
        for: 'login'
      }, LOG.USERNAME),
      m('input', {
        class: 'block ' + classes.login.input,
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
      m('label', {
        class: 'block ' + classes.login.label,
        for: 'password'
      }, LOG.PASSWORD),
      m('input', {
        class: 'block ' + classes.login.input,
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
    return m('form', {
      id: 'login-form',
      class: 'block ' + classes.login.form,
      onsubmit: c.submit
      }, [
      m('fieldset.block-group', ld.flatten([
        m('legend', { class: classes.login.legend }, LOG.MYPADS_ACCOUNT),
        view.field.login(c),
        view.field.password(c),
        m('input', {
          class: 'block ' + classes.login.inputSubmit,
          form: 'login-form',
          type: 'submit',
          value: LOG.LOGIN
        })
      ])),
    ]);
  };

  view.main = function (c) {
    return m('section', { class: 'block-group ' + classes.login.section }, [
      m('h2', { class: 'block ' + classes.login.h2 }, [
        m('span', LOG.FORM),
        m('a', {
          class: classes.login.a,
          href: '/subscribe', config: m.route
        }, LOG.ORSUB)
      ]),
      view.form(c)
    ]);
  };

  view.aside = function () {
    return m('section', { class: classes.login.sectionAside }, [
      m('h2', { class: classes.login.h2Aside }, conf.SERVER.title),
      m('article',
        { class: classes.login.articleAside },
        m.trust(conf.SERVER.descr))
    ]);
  };

  login.view = function (c) {
    return layout.view(view.main(c), view.aside());
  };
  return login;
}).call(this);
