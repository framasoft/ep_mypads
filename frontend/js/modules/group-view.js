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
  var auth = require('../auth.js');
  var layout = require('./layout.js');
  var model = require('../model/group.js');

  var group = {};

  /**
  * ## Controller
  *
  * Used for group, pads and users data.
  * Ensures that models are already loaded, either load them.
  */

  group.controller = function () {
    if (!auth.isAuthenticated()) {
      return m.route('/login');
    }

    var c = {};
    c.bookmarks = auth.userInfo().bookmarks.pads;

    var init = function () {
      var key = m.route.param('key');
      c.group = model.data()[key];
      ld.forEach(['pads', 'admins', 'users'], function (f) {
        c[f] = ld.map(c.group[f], function (x) { return model[f]()[x]; });
      });
    };

    if (ld.isEmpty(model.data())) { model.fetch(init); } else { init(); }

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  /*
  * ### group view
  *
  * `properties` section for displaying chodsen options of the group
  */

  view.properties = function (c) {
    return m('section', [
      m('dl.block-group.group', [
        m('dt.block', GROUP.PAD.PADS),
        m('dd.block', ld.size(c.group.pads)),
        m('dt.block', GROUP.PAD.ADMINS),
        m('dd.block', ld.size(c.group.admins)),
        m('dt.block', GROUP.PAD.USERS),
        m('dd.block', ld.size(c.group.users)),
        m('dt.block', GROUP.PAD.VISIBILITY),
        m('dd.block', c.group.visibility),
        m('dt.block', GROUP.FIELD.READONLY),
        m('dd.block', c.group.readonly),
        m('dt.block', GROUP.TAGS.TITLE),
        m('dd.block', c.group.tags.join(', '))
      ])
    ]);
  };

  /**
  * ### pads
  *
  * View for all linked `pads`, name and actions.
  */

  view.pads = function (c) {
    var route = '/mypads/group/' + c.group._id;
    return m('section.pad', [
      m('a.add', { href: route + '/pad/add', config: m.route }, [
        m('i.icon-plus-squared'),
        GROUP.PAD.ADD
      ]),
      (function () {
        if (ld.size(c.group.pads) === 0) {
          return m('p', GROUP.PAD.NONE);
        } else {
          return m('ul', ld.map(c.pads, function (p) {
            var isBookmarked = ld.includes(c.bookmarks, p._id);
            return m('li.block-group', [
              m('span.block.name', [
                m('a', {
                  href: route + '/pad/view/' + p._id,
                  config: m.route,
                  title: GROUP.VIEW
                }, p.name)
              ]),
              m('span.block.actions', [
                m('a', {
                  href: route + '/pad/mark/' + p._id,
                  config: m.route,
                  title: (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK)
                }, [
                  m('i',
                    { class: 'icon-star' + (isBookmarked ? '' : '-empty') })
                ]),
                m('a', {
                  href: route + '/pad/view/' + p._id,
                  config: m.route,
                  title: GROUP.VIEW
                }, [ m('i.icon-book-open') ]),
                m('a', {
                  href: route + '/pad/edit/' + p._id,
                  config: m.route,
                  title: GROUP.EDIT
                }, [ m('i.icon-pencil') ]),
                (function () {
                  if (c.group.visibility !== 'restricted') {
                    return m('a', {
                      href: route + '/pad/share/' + p._id,
                      config: m.route,
                      title: GROUP.SHARE
                    }, [ m('i.icon-share') ]);
                  }
                })(),
                m('a', {
                  href: route + '/pad/remove/' + p._id,
                  config: m.route,
                  title: GROUP.REMOVE
                }, [ m('i.icon-trash') ]),
              ])
            ]); 
          }));
        }
      })()
    ]);
  };

  /**
  * ### users
  *
  * View for all `users` and admins, displayed with some information and quick
  * actions. `users` block is shown only if group has `visibility` *restricted*.
  */

  view.users = function (c) {
    var userView = function (u) {
      var res = '';
      if (u.firstname) {
        res += (u.firstname + ' ' + u.lastname + ' ');
      } else {
        res += u.login;
      }
      return res + ' : ' + u.email;

    };
    var list = function (users) {
      if (ld.size(users) === 0) {
        return m('p', GROUP.PAD.USERS_NONE);
      } else {
        return m('ul', ld.map(users, function (u) {
          return m('li', userView(u));
        }));
      }
    };
    var route = '/mypads/group/' + c.group._id;
    var sectionElements = [
      m('h4.block', GROUP.PAD.ADMINS),
      m('a.add', { href: route + '/user/share', config: m.route },
        [ m('i.icon-plus-squared'), GROUP.SHARE_ADMIN ]),
      list(c.admins) 
    ];
    if (c.group.visibility === 'restricted') {
      sectionElements.push(m('h4.block', GROUP.PAD.USERS),
        m('a.add', { href: route + '/user/invite', config: m.route },
          [ m('i.icon-plus-squared'), GROUP.INVITE_USER.IU ]),
        list(c.users));
    }
    return m('section', sectionElements);
  };

  /**
  * ### main
  *
  * `main` view, composed by properties, pads and users.
  */

  view.main = function (c) {
    return m('section', { class: 'block-group group' }, [
      m('h2.block', GROUP.GROUP + ' ' + c.group.name),
      m('section.block.props', [
        m('h3.title', GROUP.PROPERTIES),
        view.properties(c)
      ]),
      m('section.block.pads', [
        m('h3.title', GROUP.PAD.PADS),
        view.pads(c)
      ]),
      m('section.block.users', [
        m('h3.title', GROUP.PAD.ADMINS + ' & ' + GROUP.PAD.USERS),
        view.users(c)
      ])
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
      m('article', m.trust(GROUP.VIEW_HELP))
    ]);
  };

  group.view = function (c) {
    return layout.view(view.main(c), view.aside(c)); 
  };

  return group;
}).call(this);
