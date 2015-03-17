/**
*  # Subscription module
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
*  This module contains the subscription logic and markup.
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');
  // Local Dependencies
  var conf = require('../configuration.js');
  var form = require('../helpers/form.js');
  var USER = conf.LANG.USER;
  var layout = require('./layout.js');
  var user = require('./user.js');

  var subscribe = {};

  /**
  * ## Controller
  *
  * Used for module state and actions.
  * And user submission.
  *
  */
  subscribe.controller = function () {
    var c = user.controller();
    form.initFields(c, ['login', 'password']);
    return c;
  };

  /**
  * ## Views
  *
  * `main` and `aside`, used with layout.
  */

  var view = {};

  view.form = function (c) {
    var login = user.view.field.login(c);
    var password = user.view.field.password(c);
    return m('form', {
      id: 'subscribe-form',
      class: 'block ' + c.classes.user.form
      }, [
      m('fieldset.block-group', [
        m('legend', { class: c.classes.user.legend }, USER.MANDATORY_FIELDS),
        login.label, login.input, login.icon,
        password.label, password.input, password.icon,
        m('p', 'passwordConfirm')
      ]),
      m('fieldset.block-group', [
        m('legend', { class: c.classes.user.legendopt }, USER.OPTIONAL_FIELDS),
        m('p', 'email'),
        m('p', 'firstname'),
        m('p', 'lastname'),
        m('p', 'organization')
      ]),
      m('input', {
        class: 'block ' + c.classes.user.inputSubmit,
        form: 'subscribe-form',
        type: 'submit',
        value: USER.REGISTER
      })
    ]);
  };

  view.main = function (c) {
    return m('section', { class: 'block-group ' + c.classes.user.section }, [
      m('h2', { class: 'block ' + c.classes.user.h2 }, USER.SUBSCRIBE),
      view.form(c)
    ]);
  };

  subscribe.view = function (c) {
    return layout.view(view.main(c), user.view.aside(c));
  };

  return subscribe;
}).call(this);
