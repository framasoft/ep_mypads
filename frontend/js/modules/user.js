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
  var USER = conf.LANG.USER;
  var form = require('../helpers/form.js');
  // Style dependencies
  var userStyle = require('../../style/modules/user.js');
  var tooltipStyle = require('../../style/tooltip.js');
  var stylesDetach = require('../../style/utils.js').fn.detach;

  var user = {};

  /**
  * ## Controller
  */

  user.controller = function () {
    userStyle.attach();
    var c = {};
    c.classes = {
      tooltip: tooltipStyle.sheet.main.classes,
      user: userStyle.sheet.main.classes
    };
    c.onunload = stylesDetach.bind(null, userStyle.sheet);
    return c;
  };

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
  * #### common
  *
  * `common` is an helper that makes an classic icon by its :
  *
  * - `c` controller,
  * - `name` of the field,
  * - `info` message
  * - `err` message
  *
  * It returns a vdom node.
  */

  user.view.icon.common = function (c, name, info, err) {
    var icls = c.valid[name]() ? ['icon-info-circled'] : ['icon-alert'];
    icls.push(c.classes.tooltip.global);
    icls.push(c.classes.user.i);
    icls.push('block');
    var msg = c.valid[name]() ? info : err;
    return m('i', {
      class: icls.join(' '),
      'data-msg': msg
    });
  };

  user.view.icon.optional = function (c) {
    var icls = ['block icon-info-circled', c.classes.tooltip.global,
      c.classes.user.i];
    return m('i', { class: icls.join(' '), 'data-msg': USER.INFO.OPTIONAL });
  };
  user.view.icon.firstname = user.view.icon.optional;
  user.view.icon.lastname = user.view.icon.optional;
  user.view.icon.org = user.view.icon.optional;

  user.view.icon.login = function (c) {
    return user.view.icon.common(c, 'login', USER.INFO.LOGIN, USER.ERR.LOGIN);
  };

  user.view.icon.password = function (c, name) {
    var infos = {
      password: USER.INFO.PASSWORD_BEGIN + conf.SERVER.passwordMin +
        ' ' + conf.LANG.GLOBAL.AND + ' ' + conf.SERVER.passwordMax +
        USER.INFO.PASSWORD_END,
      passwordConfirm: USER.INFO.PASSWORD_CHECK,
      passwordCurrent: USER.INFO.PASSWORD_CURRENT
    };
    var icls = c.valid[name]() ? ['icon-info-circled'] : ['icon-alert'];
    icls.push(c.classes.tooltip.global);
    icls.push(c.classes.user.i);
    icls.push('block');
    return m('i', {
      class: icls.join(' '),
      'data-msg': infos[name]
    });
  };

  user.view.icon.email = function (c) {
    return user.view.icon.common(c, 'email', USER.INFO.EMAIL, USER.ERR.EMAIL);
  };

  /**
  * ### Fields
  *
  * Each `field` is a view returning three elements :
  *
  * - a `łabel`
  * - an `input`
  * - the helper `icon`
  */

  user.view.field = {};

  /**
  * #### common
  *
  * `common` is an helper that returns the triplet quoted before, by taking
  *
  * - the `name` of the field,
  * - the `label` locale
  */

  user.view.field.common = function (c, name, label) {
    return {
      label: m('label', {
        class: 'block ' + c.classes.user.label,
        for: name
      }, label),
      input: m('input', {
        class: 'block ' + c.classes.user.input,
        name: name,
        value: c.data[name]() || '',
        oninput: form.handleField.bind(null, c)
      }),
      icon: user.view.icon[name](c)
    };
  };

  user.view.field.login = function (c) {
    var fields = user.view.field.common(c, 'login', USER.USERNAME);
    ld.assign(fields.input.attrs, {
        type: 'text',
        placeholder: USER.LOGIN,
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
  * - an `extraValid` function for performing extra HTML5 validation
  *
  * It returns the classic triplet `label`, `input` and `icon`.
  */

  user.view.field._pass = function (c, name, label, extraValid) {
    var passMin = conf.SERVER.passwordMin;
    var passMax = conf.SERVER.passwordMax;
    return {
      label: m('label', {
        class: 'block ' + c.classes.user.label,
        for: name
      }, label),
      input: m('input', {
        class: 'block ' + c.classes.user.input,
        type: 'password',
        name: name,
        placeholder: USER.UNDEF,
        required: (!c.profileView || !c.profileView()),
        minlength: passMin,
        maxlength: passMax,
        pattern: '.{' + passMin + ',' + passMax + '}',
        oninput: form.handleField.bind(null, c, extraValid)
      }),
      icon: user.view.icon.password(c, name)
    };
  };

  user.view.field.password = function (c) {
    var vdom = user.view.field._pass(c, 'password', USER.PASSWORD);
    ld.assign(vdom.input.attrs, {});
    return vdom;
  };

  user.view.field.passwordConfirm = function (c) {
    var extraValid = function (c) {
      return (c.data.password() === c.data.passwordConfirm());
    };
    var vdom = user.view.field._pass(c, 'passwordConfirm', USER.PASSCHECK,
      extraValid);
    return vdom;
  };

  user.view.field.passwordCurrent = function (c) {
    var vdom = user.view.field._pass(c, 'passwordCurrent', USER.PASSCURRENT);
    ld.assign(vdom.label.attrs, { style: { fontWeight: 'bold' } });
    ld.assign(vdom.input.attrs, { required: true });
    return vdom;
  };

  user.view.field.email = function (c) {
    var fields = user.view.field.common(c, 'email', USER.EMAIL);
    ld.assign(fields.input.attrs, {
        type: 'email',
        placeholder: USER.EMAIL_SAMPLE,
        required: true,
        value: c.data.email() || '',
    });
    return fields;
  };

  user.view.field.firstname = function (c) {
    var fields = user.view.field.common(c, 'firstname', USER.FIRSTNAME);
    ld.assign(fields.input.attrs, {
        type: 'text',
        placeholder: USER.FIRSTNAME
    });
    return fields;
  };

  user.view.field.lastname = function (c) {
    var fields = user.view.field.common(c, 'lastname', USER.LASTNAME);
    ld.assign(fields.input.attrs, {
        type: 'text',
        placeholder: USER.LASTNAME
    });
    return fields;
  };

  user.view.field.org = function (c) {
    var fields = user.view.field.common(c, 'org', USER.ORGANIZATION);
    ld.assign(fields.input.attrs, {
        type: 'text',
        placeholder: USER.ORGANIZATION
    });
    return fields;
  };


  user.view.aside = function (c) {
    return m('section', { class: c.classes.user.sectionAside }, [
      m('h2', { class: c.classes.user.h2Aside }, conf.SERVER.title),
      m('article',
        { class: c.classes.user.articleAside },
        m.trust(conf.SERVER.descr))
    ]);
  };

  return user;

}).call(this);
