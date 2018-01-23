/**
*  # User module
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
*  This module contains common functions for `login`, `subscribe` and `profile`
*  modules.
*/

module.exports = (function () {
  // Global dependencies
  var ld = require('lodash');
  var m = require('mithril');
  // Local dependencies
  var conf = require('../configuration.js');
  var form = require('../helpers/form.js');

  var user = {};

  /**
  * ## Views
  */

  user.view = {};

  /**
  * ### Icons
  *
  * An `icon` consists on input helper, linked to a field.
  */

  user.view.icon = {};

  /**
  * #### optional icon
  *
  * `optional` icon is the base icon for all optional fields
  */

  user.view.icon.optional = function () {
    return m('i', {
      class: 'mp-tooltip glyphicon glyphicon-info-sign',
      'data-msg': conf.LANG.USER.INFO.OPTIONAL
    });
  };
  user.view.icon.firstname = user.view.icon.optional;
  user.view.icon.lastname = user.view.icon.optional;
  user.view.icon.organization = user.view.icon.optional;

  /**
  * ### login icon
  */

  user.view.icon.login = function (c) {
    return form.icon(c, 'login', conf.LANG.USER.INFO.LOGIN,
      conf.LANG.USER.ERR.LOGIN);
  };

  /**
  * #### password icon
  *
  * `password` icon gathers all password types and only change the message
  * according to the given `name`
  */

  user.view.icon.password = function (c, name) {
    var infos = {
      password: conf.LANG.USER.INFO.PASSWORD_BEGIN + conf.SERVER.passwordMin +
        ' ' + conf.LANG.GLOBAL.AND + ' ' + conf.SERVER.passwordMax +
        conf.LANG.USER.INFO.PASSWORD_END,
      passwordConfirm: conf.LANG.USER.INFO.PASSWORD_CHECK,
      passwordCurrent: conf.LANG.USER.INFO.PASSWORD_CURRENT
    };
    var icls = ['glyphicon glyphicon-exclamation-sign'];
    if (c.valid[name]()) {
      icls = ['glyphicon glyphicon-info-sign'];
    }
    icls.push('mp-tooltip');
    return m('i', {
      class: icls.join(' '),
      'data-msg': infos[name]
    });
  };

  /**
  * #### email icon
  */

  user.view.icon.email = function (c) {
    return form.icon(c, 'email', conf.LANG.USER.INFO.EMAIL,
      conf.LANG.USER.ERR.EMAIL);
  };

  /**
  * #### color icon
  */

  user.view.icon.color = function (c) {
    return form.icon(c, 'color', conf.LANG.USER.INFO.COLOR,
      conf.LANG.USER.ERR.COLOR);
  };

  /**
  * ### Fields
  *
  * Each `field` is a view returning three vdom elements :
  *
  * - a `label`
  * - an `input`
  * - the `icon`
  */

  user.view.field = {};

  /**
  * #### login
  */

  user.view.field.login = function (c) {
    var fields = form.field(c, 'login', conf.LANG.USER.USERNAME,
      user.view.icon.login(c));
    ld.assign(fields.input.attrs, {
        type: 'text',
        placeholder: conf.LANG.USER.USERNAME,
        required: true
    });
    return fields;
  };

  /**
  * #### _pass
  *
  * `_pass` common helper that takes
  *
  * - the `c` controller,
  * - the `name` of the field,
  * - the `label` locale,
  * - an `extraValid` optional function for performing extra HTML5 validation
  *
  * It returns the classic triplet `label`, `input` and `icon` vdoms.
  */

  user.view.field._pass = function (c, name, label, extraValid) {
    var passMin = conf.SERVER.passwordMin;
    var passMax = conf.SERVER.passwordMax;
    var icon = user.view.icon.password(c, name);
    return {
      label: m('label.col-sm-4', { for: name }, [ label, icon ]),
      input: m('input.form-control', {
        type: 'password',
        name: name,
        placeholder: conf.LANG.USER.UNDEF,
        required: (!c.profileView || !c.profileView()),
        minlength: passMin,
        maxlength: passMax,
        pattern: '.{' + passMin + ',' + passMax + '}',
        oninput: form.handleField.bind(null, c, extraValid)
      }),
      icon: icon
    };
  };

  /**
  * #### password field
  *
  * Classic `password` field
  */

  user.view.field.password = function (c) {
    return user.view.field._pass(c, 'password', conf.LANG.USER.PASSWORD);
  };

  /**
  * #### passwordConfirm field
  *
  * Special password field for password change, with extra HTML5 validation :
  * must be the same as password.
  *
  */

  user.view.field.passwordConfirm = function (c) {
    var extraValid = function (c) {
      return (c.data.password() === c.data.passwordConfirm());
    };
    var vdom = user.view.field._pass(c, 'passwordConfirm',
      conf.LANG.USER.PASSCHECK, extraValid);
    return vdom;
  };

  /**
  * #### passwordCurrent field
  *
  * `passwordCurrent` is a password field used into the user profile, required
  * to validate each change.
  */

  user.view.field.passwordCurrent = function (c) {
    var vdom = user.view.field._pass(c, 'passwordCurrent',
      conf.LANG.USER.PASSCURRENT);
    ld.assign(vdom.label.attrs, { style: { fontWeight: 'bold' } });
    ld.assign(vdom.input.attrs, { required: true });
    return vdom;
  };

  /**
  * #### email field
  */

  user.view.field.email = function (c) {
    var fields = form.field(c, 'email', conf.LANG.USER.EMAIL,
      user.view.icon.email(c));
    ld.assign(fields.input.attrs, {
        type: 'email',
        placeholder: conf.LANG.USER.EMAIL_SAMPLE,
        required: true,
        value: c.data.email() || '',
    });
    return fields;
  };

  /**
  * #### lang field
  */

  user.view.field.lang = function (c) {
    var icon = m('i', {
      class: 'mp-tooltip glyphicon glyphicon-info-sign',
      'data-msg': conf.LANG.USER.INFO.LANG
    });
    var label = m('label.col-sm-4', { for: 'lang' }, [ conf.LANG.USER.LANG, icon ]);
    var select = m('select.form-control', {
        name: 'lang',
        required: true,
        value: c.data.lang(),
        onchange: m.withAttr('value', c.data.lang)
        }, ld.reduce(conf.SERVER.languages, function (memo, v, k) {
          memo.push(m('option', { value: k }, v));
          return memo;
        }, [])
      );
    return { label: label, icon: icon, select: select };
  };

  /**
  * #### useLoginAndColorInPads field
  */

  user.view.field.useLoginAndColorInPads = function (c) {
    return {
      label: m('label', [
        m('input', {
          type: 'checkbox',
          name: 'useLoginAndColorInPads',
          checked: c.data.useLoginAndColorInPads(),
          onchange: m.withAttr('checked', c.data.useLoginAndColorInPads)
        }),
        conf.LANG.USER.USELOGINANDCOLORINPADS
      ]),
      icon: m('i',{
        class: 'mp-tooltip glyphicon glyphicon-info-sign',
        'data-msg': conf.LANG.USER.INFO.USELOGINANDCOLORINPADS
      }),
    };
  };

  /**
  * #### firstname field
  */

  user.view.field.firstname = function (c) {
    var fields = form.field(c, 'firstname', conf.LANG.USER.FIRSTNAME,
      user.view.icon.firstname(c));
    ld.assign(fields.input.attrs, {
        type: 'text',
        placeholder: conf.LANG.USER.FIRSTNAME
    });
    return fields;
  };

  /**
  * #### lastname field
  */

  user.view.field.lastname = function (c) {
    var fields = form.field(c, 'lastname', conf.LANG.USER.LASTNAME,
      user.view.icon.lastname(c));
    ld.assign(fields.input.attrs, {
        type: 'text',
        placeholder: conf.LANG.USER.LASTNAME
    });
    return fields;
  };

  /**
  * #### organization field
  */

  user.view.field.organization = function (c) {
    var fields = form.field(c, 'organization', conf.LANG.USER.ORGANIZATION,
      user.view.icon.organization(c));
    ld.assign(fields.input.attrs, {
        type: 'text',
        placeholder: conf.LANG.USER.ORGANIZATION
    });
    return fields;
  };

  /**
  * #### color field
  */

  user.view.field.color = function (c) {
    var fields = form.field(c, 'color', conf.LANG.USER.COLOR,
      user.view.icon.color(c));
    ld.assign(fields.input.attrs, {
      type: 'color',
      placeholder: conf.LANG.USER.COLOR_SAMPLE,
      maxlength: 7,
      pattern: '#[0-9,a-f]{6}'
    });
    return fields;
  };

  /**
  * ### aside view
  *
  * `aisde` views :
  *
  * - `common`, used for login and subscription pages
  * - `profile`, as expected for profile page.
  */

  user.view.aside = {
    common: function () {
      return m('section.user-aside', [
        m('h2', conf.SERVER.title),
        m('article.well', m.trust(conf.LANG.GLOBAL.DESCRIPTION))
      ]);
    },
    profile: function () {
      return m('section.user-aside', [
        m('h2', conf.LANG.ACTIONS.HELP),
        m('article.well', m.trust(conf.LANG.USER.HELP.PROFILE)) ]);
    }
  };

  return user;

}).call(this);
