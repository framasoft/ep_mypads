/**
*  # User invitation module
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
*  This module handles group user invitation.
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
  var model = require('../model/group.js');
  var tag = require('../widgets/tag.js');

  var invite = {};

  /**
  * ## Controller
  *
  */

  invite.controller = function () {

    if (!auth.isAuthenticated()) { return m.route('/login'); }

    var c = {};

    var init = function () {
      var group = m.route.param('group');
      c.group = model.data()[group];
      c.users = ld.reduce(ld.merge(model.admins(), model.users()),
        function (memo, val) {
          memo[val.email] = val;
          return memo;
      }, {});
      c.tag = new tag.controller({
        name: 'user-invite',
        label: GROUP.INVITE_USER.USERS_SELECTION,
        current: c.group.users,
        placeholder: GROUP.INVITE_USER.PLACEHOLDER,
        tags: ld.keys(c.users)
      });
    };
    if (ld.isEmpty(model.data())) { model.fetch(init); } else { init(); }

    window.c = c;
    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.userField = function (c) {
    var ipt = tag.views.input(c);
    ipt.attrs.type = 'email';
    return m('div.block-group.tag', [
      m('label.block', { for: c.name }, c.label),
      ipt,
      m('i', {
        class: 'block tooltip icon-info-circled tag',
        'data-msg': GROUP.INVITE_USER.INPUT_HELP }),
      m('button.block.ok', {
        type: 'button',
        onclick: function () {
          c.add(document.getElementById(c.name + '-input'));
        },
      }, conf.LANG.USER.OK),
      tag.views.datalist(c)
    ]);
  };

  view.form = function (c) {
    return m('form.block', {
      id: 'group-form',
      onsubmit: c.submit
    }, [
      m('fieldset.block-group', [
        m('legend', GROUP.INVITE_USER.IU),
        m('div', view.userField(c.tag))
      ]),
      m('fieldset.block-group', [
        m('legend', GROUP.INVITE_USER.USERS_SELECTED),
        m('div', tag.views.tagslist(c.tag))
      ]),
      m('input.block.send', {
        form: 'group-form',
        type: 'submit',
        value: conf.LANG.ACTIONS.SAVE
      })
    ]);
  };

  view.main = function (c) {
    return m('section', { class: 'block-group user group-form' }, [
      m('h2.block', GROUP.GROUP + ' ' + c.group.name),
      view.form(c)
    ]);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(GROUP.INVITE_USER.HELP))
    ]);
  };

  invite.view = function (c) {
    return layout.view(view.main(c), view.aside(c)); 
  };

  return invite;
}).call(this);
