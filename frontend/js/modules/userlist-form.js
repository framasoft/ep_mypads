/**
*  # Userlist form module
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
*  This module handles userlist creation and update.
*/

module.exports = (function () {
  'use strict';
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var layout = require('./layout.js');
  var notif = require('../widgets/notification.js');
  var tag = require('../widgets/tag.js');
  var form = require('../helpers/form.js');
  var model = require('../model/group.js');

  var ulistform = {};

  /**
  * ## Controller
  *
  * Used to check authentication, initialize data for tag like widget with
  * known users.
  */

  ulistform.controller = function () {

    if (!auth.isAuthenticated()) { return m.route('/login'); }

    var c = {};
    c.addView = m.prop(m.route() === '/myuserlists/add');

    c.fields = ['name'];
    form.initFields(c, c.fields);

    /**
    * ### init
    *
    * init function initializes controller data, loads existing elements for
    * edit mode or only set up tags widget controller
    */

    var init = function () {
      var uInfo = auth.userInfo();
      var current = [];
      if (!c.addView()) {
        c.key = m.route.param('key');
        c.userlist = uInfo.userlists[c.key];
        current = ld.pluck(c.userlist.users, 'login');
        c.data.name(c.userlist.name);
      }
      var tags = ld.reduce(uInfo.userlists, function (memo, ul) {
        ld.each(ul.users, function (user) {
          if (!ld.includes(memo, user.login)) {
            memo.push(user.login);
            memo.push(user.email);
          }
        });
        return memo;
      }, []);
      c.tag = new tag.controller({
        name: 'users',
        label: conf.LANG.GROUP.INVITE_USER.USERS_SELECTION,
        current: current,
        placeholder: conf.LANG.GROUP.INVITE_USER.PLACEHOLDER,
        tags: tags
      });
      document.title = (c.addView() ? conf.LANG.USERLIST.ADD :
        conf.LANG.USERLIST.EDIT);
      document.title += ' - ' + conf.SERVER.title;
    };

    if (ld.isEmpty(model.groups())) { model.fetch(init); } else { init(); }

    /**
    * ### submission
    *
    * `submit` function...
    */

    c.submit = function (e) {
      e.preventDefault();
      var opts = {
        method: 'POST',
        url: conf.URLS.USERLIST,
        data: {
          name: c.data.name(),
          loginsOrEmails: c.tag.current,
          auth_token: auth.token()
        }
      };
      var successMsg = conf.LANG.USERLIST.INFO.ADD_SUCCESS;
      if (!c.addView()) {
        opts.method = 'PUT';
        opts.url += '/' + c.key;
        opts.data.ulistid = c.key;
        successMsg = conf.LANG.USERLIST.INFO.EDIT_SUCCESS;
      }
      m.request(opts).then(function (resp) {
        var u = auth.userInfo();
        u.userlists = resp.value;
        auth.userInfo(u);
        notif.success({ body: successMsg });
        var msg;
        if (resp.present.length > 0) {
          msg = conf.LANG.USERLIST.INFO.USER_SUCCESS + resp.present.join(', ');
          notif.success({ body: msg });
        }
        if (resp.absent.length > 0) {
          msg = conf.LANG.USERLIST.INFO.USER_FAILURE + resp.absent.join(', ');
          notif.warning({ body: msg });
        }
        m.route('/myuserlists');
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
  * ### Fields
  *
  * Form fields :
  *
  * - name classic textinput
  * - users tag like widget
  */

  view.field = {};

  view.field.name = function (c) {
    var f = form.field(c, 'name', conf.LANG.USERLIST.FIELD.NAME,
      form.icon(c, 'name', conf.LANG.USERLIST.INFO.NAME,
      conf.LANG.GROUP.ERR.NAME));
      ld.assign(f.input.attrs, {
        placeholder: conf.LANG.USERLIST.INFO.NAME,
        required: true,
        config: form.focusOnInit
      });
    return f;
  };

  view.field.users = function (c) {
    return m('div.block-group.tag', [
      m('label.block', { for: c.name }, c.label),
      tag.views.input(c),
      m('i', {
        class: 'block tooltip icon-info-circled tag',
        'data-msg': conf.LANG.USERLIST.FIELD.USERS_HELP }),
      m('button.block.ok', {
        type: 'button',
        onclick: function () {
          c.add(document.getElementById(c.name + '-input'));
        },
      }, conf.LANG.USER.OK),
      tag.views.datalist(c),
      m('label.block', conf.LANG.GLOBAL.OR),
      m('textarea.block', {
        name: 'usersArea',
        placeholder: conf.LANG.USERLIST.FIELD.USERSAREA_PLACEHOLDER,
      }),
      m('i', {
        class: 'block tooltip icon-info-circled tag',
        'data-msg': conf.LANG.USERLIST.FIELD.USERSAREA_HELP }),
      m('button.block.ok', {
        type: 'button',
        onclick: function () {
          c.addMultiple(document.querySelector('textarea[name=usersArea]'));
        },
      }, conf.LANG.USER.OK),
    ]);
  };

  /**
  * ### Form
  */

  view.form = function (c) {
    var name = view.field.name(c);
    var fields = [name.label, name.input, name.icon];
    return m('form.block', {
      id: 'ulist-form',
      onsubmit: c.submit
    }, [
      m('fieldset.block-group', [
        m('legend', conf.LANG.USERLIST.USERLIST),
        m('div', fields)
      ]),
      m('fieldset.block-group', [
        m('legend', conf.LANG.USERLIST.FIELD.USERS),
        m('div', view.field.users(c.tag))
      ]),
      m('fieldset.block-group', [
        m('legend', conf.LANG.GROUP.INVITE_USER.USERS_SELECTED),
        m('div', tag.views.tagslist(c.tag))
      ]),
      m('input.block.send', {
        form: 'ulist-form',
        type: 'submit',
        value: conf.LANG.ACTIONS.SAVE
      })
    ]);
  };

  /**
  * ### main, aside, global views
  */

  view.main = function (c) {
    return m('section', { class: 'block-group user group-form' }, [
      m('h2.block',
        c.addView() ? conf.LANG.USERLIST.ADD : conf.LANG.USERLIST.EDIT),
      view.form(c)
    ]);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(conf.LANG.USERLIST.FORM_HELP))
    ]);
  };

  ulistform.view = function (c) {
    return layout.view(view.main(c), view.aside(c)); 
  };

  return ulistform;

}).call(this);
