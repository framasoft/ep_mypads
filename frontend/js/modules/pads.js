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
  var layout = require('./layout.js');

  var pads = {};

  /**
  * ## Controller
  *
  * Used for module state and actions.
  *
  */

  pads.controller = function () {
    if (!auth.isAuthenticated()) {
      return m.route('/login');
    }
  };

  /**
  * ## Views
  *
  */

  var view = {};

  view.search = function (c) {
    return m('section.search.block-group', [
      m('h3.block', [
        m('span', PADS.SEARCH.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': PADS.SEARCH.HELP })
      ]),
      m('input.block', {
        type: 'search',
        placeholder: PADS.SEARCH.TYPE,
        minlength: 3,
        pattern: '.{3}'
      }),
      m('button.block', { type: 'button' }, conf.LANG.USER.OK)
    ]);
  };

  view.filters = function (c) {
    return m('section.filter', [
      m('h3', [
        m('span', PADS.FILTERS.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': PADS.FILTERS.HELP })
      ]),
      m('ul', [
        m('li', [ m('button.admin', PADS.FILTERS.ADMIN) ]),
        m('li', [ m('button.user', PADS.FILTERS.USER) ])
      ])
    ]);
  };

  view.tags = function (c) {
    return m('section.tag', [
      m('h3', [
        m('span', PADS.TAGS.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': PADS.TAGS.HELP })
      ]),
      m('ul', [
        m('li', [ m('button', 'tag1') ]),
        m('li', [ m('button', 'tag2') ])
      ])
    ]);
  };

  view.aside = function (c) {
    return m('section.pads-aside', [
      view.search(c), view.filters(c), view.tags(c)
    ]);
  };

  view.group = function (c) {
    return m('li.block', [
      m('header.pads-group.block-group', [
        m('h4.block', 'SampleName'),
        m('section.block', [
          m('a', {
            href: '/mypads/group/view',
            config: m.route,
            title: PADS.GROUP.VIEW
          }, [ m('i.icon-book-open') ]),
          m('a', {
            href: '/mypads/group/edit',
            config: m.route,
            title: PADS.GROUP.EDIT
          }, [ m('i.icon-pencil') ]),
          m('a', {
            href: '/mypads/group/remove',
            config: m.route,
            title: PADS.GROUP.REMOVE
          }, [ m('i.icon-trash') ])
        ])
      ]),
      m('dl.block-group.pads-group', [
        m('dt.block', PADS.PAD.ADMINS),
        m('dd.block', 'xx, yy'),
        m('dt.block', PADS.PAD.VISIBILITY),
        m('dd.block', 'private'),
        m('dt.block', PADS.PAD.PADS),
        m('dd.block', '22')
      ]),
      m('footer.pads-group.block-group', [
        m('button.block', PADS.GROUP.BOOKMARK),
        m('ul.block', [
          m('li', 'tag4'),
          m('li', 'tag3')
        ])
      ])
    ]);
  };

  view.groups = function (c) {
    return m('ul.pads-group', [
      view.group(c),
      view.group(c),
      view.group(c),
      view.group(c),
      view.group(c),
      view.group(c)
    ]);
  };

  view.bookmarked = view.groups;
  view.archived = view.groups;

  view.main = function (c) {
    return m('section', { class: 'block-group pads' }, [
      m('h2.block', [
        m('span', PADS.MYGROUPS),
        m('a', {
          href: '/mypads/add',
          config: m.route
        }, [
          m('i.icon-plus-squared'),
          m('span', PADS.GROUP.ADD)
        ])
      ]),
      m('section.block', [
        m('h3.title.bookmark', PADS.BOOKMARKED),
        view.bookmarked(c)
      ]),
      m('section.block', [
        m('h3.title.group', PADS.GROUPS),
        view.groups(c)
      ]),
      m('section.block', [
        m('h3.title.archive', PADS.ARCHIVED),
        view.archived(c)
      ])
    ]);
  };

  pads.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return pads;
}).call(this);
