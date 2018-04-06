/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
  var model = require('../model/group.js');
  var notif = require('../widgets/notification.js');
  var auth = require('../auth.js');
  var layout = require('./layout.js');
  var user = require('./user.js');
  var ready = require('../helpers/ready.js');

  var subscribe = {};

  /**
  * ## Controller
  *
  * Used for module state and actions and form submission.
  * `initFields` is called to track the status of all fields.
  * According to `profileView` getter-setter, we add or remove fields and
  * populate values with local values.
  */

  subscribe.controller = function () {
    var c = { adminView: m.prop(false) };
    c.profileView = m.prop((m.route() === '/myprofile'));
    document.title = (c.profileView() ? conf.LANG.USER.PROFILE :
      conf.LANG.USER.SUBSCRIBE);
    document.title += ' - ' + conf.SERVER.title;
    if (c.profileView() && !auth.isAuthenticated()) {
      conf.unauthUrl(true);
      return m.route('/login');
    }
    if (conf.SERVER.authMethod === 'ldap' && c.profileView()) {
      c.fields = ['organization', 'lang', 'color'];
    } else {
      c.fields = ['login', 'password', 'passwordConfirm', 'email', 'firstname',
        'lastname', 'organization', 'lang', 'color'];
    }
    if (c.profileView()) {
      c.fields.push('passwordCurrent', 'useLoginAndColorInPads');
    }
    form.initFields(c, c.fields);
    if (c.profileView()) {
      ld.map(c.fields, function (f) {
        if (!ld.startsWith(f, 'password')) {
          c.data[f] = m.prop(auth.userInfo()[f]);
        }
      });
    } else {
      c.data.lang = m.prop(conf.USERLANG);
    }

    /**
    * ### submit
    *
    * Submissions of forms.
    * `errfn` helper with error notification
    */

    var errfn = function (err) {
      return notif.error({ body: ld.result(conf.LANG, err.error) });
    };

    c.submit = {};

    /**
    * #### submit.subscribe
    *
    * `submit.subscribe` internal calls the public API to subscribe with given
    * data :
    *
    * - it ensures that additionnal validity check is done;
    * - it displays errors if needed or success and fixes local cached data for
    * the user;
    * - it also updates UI lang if needed;
    * - finally, it authenticates new created user.
    */

    c.submit.subscribe = function (e) {
      e.preventDefault();
      if (c.data.password() !== c.data.passwordConfirm()) {
        notif.warning({ body: conf.LANG.USER.ERR.PASSWORD_MISMATCH });
        document.querySelector('input[name="passwordConfirm"]').focus();
      } else {
        m.request({
          method: 'POST',
          url: conf.URLS.USER,
          data: c.data
        }).then(function (resp) {
          if (!resp.value.active) {
            var msg = conf.LANG.USER.AUTH.SUBSCRIBE_CONFIRM_SUCCESS;
            m.route('/');
            return notif.success({ body: msg });
          } else {
            auth.userInfo(resp.value);
            notif.success({ body: conf.LANG.USER.AUTH.SUBSCRIBE_SUCCESS });
          }
          var lang = auth.userInfo().lang;
          if (lang !== conf.USERLANG) {
            conf.updateLang(lang);
          }
          m.request({
            method: 'POST',
            url: conf.URLS.LOGIN,
            data: c.data
          }).then(function (resp) {
            localStorage.setItem('token', resp.token);
            m.route('/');
          }, errfn);
        }, errfn);
      }
    };

    /**
    * #### submit.profileSave
    *
    * This function :
    *
    * - uses the public API to check if given `passwordCurrent` is valid;
    * - then updates data as filled, taking care of password change with the
    *   help of the `passwordUpdate` function;
    * - notifies *errors* and *success*;
    * - updates the local cache of `auth.userInfo`.
    */

    c.submit.profileSave = function (e) {
      e.preventDefault();
      var passwordUpdate = function () {
        var pass = c.data.password();
        if (!pass || (pass !== c.data.passwordConfirm())) {
          c.data.password(c.data.passwordCurrent());
        }
      };
      m.request({
        method: 'POST',
        url: conf.URLS.CHECK,
        data: {
          login: auth.userInfo().login,
          password: c.data.passwordCurrent,
          auth_token: auth.token()
        }
      }).then(function () {
        if (conf.SERVER.authMethod !== 'ldap') {
          passwordUpdate();
        } else {
          c.data.login     = auth.userInfo().login;
          c.data.email     = auth.userInfo().email;
          c.data.firstname = auth.userInfo().firstname;
          c.data.lastname  = auth.userInfo().lastname;
          c.data.password  = c.data.passwordCurrent;
        }
        m.request({
          method: 'PUT',
          url: conf.URLS.USER + '/' + auth.userInfo().login,
          data: ld.assign(c.data, { auth_token: auth.token() })
        }).then(function (resp) {
          auth.userInfo(resp.value);
          notif.success({ body: conf.LANG.USER.AUTH.PROFILE_SUCCESS });
        }, errfn);
      }, errfn);
    };

    /**
    * #### removeAccount
    *
    * This function :
    *
    * - inform the user about that no return will be possible
    * - asks for the current password and checks it
    * - remove the user and its groupds and pads, server-side
    * - logout the user
    * - and redirects him to the homepage
    */

    c.removeAccount = function () {
      var password = window.prompt(conf.LANG.USER.INFO.REMOVE_ACCOUNT_SURE);
      if (password) {
        var login = auth.userInfo().login;
        m.request({
          method: 'POST',
          url: conf.URLS.CHECK,
          data: {
            login: login,
            password: password,
            auth_token: auth.token()
          }
        }).then(function () {
          m.request({
            method: 'DELETE',
            url: conf.URLS.USER + '/' + login,
            data: { auth_token: auth.token() }
          }).then(function () {
            localStorage.removeItem('token');
            auth.userInfo(null);
            model.init();
            document.title = conf.SERVER.title;
            m.route('/');
            notif.success({
              body: conf.LANG.USER.INFO.REMOVE_ACCOUNT_SUCCESS
            });
          }, errfn);
        }, errfn);
      }
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};
  subscribe.views = view;

  /**
  * ### removeAccount
  *
  * `removeAccount` is the view intended to allow user to erase completely its
  * account.
  */

  view.removeAccount = function (c) {
    return [
      m('button.btn.btn-danger', {
        onclick: c.removeAccount
      }, conf.LANG.USER.REMOVE_ACCOUNT),
      m('i', {
        class: 'glyphicon glyphicon-info-sign mp-tooltip mp-tooltip-left',
        'data-msg': conf.LANG.USER.INFO.REMOVE_ACCOUNT
      })
    ];
  };

  /**
  * ### form view
  *
  * Classic view with all fields and changes according to the view.
  */

  view.form = function (c) {
    var fields = ld.reduce(c.fields, function (memo, f) {
      memo[f] = user.view.field[f](c);
      return memo;
    }, {});
    if (c.adminView()) {
      delete fields.password.input.attrs.required;
      delete fields.passwordConfirm.input.attrs.required;
    }
    var requiredFields;
    if (conf.SERVER.authMethod === 'ldap' && c.profileView()) {
      requiredFields = [
        m('.form-group', [
          fields.lang.label, fields.lang.icon,
          m('.col-sm-7', fields.lang.select)
        ])
      ];
    } else {
      fields.email.label.attrs.class = 'col-sm-4';
      requiredFields = [
        m('.form-group', [
          fields.email.label,
          m('.col-sm-7', fields.email.input)
        ]),
        m('.form-group', [
          fields.password.label,
          m('.col-sm-7', fields.password.input)
        ]),
        m('.form-group', [
          fields.passwordConfirm.label,
          m('.col-sm-7', fields.passwordConfirm.input)
        ]),
        m('.form-group', [
          fields.lang.label,
          m('.col-sm-7', fields.lang.select)
        ])
      ];
    }
    if (c.profileView()) {
      var passC = user.view.field.passwordCurrent(c);
      passC.input.attrs.config = form.focusOnInit;
      requiredFields.splice(1, 0,
        m('.form-group', [
          passC.label,
          m('.col-sm-7', passC.input)
        ]
      ));
      requiredFields.push(
        m('.form-group', [
          m('.col-sm-7.col-sm-offset-4', [
            m('.checkbox', [
              fields.useLoginAndColorInPads.label,
            ])
          ])
        ])
      );
    } else if (!c.adminView()) {
      var log = fields.login;
      log.input.attrs.config = form.focusOnInit;
      log.input.attrs.maxlength = 40;
      log.label.attrs.class = 'col-sm-4';
      requiredFields.splice(0, 0,
        m('.form-group', [
          log.label,
          m('.col-sm-7', [log.input])
        ])
      );
    }
    var USER = conf.LANG.USER;
    var profOrAdm = (c.profileView() || c.adminView());
    var optionalFields;
    if (conf.SERVER.authMethod === 'ldap' && c.profileView()) {
      fields.organization.label.attrs.class = 'col-sm-4';
      fields.color.label.attrs.class = 'col-sm-4';
      optionalFields = [
        m('legend.opt', conf.LANG.USER.OPTIONAL_FIELDS),
          m('.form-group', [
            fields.organization.label,
            m('.col-sm-7', fields.organization.input)
          ]),
          m('.form-group', [
            fields.color.label,
            m('.col-sm-7', fields.color.input)
          ])
      ];
    } else {
      fields.firstname.label.attrs.class = 'col-sm-4';
      fields.lastname.label.attrs.class = 'col-sm-4';
      fields.organization.label.attrs.class = 'col-sm-4';
      fields.color.label.attrs.class = 'col-sm-4';
      optionalFields = [
        m('legend.opt', conf.LANG.USER.OPTIONAL_FIELDS),
          m('.form-group', [
            fields.firstname.label,
            m('.col-sm-7', fields.firstname.input)
          ]),
          m('.form-group', [
            fields.lastname.label,
            m('.col-sm-7', fields.lastname.input)
          ]),
          m('.form-group', [
            fields.organization.label,
            m('.col-sm-7', fields.organization.input)
          ]),
          m('.form-group', [
            fields.color.label,
            m('.col-sm-7', fields.color.input)
          ])
      ];
    }
    return m('form.form-horizontal', {
      id: 'subscribe-form',
      onsubmit: profOrAdm ? c.submit.profileSave : c.submit.subscribe
      }, [
      m('div', {
        id: 'hide-when-ready',
        config: ready.checkLoop
      }, conf.LANG.USER.PLEASE_WAIT),
      m('fieldset.show-when-ready.hidden', [
        m('legend', conf.LANG.USER.MANDATORY_FIELDS),
        m('div', requiredFields)
      ]),
      m('fieldset.show-when-ready.hidden', optionalFields),
      m('.form-group.show-when-ready.hidden', [
        m('.col-sm-12', [
          m('input.btn.btn-success pull-right', {
            form: 'subscribe-form',
            type: 'submit',
            value: profOrAdm ? conf.LANG.ACTIONS.SAVE : USER.REGISTER
          }),
          c.profileView() ? view.removeAccount(c) : ''
        ])
      ])
    ]);
  };


  /**
  * ### main and global view
  *
  * Views with cosmetic and help changes according to the current page.
  */

  view.main = function (c) {
    var elements = [view.form(c)];
    if (c.profileView()) {
      elements.splice(0, 0, m('h2',
        conf.LANG.USER.PROFILE + ' : ' + auth.userInfo().login));
    } else {
      elements.splice(0, 0, m('h2', conf.LANG.USER.SUBSCRIBE));
    }
    return m('section', { class: 'user' }, elements);
  };

  subscribe.view = function (c) {
    return layout.view(
      view.main(c),
      c.profileView() ? user.view.aside.profile(c) : user.view.aside.common(c)
    );
  };

  return subscribe;
}).call(this);
