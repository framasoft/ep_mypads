/**
*  # Pad creation and edition module
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
*  Short module for pad adding and updating by name
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var auth = require('../auth.js');
  var layout = require('./layout.js');
  var form = require('../helpers/form.js');
  var group = require('./group-form.js');
  var conf = require('../configuration.js');
  var model = require('../model/group.js');
  var notif = require('../widgets/notification.js');

  var pf = {};

  /**
  * ## Controller
  *
  * Used for authentication enforcement and confirmation before removal. In all
  * cases, redirection to parent group view.
  */

  pf.controller = function () {
    if (!auth.isAuthenticated()) { return m.route('/login'); }
    var c = { groupParams: m.prop(true) };

    var key = m.route.param('pad');
    var gkey = m.route.param('group');

    var init = function () {
      c.addView = m.prop(!key);
      c.fields = ['name', 'visibility', 'password', 'readonly'];
      form.initFields(c, c.fields);
      if (!c.addView()) {
        c.pad = model.pads()[key];
        c.group = model.groups()[gkey];
        ld.map(ld.keys(c.pad), function (f) {
            c.data[f] = m.prop(c.pad[f]);
        });
        var ownFields = [ c.data.visibility(), c.data.readonly() ];
        c.groupParams = m.prop(ld.every(ownFields, ld.isNull));
        c.data.password = m.prop('');
      }
    };

    if (ld.isEmpty(model.groups())) { model.fetch(init); } else { init(); }

    c.submit = function (e) {
      e.preventDefault();
      var opts = (function () {
        if (c.addView()) {
          return {
            method: 'POST',
            url: conf.URLS.PAD,
            successMsg: conf.LANG.GROUP.INFO.PAD_ADD_SUCCESS
          };
        } else {
          return {
            method: 'PUT',
            url: conf.URLS.PAD + '/' + key,
            successMsg: conf.LANG.GROUP.INFO.PAD_EDIT_SUCCESS
          };
        }
      })();
      if (c.groupParams()) {
        c.data.visibility(null);
        c.data.password(null);
        c.data.readonly(null);
      }
      c.data.group = m.prop(gkey);
      m.request({
        method: opts.method,
        url: opts.url,
        data: c.data
      }).then(function (resp) {
        var pads = model.pads();
        pads[resp.key] = resp.value;
        model.pads(pads);
        if (c.addView()) {
          var groups = model.groups();
          groups[gkey].pads.push(resp.key);
          model.groups(groups);
        }
        notif.success({ body: opts.successMsg });
        m.route('/mypads/group/' + gkey + '/view');
      }, function (err) {
        notif.error({ body: ld.result(conf.LANG, err.error) });
      });
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  /**
  * ### groupParams field
  */

  view.groupParams = function (c) {
    var G = conf.LANG.GROUP;
    var icon = m('i', {
      class: 'block tooltip icon-info-circled',
      'data-msg': G.INFO.GROUP_PARAMS
    });
    return {
      label: m('label.block', { for: 'groupParams' }, G.FIELD.GROUP_PARAMS),
      input: m('input', {
        class: 'block',
        name: 'groupParams',
        type: 'checkbox',
        checked: c.groupParams(),
        onchange: m.withAttr('checked', c.groupParams)
      }),
      icon: icon
    };
  };

  /**
  * ### form view
  *
  * Classic view with all fields and changes according to the view.
  */

  view.form = function (c) {
    var name = group.views.field.name(c);
    ld.assign(name.input.attrs, { config: form.focusOnInit });
    var visibility = group.views.field.visibility(c, false);
    ld.assign(visibility.label.attrs, { style: 'clear: left;' });
    var password = group.views.field.password(c);
    var readonly = group.views.field.readonly(c);
    var groupParams = view.groupParams(c);

    var fields = [ name.label, name.input, name.icon,
      groupParams.label, groupParams.input, groupParams.icon ];

    if (!c.groupParams()) {
      fields.push(visibility.label, visibility.select, visibility.icon);
      if (c.data.visibility() === 'private') {
        fields.push(password.label, password.input, password.icon);
      }
      fields.push(readonly.label, readonly.input, readonly.icon);
    }

    return m('form.block', {
      id: 'pad-form',
      onsubmit: c.submit
    }, [
      m('fieldset.block-group', [
        m('legend', conf.LANG.GROUP.PAD.PAD),
        m('div', fields)
      ]),
      m('input.block.send', {
        form: 'pad-form',
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
      m('h2.block',
        c.addView() ? conf.LANG.GROUP.PAD.ADD : conf.LANG.GROUP.PAD.EDIT),
      view.form(c)
    ]);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(conf.LANG.GROUP.ADD_HELP))
    ]);
  };

  pf.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return pf;
}).call(this);
