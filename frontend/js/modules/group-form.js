/**
*  # Group form module
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
*  This module is the main one, containing groups and pads.
*/

module.exports = (function () {
  'use strict';
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var GROUP = conf.LANG.GROUP;
  var auth = require('../auth.js');
  var layout = require('./layout.js');
  var form = require('../helpers/form.js');
  var notif = require('./notification.js');
  var model = require('../model/group.js');

  var gf = {};

  /**
  * ## Controller
  *
  * Used for authentication enforcement, edit or add recognition and state.
  * Stores old private status to add the ability to update a group without
  * retyping the password.
  */

  gf.controller = function () {
    if (!auth.isAuthenticated()) {
      return m.route('/login');
    }
    var c = {};
    var init = function () {
      c.addView = m.prop(m.route() === '/mypads/group/add');
      c.fields = ['name', 'visibility', 'password', 'readonly'];
      form.initFields(c, c.fields);
      c.data.visibility('restricted');
      if (!c.addView()) {
        var key = m.route.param('key');
        c.group = model.data()[key];
        ld.map(ld.keys(c.group), function (f) {
            c.data[f] = m.prop(c.group[f]);
        });
        c.data.password = m.prop('');
        c.private = m.prop(c.data.visibility() === 'private');
      }
    };
    if (ld.isEmpty(model.data())) { model.fetch(init); } else { init(); }

    /**
    * `submit` internal calls the public API to add a new group or edit an
    * existing with entered data. It adds necessary fields and displays errors
    * if needed or success.
    */
    c.submit = function (e) {
      e.preventDefault();
      var opts = (function () {
        var _o = { params: {}, extra: {} };
        if (c.addView()) {
          _o.params.method = 'POST';
          _o.params.url = conf.URLS.GROUP;
          _o.extra.msg = GROUP.INFO.ADD_SUCCESS;
        } else {
          _o.params.method = 'PUT';
          _o.params.url = conf.URLS.GROUP + '/' + c.group._id;
          _o.extra.msg = GROUP.INFO.EDIT_SUCCESS;
        }
        return _o;
      })();
      opts.params.data = ld.assign(c.data, { admin: auth.userInfo()._id });
      m.request(opts.params).then(function (resp) {
        var data = model.data();
        data[resp.key] = resp.value;
        model.data(data);
        notif.success({ body: opts.extra.msg });
        m.route('/mypads/group/list');
      }, function (err) {
        notif.error({ body: err.error });
      });
    };
    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.icon = {};

  /**
  * ### icon common
  *
  * `common` returns an icon info vdom with viven `msg` on tooltip.
  */

  view.icon.common = function (msg) {
    return m('i', {
      class: 'block tooltip icon-info-circled',
      'data-msg': msg
    });
  };

  view.icon.name = function (c) {
    return form.icon(c, 'name', GROUP.INFO.NAME, GROUP.ERR.NAME);
  };

  view.icon.visibility = view.icon.common(GROUP.INFO.VISIBILITY);
  view.icon.password = view.icon.common(GROUP.INFO.PASSWORD);
  view.icon.readonly = view.icon.common(GROUP.INFO.READONLY);

  /**
  * ### Fields
  *
  * Each `field` is a view returning three vdom elements :
  *
  * - a `label`
  * - an `input`
  * - the `icon`
  */

  view.field = {};

  view.field.name = function (c) {
    var f = form.field(c, 'name', GROUP.FIELD.NAME, view.icon.name(c));
    ld.assign(f.input.attrs, { required: true });
    return f;
  };

  view.field.visibility = function (c) {
    var label = m('label.block', { for: 'visibility' }, GROUP.FIELD.VISIBILITY);
    var select = m('select', {
      name: 'visibility',
      class: 'block',
      required: true,
      value: c.data.visibility(),
      onchange: m.withAttr('value', c.data.visibility)
    }, [
      m('option', { value: 'restricted' }, GROUP.FIELD.RESTRICTED),
      m('option', { value: 'private' }, GROUP.FIELD.PRIVATE),
      m('option', { value: 'public' }, GROUP.FIELD.PUBLIC)
    ]);
    return { label: label, icon: view.icon.visibility, select: select };
  };

  view.field.password = function (c) {
    var label = m('label.block', { for: 'password' }, conf.LANG.USER.PASSWORD);
    var input = m('input.block', {
      name: 'password',
      type: 'password',
      placeholder: conf.LANG.USER.UNDEF,
      value: c.data.password(),
      required: (c.addView() || !c.private()),
      oninput: m.withAttr('value', c.data.password)
    });
    return { label: label, icon: view.icon.password, input: input };
  };

  view.field.readonly = function (c) {
    var label = m('label.block', { for: 'readonly' }, GROUP.FIELD.READONLY);
    var input = m('input.block', {
      name: 'readonly',
      type: 'checkbox',
      checked: c.data.readonly(),
      onchange: m.withAttr('checked', c.data.readonly)
    });
    return { label: label, icon: view.icon.readonly, input: input };
  };

  /**
  * ### form view
  *
  * Classic view with all fields and changes according to the view.
  */

  view.form = function (c) {
    var _f = ld.reduce(c.fields, function (memo, f) {
      memo[f] = view.field[f](c);
      return memo;
    }, {});
    var fields = [ _f.name.label, _f.name.input, _f.name.icon,
      _f.visibility.label, _f.visibility.select, _f.visibility.icon
    ];
    if (c.data.visibility() === 'private') {
      fields.push(_f.password.label, _f.password.input, _f.password.icon);
    }
    fields.push(_f.readonly.label, _f.readonly.input, _f.readonly.icon);
    return m('form.block', {
      id: 'group-form',
      onsubmit: c.submit
    }, [
      m('fieldset.block-group', [
        m('legend', GROUP.GROUP),
        m('div', fields)
      ]),
      m('input.block.send', {
        form: 'group-form',
        type: 'submit',
        value: conf.LANG.ACTIONS.SAVE
      })
    ]);
  };

  /**
  * ### main and global view
  *
  * Views with cosmetic and help changes according to the current page.
  */

  view.main = function (c) {
    return m('section', { class: 'block-group user group-form' }, [
      m('h2.block', c.addView() ? GROUP.ADD : GROUP.EDIT_GROUP),
      view.form(c)
    ]);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(GROUP.ADD_HELP))
    ]);
  };

  gf.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return gf;
}).call(this);
