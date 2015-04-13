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
  var ld = require('lodash');
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
    form.initFields(c, ['login', 'password', 'passwordCheck', 'email',
      'firstname', 'lastname', 'org']);
    return c;
  };

  /**
  * ## Views
  *
  * `main` and `aside`, used with layout.
  */

  var view = {};

  view.form = function (c) {
    var fields = ['login', 'password', 'email', 'firstname', 'lastname', 'org'];
    fields = ld.reduce(fields, function (memo, f) {
      memo[f] = user.view.field[f](c); 
      return memo;
    }, {});
    fields.passCheck = user.view.field.password(c, true);
    return m('form', {
      id: 'subscribe-form',
      class: 'block ' + c.classes.user.form
      }, [
      m('fieldset.block-group', [
        m('legend', { class: c.classes.user.legend }, USER.MANDATORY_FIELDS),
        fields.login.label, fields.login.input, fields.login.icon,
        fields.password.label, fields.password.input, fields.password.icon,
        fields.passCheck.label, fields.passCheck.input, fields.passCheck.icon,
        fields.email.label, fields.email.input, fields.email.icon
      ]),
      m('fieldset.block-group', [
        m('legend', { class: c.classes.user.legendopt }, USER.OPTIONAL_FIELDS),
        fields.firstname.label, fields.firstname.input, fields.firstname.icon,
        fields.lastname.label, fields.lastname.input, fields.lastname.icon,
        fields.org.label, fields.org.input, fields.org.icon
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
