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
  * ## View
  */

  user.view = {};
  user.view.icon = {};

  user.view.icon.login = function (c) {
    var icls = c.valid.login() ? ['icon-info-circled'] : ['icon-alert'];
    icls.push(c.classes.tooltip.global);
    icls.push(c.classes.user.i);
    icls.push('block');
    var msg = c.valid.login() ? USER.INFO.LOGIN : USER.ERR.LOGIN;
    return m('i', {
      class: icls.join(' '),
      'data-msg': msg
    });
  };

  user.view.icon.password = function (c) {
    var infoPass = USER.INFO.PASSWORD_BEGIN + conf.SERVER.passwordMin +
    ' and ' + conf.SERVER.passwordMax + USER.INFO.PASSWORD_END;
    var icls = c.valid.password() ? ['icon-info-circled'] : ['icon-alert'];
    icls.push(c.classes.tooltip.global);
    icls.push(c.classes.user.i);
    icls.push('block');
    return m('i', {
      class: icls.join(' '),
      'data-msg': infoPass
    });
  };

  user.view.field = {};

  user.view.field.login = function (c) {
    return {
      label: m('label', {
        class: 'block ' + c.classes.user.label,
        for: 'login'
      }, USER.USERNAME),
      input: m('input', {
        class: 'block ' + c.classes.user.input,
        type: 'text',
        name: 'login',
        placeholder: USER.LOGIN,
        required: true,
        oninput: form.handleField.bind(null, c)
      }),
      icon: user.view.icon.login(c)
    };
  };

  user.view.field.password = function (c) {
    var passMin = conf.SERVER.passwordMin;
    var passMax = conf.SERVER.passwordMax;
    return {
      label: m('label', {
        class: 'block ' + c.classes.user.label,
        for: 'password'
      }, USER.PASSWORD),
      input: m('input', {
        class: 'block ' + c.classes.user.input,
        type: 'password',
        name: 'password',
        placeholder: USER.UNDEF,
        required: true,
        minlength: passMin,
        maxlength: passMax,
        pattern: '.{' + passMin + ',' + passMax + '}',
        oninput: form.handleField.bind(null, c)
      }),
      icon: user.view.icon.password(c)
    };
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
