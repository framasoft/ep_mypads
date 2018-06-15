/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
  var cookies = require('js-cookie');
  // Local dependencies
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var form = require('../helpers/form.js');
  var notif = require('../widgets/notification.js');
  var layout = require('./layout.js');
  var user = require('./user.js');
  var ready = require('../helpers/ready.js');

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
    document.title = conf.SERVER.title;
    form.initFields(c, ['login', 'password']);

    /**
    * `submit` internal calls the public API to login with given login and
    * password. It displays errors if needed or success and fixes local cached
    * data for the user. It also updates UI lang if needed.
    */

    c.submit = function (e) {
      e.preventDefault();
      if (!c.data.login()) {
        var $login = document.querySelector('input[name=login]');
        c.data.login($login.value);
      }
      if (!c.data.password()) {
        var $pass = document.querySelector('input[name=password]');
        c.data.password($pass.value);
      }
      m.request({
        method: 'POST',
        url: conf.URLS.LOGIN,
        data: c.data
      }).then(login.getLogged,
      function (err) {
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
    login.input.attrs.maxlength = 40;
    login.label.attrs.class = 'col-sm-4';
    var password = user.view.field.password(c);
    var passwordBlock = [ password.input ];
    if (conf.SERVER.authMethod === 'internal') {
      passwordBlock.push(
        m('p.help-block', [
          m('a', {
            href: '/passrecover',
            config: m.route
          }, conf.LANG.USER.PASSWORD_LOST)
        ])
      );
    }

    return m('form.form-horizontal.col-sm-8.col-sm-offset-2.well', {
      id: 'login-form', onsubmit: c.submit }, [
      m('div', {
        id: 'hide-when-ready',
        config: ready.checkLoop
      }, conf.LANG.USER.PLEASE_WAIT),
      m('fieldset.show-when-ready.hidden', [
        m('legend', conf.LANG.USER.MYPADS_ACCOUNT),
        m('.form-group', [
          login.label,
          m('.col-sm-7', login.input)
        ]),
        m('.form-group', [
          password.label,
          m('.col-sm-7', passwordBlock)
        ]),
        m('input.btn.btn-success.pull-right', {
          form: 'login-form',
          type: 'submit',
          value: conf.LANG.USER.LOGIN
        })
      ])
    ]);
  };

  view.main = function (c) {
    var children = [ m('span', conf.LANG.USER.FORM) ];
    if (conf.SERVER.openRegistration && conf.SERVER.authMethod === 'internal') {
      children.push(m('a.small',
        { href: '/subscribe', config: m.route },
        conf.LANG.USER.ORSUB)
      );
    }
    return m('section', { class: 'user' }, [
      m('h2', children),
      view.form(c)
    ]);
  };

  login.view = function (c) {
    switch (conf.SERVER.authMethod) {
      case 'cas':
        if (typeof auth.userInfo() === 'undefined') {
          var params = window.location.search.substring(1);
          var ticket = params.match(new RegExp('.*&ticket=([^&]*).*'));
          console.log(ticket);
          if (!ld.isNull(ticket)) {
            m.request({
              method: 'POST',
              url: conf.URLS.CASLOGIN,
              data: {ticket: ticket[1]}
            }).then(login.getLogged,
            function (err) {
              notif.error({ body: ld.result(conf.LANG, err.error) });
            });
          } else {
            var loc = window.location;
            var service = encodeURIComponent(loc.origin+loc.pathname+'?/login');
            window.location = conf.SERVER.authCasSettings.base_url+'/login?service='+service;
          }
          break;
        }
      default:
        return layout.view(view.main(c), user.view.aside.common(c));
    }
  };

  login.getLogged = function (resp) {
    auth.userInfo(resp.user);
    localStorage.setItem('token', resp.token);

    /*
     * Fix pad authorship mixup
     * See https://framagit.org/framasoft/ep_mypads/issues/148
     */
    var myPadsAuthorCookie  = cookies.get('token-' + resp.user.login);
    if (myPadsAuthorCookie) {
      // 60 days
      cookies.set('token', myPadsAuthorCookie, { expires: 60 });
    } else {
      var browserAuthorCookie = cookies('token');
      if (browserAuthorCookie) {
        // 365 days
        cookies.set('token-' + resp.user.login, browserAuthorCookie, { expires: 365 });
      }
    }

    var lang = auth.userInfo().lang;
    if (lang !== conf.USERLANG) {
      conf.updateLang(lang);
    }
    document.title = ' - ' + conf.LANG.USER.AUTH.WELCOME + ' ' +
      resp.user.login + conf.SERVER.title;
    notif.success({ body: conf.LANG.USER.AUTH.SUCCESS });
    var unauthUrl = conf.unauthUrl();
    if (!ld.isEmpty(unauthUrl)) {
      window.location = unauthUrl;
    } else {
      m.route('/');
    }
  };
  return login;
}).call(this);
