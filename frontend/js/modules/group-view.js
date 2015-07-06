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
  var auth = require('../auth.js');
  var layout = require('./layout.js');
  var model = require('../model/group.js');
  var padMark = require('./pad-mark.js');
  var padShare = require('./pad-share.js');

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
        m('dt.block', conf.LANG.GROUP.PAD.PADS),
        m('dd.block', ld.size(c.group.pads)),
        m('dt.block', conf.LANG.GROUP.PAD.ADMINS),
        m('dd.block', ld.size(c.group.admins)),
        m('dt.block', conf.LANG.GROUP.PAD.USERS),
        m('dd.block', ld.size(c.group.users)),
        m('dt.block', conf.LANG.GROUP.PAD.VISIBILITY),
        m('dd.block', c.group.visibility),
        m('dt.block', conf.LANG.GROUP.FIELD.READONLY),
        m('dd.block', c.group.readonly),
        m('dt.block', conf.LANG.GROUP.TAGS.TITLE),
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
    var GROUP = conf.LANG.GROUP;
    var isAdmin = ld.includes(c.group.admins, auth.userInfo()._id);
    var addView = m('p', [
      m('a.add', { href: route + '/pad/add', config: m.route }, [
        m('i.icon-plus-squared'),
        conf.LANG.GROUP.PAD.ADD
      ])
    ]);
    var moveView = m('p', [
      m('a.move', { href: route + '/pad/move', config: m.route }, [
        m('i.icon-forward'),
        conf.LANG.GROUP.PAD.MOVE
      ])
    ]);
    var padView = (function () {
      if (ld.size(c.group.pads) === 0) {
        return m('p', conf.LANG.GROUP.PAD.NONE);
      } else {
        return m('ul', ld.map(c.pads, function (p) {
          var isBookmarked = ld.includes(c.bookmarks, p._id);
          var actions = [
            m('button', {
              title: (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK),
              onclick: function () { padMark(p._id); }
            }, [
              m('i',
                { class: 'icon-star' + (isBookmarked ? '' : '-empty') })
              ]),
              (function () {
                if (c.group.visibility !== 'restricted') {
                  return m('button', {
                    title: conf.LANG.GROUP.SHARE,
                    onclick: padShare.bind(c, c.group._id, p._id)
                  }, [ m('i.icon-link') ]);
                }
              })(),
              m('a', {
                href: route + '/pad/view/' + p._id,
                config: m.route,
                title: conf.LANG.GROUP.VIEW
              }, [ m('i.icon-book-open') ])
          ];
          if (isAdmin) {
            actions.push(
              m('a', {
                href: route + '/pad/edit/' + p._id,
                config: m.route,
                title: conf.LANG.GROUP.EDIT
              }, [ m('i.icon-pencil') ]),
              m('a', {
                href: route + '/pad/remove/' + p._id,
                config: m.route,
                title: conf.LANG.GROUP.REMOVE
              }, [ m('i.icon-trash') ])
            );
          }
          return m('li.block-group', [
            m('span.block.name', [
              m('a', {
                href: route + '/pad/view/' + p._id,
                config: m.route,
                title: conf.LANG.GROUP.VIEW
              }, p.name)
              ]),
            m('span.block.actions', actions)
          ]);
        }));
      }
    })();
    var padBlocks;
    if (isAdmin) {
      padBlocks = [addView, moveView];
    } else {
      padBlocks = [];
    }
    padBlocks.push(padView);
    return m('section.pad', padBlocks);
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
        return m('p', conf.LANG.GROUP.PAD.USERS_NONE);
      } else {
        return m('ul', ld.map(users, function (u) {
          return m('li', userView(u));
        }));
      }
    };
    var route = '/mypads/group/' + c.group._id;
    var sectionElements = [ m('h4.block', conf.LANG.GROUP.PAD.ADMINS) ];
    var isAdmin = ld.includes(c.group.admins, auth.userInfo()._id);
    if (isAdmin) {
      sectionElements.push(
        m('a.add', { href: route + '/user/share', config: m.route },
          [ m('i.icon-plus-squared'), conf.LANG.GROUP.SHARE_ADMIN ]));
    }
    sectionElements.push(list(c.admins));
    sectionElements.push(m('h4.block', conf.LANG.GROUP.PAD.USERS));
    if (isAdmin && (c.group.visibility === 'restricted')) {
        sectionElements.push(
          m('a.add', { href: route + '/user/invite', config: m.route },
            [ m('i.icon-plus-squared'), conf.LANG.GROUP.INVITE_USER.IU ]));
    }
    sectionElements.push(list(c.users));
    return m('section', sectionElements);
  };

  /**
  * ### main
  *
  * `main` view, composed by properties, pads and users.
  */

  view.main = function (c) {
    return m('section', { class: 'block-group group' }, [
      m('h2.block', [
        m('span', conf.LANG.GROUP.GROUP + ' ' + c.group.name),
        m('a', {
          href: '/mypads/group/' + c.group._id + '/edit',
          config: m.route,
          title: conf.LANG.GROUP.EDIT
        }, [ m('i.icon-pencil'), m('span', conf.LANG.GROUP.EDIT) ]),
        m('a', {
          href: '/mypads/group/' + c.group._id + '/remove',
          config: m.route,
          title: conf.LANG.GROUP.REMOVE
        }, [ m('i.icon-trash'), m('span', conf.LANG.GROUP.REMOVE) ])
      ]),
      m('section.block.props', [
        m('h3.title', conf.LANG.GROUP.PROPERTIES),
        view.properties(c)
      ]),
      m('section.block.pads', [
        m('h3.title', conf.LANG.GROUP.PAD.PADS),
        view.pads(c)
      ]),
      m('section.block.users', [
        m('h3.title',
          conf.LANG.GROUP.PAD.ADMINS + ' & ' + conf.LANG.GROUP.PAD.USERS),
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
      m('article', m.trust(conf.LANG.GROUP.VIEW_HELP))
    ]);
  };

  group.view = function (c) {
    return layout.view(view.main(c), view.aside(c)); 
  };

  return group;
}).call(this);
