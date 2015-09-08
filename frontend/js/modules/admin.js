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
  var auth = require('../auth.js');
  var notif = require('../widgets/notification.js');
  var layout = require('./layout.js');
  var user = require('./user.js');
  var form = require('../helpers/form.js');

  var admin = {};

  /**
  * ## Controller
  *
  * Used to check if user is authorized, send login/pass and updates settings.
  */

  admin.controller = function () {
    document.title = conf.LANG.ADMIN.FORM_LOGIN + ' - ' + conf.SERVER.title;
    var c = {};
    auth.isAuthenticated(false);
    form.initFields(c, ['login', 'password']);
    var init = function () {
      m.request({
        url: conf.URLS.CONF,
        method: 'GET'
      }).then(function (resp) {
        form.initFields(c, ['title', 'rootUrl', 'passwordMin', 'passwordMax',
          'defaultLanguage', 'checkMails', 'tokenDuration', 'SMTPHost',
          'SMTPPort', 'SMTPSSL', 'SMTPTLS', 'SMTPUser', 'SMTPPass',
          'SMTPEmailFrom']);
        c.currentConf = resp.value;
        ld.forIn(resp.value, function (v, k) {
          c.data[k] = m.prop(v);
        });
        if (c.data.rootUrl().length === 0) {
          var l = window.location;
          c.data.rootUrl(l.protocol + '//' + l.host);
        }
        var propInt = function (val) {
          val = val || 0;
          return function (v) {
            if (v !== undefined) { val = parseInt(v, 10); }
            return val;
          };
        };
        c.data.passwordMin = propInt(c.data.passwordMin());
        c.data.passwordMax = propInt(c.data.passwordMax());
        c.data.passwordMin.toJSON = function () {
          return c.data.passwordMin(); 
        };
        c.data.passwordMax.toJSON = function () {
          return c.data.passwordMax();
        };
        auth.isAdmin(true);
        document.title = conf.LANG.ADMIN.FORM_SETTINGS + ' - ' +
          conf.SERVER.title;
        notif.success({ body: conf.LANG.USER.AUTH.SUCCESS });
      }, function (err) {
        notif.error({ body: ld.result(conf.LANG, err.error) });
      });
    };
    if (auth.isAdmin()) { init(); }

    /**
    * ### login
    *
    * `login` is an asynchronous function that is called after admin login
    * attempt. It uses crafted credentials to log with basic auth to etherpad
    * instance. If it's a success, settings page will be set up, taking care of
    * integer fields like `passwordMin`.
    */

    c.login = function (e) {
      e.preventDefault();
      var credentials = c.data.login() + ':' + c.data.password();
      var url = document.location.protocol + '//' + credentials + '@' +
        document.location.host + '/admin';
      m.request({
        url: url,
        method: 'GET',
        deserialize: function () {}
      }).then(init, function () {
        auth.isAdmin(false);
        var emsg = conf.LANG.BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT;
        notif.error({ body: emsg });
      });
    };

    /**
    * ### submit
    *
    * `submit` asynchronous function checks if passwords size are correct and
    * what settings have changed. If there are new settings, they will be
    * updated through the API, using a recursive call.
    */

    c.submit = function (e) {
      e.preventDefault();
      if(c.data.passwordMin() > c.data.passwordMax()) {
        notif.warning({ body: conf.LANG.ADMIN.ERR.PASSWORD_SIZE });
        document.querySelector('input[name="passwordMin"]').focus();
      } else {
        var newConf = ld.reduce(c.data, function (memo,v, k) {
          if (v() !== c.currentConf[k]) { memo[k] = v; }
          return memo;
        }, {});
        var pairs = ld.pairs(newConf);
        var _set = function (pair) {
          m.request({
            method: 'PUT',
            url: conf.URLS.CONF + '/' + pair[0],
            data: { value: pair[1]() }
          }).then(function (resp) {
            if (pairs.length > 0) {
              _set(pairs.pop());
            } else {
              c.currentConf[resp.key] = resp.value;
              conf.SERVER[resp.key] = resp.value;
              notif.success({ body: conf.LANG.ADMIN.INFO.SUCCESS });
            }
          }, function (err) {
            notif.error({ body: ld.result(conf.LANG, err.error) });
          });
        };
        if (pairs.length > 0) {
          _set(pairs.pop());
        } else {
          notif.info({ body: conf.LANG.ADMIN.INFO.NOCHANGE });
        }
      }
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
    login.input.attrs.config = form.focusOnInit;
    login.icon.attrs['data-msg'] = conf.LANG.ADMIN.INFO.LOGIN;
    var password = user.view.field.password(c);
    password.icon.attrs['data-msg'] = conf.LANG.USER.PASSWORD;
    delete password.input.attrs.pattern;
    delete password.input.attrs.minlength;
    delete password.input.attrs.maxlength;
    return m('form.block', {
      id: 'login-form', onsubmit: c.login }, [
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

  /**
  * ### settings
  *
  * View for admins : change default MyPads parameters as needed.
  */

  view.settings = function (c) {
    var A = conf.LANG.ADMIN;
    var f = {
      title: (function () {
        var icon = form.icon(c, 'title', A.INFO.TITLE, A.ERR.TITLE);
        var f = form.field(c, 'title', A.FIELD.TITLE, icon);
        ld.assign(f.input.attrs, { required: true });
        return f;
      })(),
      rootUrl: (function () {
        var icon = form.icon(c, 'rootUrl', A.INFO.ROOTURL, A.ERR.ROOTURL);
        var f = form.field(c, 'rootUrl', A.FIELD.ROOTURL, icon);
        ld.assign(f.input.attrs, { type: 'url' });
        return f;
      })(),
      passwordMin: (function () {
        var icon = form.icon(c, 'passwordMin', A.INFO.PASSWORD_MIN,
          A.ERR.PASSWORD_MIN);
        var f = form.field(c, 'passwordMin', A.FIELD.PASSWORD_MIN, icon);
        ld.assign(f.input.attrs, {
          type: 'number',
          min: '1',
          required: true
        });
        return f;
      })(),
      passwordMax: (function () {
        var icon = form.icon(c, 'passwordMax', A.INFO.PASSWORD_MAX,
          A.ERR.PASSWORD_MAX);
        var f = form.field(c, 'passwordMax', A.FIELD.PASSWORD_MAX, icon);
        ld.assign(f.input.attrs, {
          type: 'number',
          min: '1',
          required: true
        });
        return f;
      })(),
      defaultLanguage: (function () {
        var label = m('label.block', { for: 'defaultLanguage' },
          conf.LANG.ADMIN.FIELD.LANGUAGE_DEFAULT);
        var icon = m('i', {
          class: 'block tooltip icon-info-circled',
          'data-msg': conf.LANG.ADMIN.INFO.LANGUAGE_DEFAULT
        });
        var select = m('select', {
          name: 'defaultLanguage',
          class: 'block',
          required: true,
          value: c.data.defaultLanguage(),
          onchange: m.withAttr('value', c.data.defaultLanguage)
        }, ld.reduce(conf.SERVER.languages, function (memo, v, k) {
          memo.push(m('option', { value: k }, v));
          return memo;
          }, [])
        );
        return { label: label, icon: icon, select: select };
      })(),
      checkMails: (function () {
        var icon = form.icon(c, 'checkMails', A.INFO.CHECKMAILS);
        var f = form.field(c, 'checkMails', A.FIELD.CHECKMAILS, icon);
        ld.assign(f.input.attrs, {
          type: 'checkbox',
          checked: c.data.checkMails(),
          onchange: m.withAttr('checked', c.data.checkMails)
        });
        return f;
      })(),
      tokenDuration: (function () {
        var icon = form.icon(c, 'tokenDuration', A.INFO.TOKEN_DURATION);
        var f = form.field(c, 'tokenDuration', A.FIELD.TOKEN_DURATION, icon);
        ld.assign(f.label.attrs, { style: 'clear: left;' });
        ld.assign(f.input.attrs, { type: 'number' });
        return f;
      })(),
      SMTPHost: (function () {
        var icon = form.icon(c, 'SMTPHost', A.INFO.SMTP_HOST);
        return form.field(c, 'SMTPHost', A.FIELD.SMTP_HOST, icon);
      })(),
      SMTPPort: (function () {
        var icon = form.icon(c, 'SMTPPort', A.INFO.SMTP_PORT);
        var f = form.field(c, 'SMTPPort', A.FIELD.SMTP_PORT, icon);
        ld.assign(f.input.attrs, { type: 'number', min: 1 });
        return f;
      })(),
      SMTPSSL: (function () {
        var icon = form.icon(c, 'SMTPSSL', A.INFO.SMTP_SSL);
        var f = form.field(c, 'SMTPSSL', A.FIELD.SMTP_SSL, icon);
        ld.assign(f.input.attrs, {
          type: 'checkbox',
          checked: c.data.SMTPSSL(),
          onchange: m.withAttr('checked', c.data.SMTPSSL)
        });
        return f;
      })(),
      SMTPTLS: (function () {
        var icon = form.icon(c, 'SMTPTLS', A.INFO.SMTP_TLS);
        var f = form.field(c, 'SMTPTLS', A.FIELD.SMTP_TLS, icon);
        ld.assign(f.label.attrs, { style: 'clear: left;' });
        ld.assign(f.input.attrs, {
          type: 'checkbox',
          checked: c.data.SMTPTLS(),
          onchange: m.withAttr('checked', c.data.SMTPTLS)
        });
        return f;
      })(),
      SMTPUser: (function () {
        var icon = form.icon(c, 'SMTPUser', A.INFO.SMTP_USER);
        var f = form.field(c, 'SMTPUser', A.FIELD.SMTP_USER, icon);
        ld.assign(f.label.attrs, { style: 'clear: left;' });
        return f;
      })(),
      SMTPPass: (function () {
        var icon = form.icon(c, 'SMTPPass', A.INFO.SMTP_PASS);
        var f = form.field(c, 'SMTPPass', A.FIELD.SMTP_PASS, icon);
        ld.assign(f.input.attrs, { type: 'password' });
        return f;
      })(),
      SMTPEmailFrom: (function () {
        var icon = form.icon(c, 'SMTPEmailFrom', A.INFO.SMTP_EMAILFROM,
          A.ERR.SMTP_EMAILFROM);
        var f = form.field(c, 'SMTPEmailFrom', A.FIELD.SMTP_EMAILFROM, icon);
        ld.assign(f.input.attrs, { type: 'email' });
        return f;
      })()
    };
    return m('form.block', {
      id: 'settings-form',
      onsubmit: c.submit
    }, [
      m('fieldset.block-group', [
        m('legend', conf.LANG.ADMIN.SETTINGS_GENERAL),
        m('div', [ f.title.label, f.title.input, f.title.icon,
          f.rootUrl.label, f.rootUrl.input, f.rootUrl.icon,
          f.defaultLanguage.label, f.defaultLanguage.select,
          f.defaultLanguage.icon
        ])
      ]),
      m('fieldset.block-group', [
        m('legend', conf.LANG.ADMIN.SETTINGS_PASSWORD),
        m('div', [ f.passwordMin.label, f.passwordMin.input, f.passwordMin.icon,
          f.passwordMax.label, f.passwordMax.input, f.passwordMax.icon
        ])
      ]),
      m('fieldset.block-group', [
        m('legend', conf.LANG.ADMIN.SETTINGS_MAIL),
        m('div', [ f.checkMails.label, f.checkMails.input, f.checkMails.icon,
          f.tokenDuration.label, f.tokenDuration.input, f.tokenDuration.icon,
          f.SMTPHost.label, f.SMTPHost.input, f.SMTPHost.icon,
          f.SMTPPort.label, f.SMTPPort.input, f.SMTPPort.icon,
          f.SMTPSSL.label, f.SMTPSSL.input, f.SMTPSSL.icon,
          f.SMTPTLS.label, f.SMTPTLS.input, f.SMTPTLS.icon,
          f.SMTPUser.label, f.SMTPUser.input, f.SMTPUser.icon,
          f.SMTPPass.label, f.SMTPPass.input, f.SMTPPass.icon,
          f.SMTPEmailFrom.label, f.SMTPEmailFrom.input, f.SMTPEmailFrom.icon ])
      ]),
      m('input.block.send', {
        form: 'settings-form',
        type: 'submit',
        value: conf.LANG.ADMIN.FIELD.APPLY
      })
    ]);
  };

  view.main = function (c) {
    var elements = (function () {
      if (auth.isAdmin()) {
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
    return m('section', { class: 'block-group user admin' }, elements);
  };

  view.aside = function () {
    var helpKey = (auth.isAdmin() ? 'HELP_SETTINGS' : 'HELP_LOGIN');
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(conf.LANG.ADMIN[helpKey]))
    ]);
  };

  admin.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return admin;
}).call(this);
