/**
*  # Group View module
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
*  This module lists all pads linked to the group.
*/

module.exports = (function () {
  'use strict';
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var GROUP = conf.LANG.GROUP;
  var PAD = GROUP.PAD;
  var auth = require('../auth.js');
  var layout = require('./layout.js');
  var model = require('../model/group.js');

  var pad = {};

  /**
  * ## Controller
  */

  pad.controller = function () {
    if (!auth.isAuthenticated()) {
      return m.route('/login');
    }

    var c = {
      isUser: m.prop(true),
      sendPass: m.prop(false),
      password: m.prop('')
    };

    /**
    * ## init function
    *
    * Gathers group and pad values from local cache.
    * Admin should not need password when visibility is private.
    */

    var init = function () {
      var group = m.route.param('group');
      c.group = model.data()[group];
      if (ld.includes(c.group.admins, auth.userInfo()._id)) {
        c.isUser = m.prop(false);
      }
      var key = m.route.param('pad');
      c.pad = model.pads()[key];
    };

    if (ld.isEmpty(model.data())) { model.fetch(init); } else { init(); }

    c.submit = function (e) {
      e.preventDefault();
      c.sendPass = m.prop(true);
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.pad = function (c) {
    var showPass = (c.isUser() &&
      ((c.group.visibility === 'private') && !c.sendPass()));
    if (showPass) {
      return m('form', {
        id: 'password-form',
        onsubmit: c.submit
      }, [
        m('label.block', { for: 'mypadspassword' }, conf.LANG.USER.PASSWORD),
        m('input.block', {
          type: 'password',
          required: true,
          placeholder: conf.LANG.USER.UNDEF,
          value: c.password(),
          oninput: m.withAttr('value', c.password)
        }),
        m('input.ok.block', {
          form: 'password-form',
          type: 'submit',
          value: conf.LANG.USER.OK
        })
      ]);
    } else {
      return m('iframe', {
        src: '/p/' + c.pad._id +
          (c.sendPass() ? '?mypadspassword=' + c.password() : '')
      });
    }

  };

  view.main = function (c) {
    var isBookmarked = ld.includes(c.bookmarks, c.pad._id);
    var route = '/mypads/group/' + c.group._id;
    return m('section', { class: 'block-group group' }, [
      m('h2.block', [
        m('span', PAD.PAD + ' ' + c.pad.name),
        m('a', {
          href: route + '/pad/mark/' + c.pad._id,
          config: m.route,
          title: (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK)
        }, [
          m('i',
            { class: 'icon-star' + (isBookmarked ? '' : '-empty') }),
          m('span', (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK))
        ]),
        (function () {
          if (c.group.visibility !== 'restricted') {
            return m('a', {
              href: route + '/pad/share/' + c.pad._id,
              config: m.route,
              title: GROUP.SHARE
            }, [ m('i.icon-link'), m('span', GROUP.SHARE) ]);
          }
        })(),
        m('a', {
          href: route + '/pad/edit/' + c.pad._id,
          config: m.route,
          title: GROUP.EDIT
        }, [ m('i.icon-pencil'), m('span', GROUP.EDIT) ]),
        m('a', {
          href: route + '/pad/remove/' + c.pad._id,
          config: m.route,
          title: GROUP.REMOVE
        }, [ m('i.icon-trash'), m('span', GROUP.REMOVE) ]),
        m('span.subtitle', [
          '(',
          PAD.FROM_GROUP,
          m('a', {
            href: route + '/view',
            config: m.route,
            title: GROUP.VIEW
          }, c.group.name ),
          ')'
        ])
      ]),
      m('section.block.pad', [ view.pad(c) ])
    ]);
  };

  /**
  * ### aside
  *
  * aside function, here some help and explanation
  */

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(PAD.VIEW_HELP))
    ]);
  };

  pad.view = function (c) {
    return layout.view(view.main(c), view.aside()); 
  };

  return pad;

}).call(this);
