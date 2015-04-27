/**
*  # Pads module
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
  // Global dependencies
  var m = require('mithril');
  // Local dependencies
  var conf = require('../configuration.js');
  var PADS = conf.LANG.PADS;
  var auth = require('../auth.js');
  var notif = require('./notification.js');
  var layout = require('./layout.js');
  // Style dependencies
  var padsStyle = require('../../style/modules/pads.js');
  var stylesDetach = require('../../style/utils.js').fn.detach;

  var pads = {};

  /**
  * ## Controller
  *
  * Used for module state and actions.
  *
  */

  pads.controller = function () {
    if (!auth.isAuthenticated()) { return m.route('/login'); }
    padsStyle.attach();
    var c = {};
    c.classes = { pads: padsStyle.sheet.main.classes };
    c.onunload = stylesDetach.bind(null, padsStyle.sheet);
    return c;
  };

  /**
  * ## Views
  *
  */

  var view = {};

  view.search = function (c) {
    return m('section', [
      m('h3', PADS.SEARCH.TITLE),
      m('input', {
        type: 'search',
        placeholder: PADS.SEARCH.TYPE,
        minlength: 3,
        pattern: '.{3}'
      }),
      m('button', { type: 'button' }, conf.LANG.USER.OK)
    ]);
  };

  view.filters = function (c) {
    return (m('section'), [
      m('h3', PADS.FILTERS.TITLE),
      m('ul', [
        m('li', PADS.FILTERS.ADMIN),
        m('li', PADS.FILTERS.USER)
      ])
    ]);
  };

  view.tags = function (c) {
    return m('section', [
      m('h3', PADS.TAGS.TITLE),
      m('ul', [
        m('li', 'tag1'),
        m('li', 'tag2')
      ])
    ]);
  };

  view.aside = function (c) {
    return m('section', { class: c.classes.sectionAside }, [
      view.search(c), view.filters(c), view.tags(c)
    ]);
  };

  view.group = function (c) {
    return m('li', [
      m('header', [
        m('a', { href: '/mypads/group/view', config: m.route }, PADS.GROUP.VIEW),
        m('a', { href: '/mypads/group/edit', config: m.route }, PADS.GROUP.EDIT),
        m('a', { href: '/mypads/group/remove', config: m.route }, PADS.GROUP.REMOVE)
      ]),
      m('dl', [
        m('dt', PADS.PAD.TITLE),
        m('dd', 'Sample'),
        m('dt', PADS.PAD.ADMINS),
        m('dd', 'xx, yy'),
        m('dt', PADS.PAD.VISIBILITY),
        m('dd', 'private'),
        m('dt', PADS.PAD.PADS),
        m('dd', '22')
      ]),
      m('footer', [
        m('button', PADS.GROUP.BOOKMARK),
        m('ul', [
          m('li', 'tag4'),
          m('li', 'tag3')
        ])
      ])
    ]);
  };

  view.groups = function (c) {
    return m('ul', [
      view.group(c),
      view.group(c)
    ]);
  };

  view.bookmarked = view.groups;
  view.archived = view.groups;

  view.main = function (c) {
    return m('section', { class: 'block-group' + c.classes.pads.section }, [
      m('h2', { class: 'block ' + c.classes.pads.h2 }, [
        m('span', PADS.MYGROUPS),
        m('a', {
          class: c.classes.pads.a,
          href: '/mypads/add',
          config: m.route
        }, PADS.GROUP.ADD)
      ]),
      m('section', [
        m('h3', PADS.BOOKMARKED),
        view.bookmarked(c)
      ]),
      m('section', [
        m('h3', PADS.GROUPS),
        view.groups(c)
      ]),
      m('section', [
        m('h3', PADS.ARCHIVED),
        view.archived(c)
      ])
    ]);
  };

  pads.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return pads;
}).call(this);
