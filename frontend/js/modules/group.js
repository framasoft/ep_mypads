/**
*  # Group List module
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
*  This module is the main one, containing groups.
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

  var group = {};

  /**
  * ## Controller
  *
  * Used for module state and actions.
  */

  group.controller = function () {
    if (!auth.isAuthenticated()) {
      return m.route('/login');
    }
    if (ld.isEmpty(model.data())) { model.fetch(); }
    return {};
  };

  /**
  * ## Views
  *
  */

  var view = {};

  view.search = function () {
    return m('section.search.block-group', [
      m('h3.block', [
        m('span', GROUP.SEARCH.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': GROUP.SEARCH.HELP })
      ]),
      m('input.block', {
        type: 'search',
        placeholder: GROUP.SEARCH.TYPE,
        minlength: 3,
        pattern: '.{3}'
      }),
      m('button.block', { type: 'button' }, conf.LANG.USER.OK)
    ]);
  };

  view.filters = function () {
    return m('section.filter', [
      m('h3', [
        m('span', GROUP.FILTERS.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': GROUP.FILTERS.HELP })
      ]),
      m('ul', [
        m('li', [ m('button.admin', GROUP.FILTERS.ADMIN) ]),
        m('li', [ m('button.user', GROUP.FILTERS.USER) ])
      ])
    ]);
  };

  view.tags = function () {
    return m('section.tag', [
      m('h3', [
        m('span', GROUP.TAGS.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': GROUP.TAGS.HELP })
      ]),
      m('ul', ld.map(model.tags(), function (t) {
        return m('li', [ m('button', t) ]);
      }))
    ]);
  };

  view.aside = function (c) {
    return m('section.group-aside', [
      view.search(c), view.filters(c), view.tags(c)
    ]);
  };

  view.group = function (c, g) {
    return m('li.block', [
      m('header.group.block-group', [
        m('h4.block', g.name),
        m('section.block', [
          m('a', {
            href: '/mypads/group/view',
            config: m.route,
            title: GROUP.VIEW
          }, [ m('i.icon-book-open') ]),
          m('a', {
            href: '/mypads/group/edit/' + g._id,
            config: m.route,
            title: GROUP.EDIT
          }, [ m('i.icon-pencil') ]),
          m('a', {
            href: '/mypads/group/remove/' + g._id,
            config: m.route,
            title: GROUP.REMOVE
          }, [ m('i.icon-trash') ])
        ])
      ]),
      m('dl.block-group.group', [
        m('dt.block', GROUP.PAD.ADMINS),
        m('dd.block', 'xx, yy'),
        m('dt.block', GROUP.PAD.VISIBILITY),
        m('dd.block', g.visibility),
        m('dt.block', GROUP.PAD.PADS),
        m('dd.block', ld.size(g.pads))
      ]),
      m('footer.group.block-group', [
        m('button.block', GROUP.BOOKMARK),
        m('ul.block', ld.map(g.tags, function (t) { return m('li', t); }))
      ])
    ]);
  };

  view.groups = function (c) {
    var _groups = ld(model.data()).values().sortBy('name').value();
    return m('ul.group', ld.map(_groups, ld.partial(view.group, c)));
  };

  view.bookmarked = function (c) {
    var sample = {
      _id: 'xxx',
      name: 'Sample',
      visibility: 'restricted',
      pads: [1, 2, 3] 
    };
    return m('ul.group', [
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
      view.group(c, sample),
    ]);
  };

  view.archived = view.bookmarked;

  view.main = function (c) {
    return m('section', { class: 'block-group group' }, [
      m('h2.block', [
        m('span', GROUP.MYGROUPS),
        m('a', {
          href: '/mypads/group/add',
          config: m.route
        }, [
          m('i.icon-plus-squared'),
          m('span', GROUP.ADD)
        ])
      ]),
      m('section.block', [
        m('h3.title.bookmark', GROUP.BOOKMARKED),
        view.bookmarked(c)
      ]),
      m('section.block', [
        m('h3.title.group', GROUP.GROUPS),
        view.groups(c)
      ]),
      m('section.block', [
        m('h3.title.archive', GROUP.ARCHIVED),
        view.archived(c)
      ])
    ]);
  };

  group.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return group;
}).call(this);
