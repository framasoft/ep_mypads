/**
*  # Password recovery module
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
*  This module contains the password recovery process
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

  var passrec = {};

  /**
  * ## Controller
  *
  * Used for module state and actions.
  */

  passrec.controller = function () {
    if (auth.isAuthenticated()) {
      m.route('/logout');
    }
    document.title = conf.LANG.USER.PASSRECOVER + ' - ' + conf.SERVER.title;

    var c = {
      token: m.route.param('token')
    };
    var fields = (c.token ? ['password', 'passwordConfirm'] : ['email']);
    form.initFields(c, fields);

    var errFn = function (err) {
      notif.error({ body: ld.result(conf.LANG, err.error) });
    };

    c.submit = function (e) {
      e.preventDefault();
      m.request({
        method: 'POST',
        url: conf.URLS.PASSRECOVER,
        data: c.data
      }).then(function () {
        notif.success({ body: conf.LANG.USER.INFO.PASSRECOVER_SUCCESS });
      }, errFn);
    };

    c.changePass = function (e) {
      e.preventDefault();
      m.request({
        method: 'PUT',
        url: conf.URLS.PASSRECOVER + '/' + c.token,
        data: c.data
      }).then(function () {
        m.route('/login');
        notif.success({ body: conf.LANG.USER.INFO.CHANGEPASS_SUCCESS });
      }, errFn);
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.form = function (c) {
    var email = user.view.field.email(c);
    return m('form', {
      id: 'passrec-form',
      onsubmit: c.submit
      }, [
        m('fieldset', [
          m('.form-group', [
            email.label,
            email.input
          ])
        ]),
        m('input.btn.btn-success.pull-right.col-sm-12', {
          form: 'passrec-form',
          type: 'submit',
          value: conf.LANG.USER.OK
        })
      ]
    );
  };

  view.formChange = function (c) {
    var pass = user.view.field.password(c);
    var passC = user.view.field.passwordConfirm(c);
    pass.label.attrs.class = 'col-sm-4';
    passC.label.attrs.class = 'col-sm-4';
    return m('form.form-horizontal', {
      id: 'passchange-form',
      onsubmit: c.changePass
      }, [
        m('fieldset', [
          m('.form-group', [
            pass.label,
            m('.col-sm-7', pass.input)
          ]),
          m('.form-group', [
            passC.label,
            m('.col-sm-7', passC.input)
          ])
        ]),
        m('input.btn.btn-success.pull-right', {
          form: 'passchange-form',
          type: 'submit',
          value: conf.LANG.USER.OK
        })
      ]
    );
  };

  view.main = function (c) {
    return m('section', { class: 'user' }, [
      m('h2', conf.LANG.USER.PASSRECOVER),
      (c.token ? view.formChange(c) : view.form(c))
    ]);
  };

  passrec.view = function (c) {
    return layout.view(view.main(c), user.view.aside.common(c));
  };


  return passrec;

}).call(this);
