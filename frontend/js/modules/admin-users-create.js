/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Admin Users Form creation module
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
*  This module, reserved to admins, allows to edit user profile.
*  It relies heavily on subscription module.
*/

module.exports = (function () {
  // Global dependencies
  var m  = require('mithril');
  var ld = require('lodash');

  // Local dependencies
  var conf      = require('../configuration.js');
  var auth      = require('../auth.js');
  var notif     = require('../widgets/notification.js');
  var layout    = require('./layout.js');
  var form      = require('../helpers/form.js');
  var subscribe = require('./subscribe.js');

  var admin = {};

  /**
  * ## Controller
  *
  * Used to check authentication and state.
  */

  admin.controller = function () {
    if (!auth.isAdmin()) { return m.route('/admin'); }
    document.title = conf.LANG.ADMIN.FORM_USER_CREATE + ' - ' + conf.SERVER.title;

    var c = {
      adminView:   m.prop(false),
      profileView: m.prop(false),
      user:        m.prop(false)
    };

    var init = function () {
      c.fields = ['login', 'password', 'passwordConfirm', 'email', 'firstname',
        'lastname', 'organization', 'padNickname', 'lang', 'color', 'hideHelp'];
      form.initFields(c, c.fields);
      var u = c.user();
      ld.forEach(c.fields, function (f) {
        if (!ld.startsWith(f, 'password')) {
          c.data[f] = m.prop(u[f]);
        }
      });
      c.data.lang(conf.SERVER.defaultLanguage);
    };

    /**
    * #### submit
    *
    * This function :
    *
    * - uses the public API to check if given `passwordCurrent` is valid;
    * - then updates data as filled, taking care of password change with the
    *   help of the `passwordUpdate` function;
    * - notifies *errors* and *success*;
    * - updates the local cache of `auth.userInfo`.
    */

    var errfn = function (err) {
      m.route('/admin/users');
      return notif.error({ body: ld.result(conf.LANG, err.error) });
    };

    c.submit = {
      subscribe: function (e) {
        e.preventDefault();
        var pass = c.data.password();
        if (pass && (pass !== c.data.passwordConfirm())) {
          return notif.warning({ body: conf.LANG.USER.ERR.PASSWORD_MISMATCH });
        }
        m.request({
          method: 'POST',
          url: conf.URLS.USER,
          data: ld.assign(c.data, { auth_token: auth.admToken() })
        }).then(function () {
          notif.success({ body: conf.LANG.ADMIN.SUBSCRIBE_SUCCESS });
          m.route('/admin/users');
        }, errfn);
      }
    };

    init();

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.main = function (c) {
    var elements = [
      m('h2', conf.LANG.ADMIN.FORM_USER_CREATE),
      subscribe.views.form(c)
    ];
    return m('section', { class: 'user' }, elements);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article.well', m.trust(conf.LANG.ADMIN.HELP_USER_CREATE))
    ]);
  };

  admin.view = function (c) {
    return layout.view(
      view.main(c),
      view.aside()
    );
  };

  return admin;

}).call(this);
