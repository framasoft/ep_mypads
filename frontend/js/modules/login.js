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
  // Local dependencies
  var conf = require('../configuration.js');
  var USER = conf.LANG.USER;
  var auth = require('../auth.js');
  var form = require('../helpers/form.js');
  var notif = require('./notification.js');
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
    var c = user.controller();
    form.initFields(c, ['login', 'password']);

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
        notif.success({ body: USER.AUTH.SUCCESS });
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
  * Nothing special here, just simple `main` and `form` views.
  */

  var view = {};

  view.form = function (c) {
    var login = user.view.field.login(c);
    var password = user.view.field.password(c);
    return m('form', {
      id: 'login-form',
      class: 'block ' + c.classes.user.form,
      onsubmit: c.submit
      }, [
      m('fieldset.block-group', [
        m('legend', { class: c.classes.user.legend }, USER.MYPADS_ACCOUNT),
        login.label, login.input, login.icon,
        password.label, password.input, password.icon,
        m('input', {
          class: 'block ' + c.classes.user.inputSubmit,
          form: 'login-form',
          type: 'submit',
          value: USER.LOGIN
        })
      ]),
    ]);
  };

  view.main = function (c) {
    return m('section', { class: 'block-group ' + c.classes.user.section }, [
      m('h2', { class: 'block ' + c.classes.user.h2 }, [
        m('span', USER.FORM),
        m('a', {
          class: c.classes.user.a,
          href: '/subscribe', config: m.route
        }, USER.ORSUB)
      ]),
      view.form(c)
    ]);
  };

  login.view = function (c) {
    return layout.view(view.main(c), user.view.aside.common(c));
  };
  return login;
}).call(this);
