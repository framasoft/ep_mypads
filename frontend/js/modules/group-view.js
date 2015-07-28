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
  var notif = require('../widgets/notification.js');
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
  * Taking care of public group case.
  */

  group.controller = function () {

    var key = m.route.param('key');
    var c = {
      group: { tags: [] },
      privatePassword: m.prop(undefined),
      sendPass: m.prop(false)
    };
    if (auth.isAuthenticated()) {
      c.bookmarks = auth.userInfo().bookmarks.pads;
    }

    var init = function (err) {
      if (err) { return m.route('/mypads'); }
      c.isGuest = (!auth.isAuthenticated() || !model.data()[key]);
      var _init = function () {
        c.group = model.data()[key];
        if (!c.isGuest) {
          c.isAdmin = ld.includes(c.group.admins, auth.userInfo()._id);
          ld.forEach(['pads', 'admins', 'users'], function (f) {
            c[f] = ld.map(c.group[f], function (x) { return model[f]()[x]; });
          });
        } else {
          c.isAdmin = false;
          c.pads = ld.map(c.group.pads, function (x) {
            return model.pads()[x];
          });
        }
      };
      if (model.data()[key]) {
        _init();
      } else {
        model.fetchGroup(key, undefined, _init);
      }
    };

    var fetchFn = (function () {
      if (auth.isAuthenticated()) {
        return ld.partial(model.fetch, init);
      } else {
        return ld.partial(model.fetchGroup, key, undefined, init);
      }
    })();
    if (ld.isEmpty(model.data())) { fetchFn(); } else { init(); }

    /**
    * ### sortBy
    *
    * `c.sortBy` function sort pads by the `field` argument.
    * If already sorted by the same field, it reverses order.
    */

    c.sortField = m.prop();
    c.sortAsc = m.prop(true);
    c.sortBy = function (field) {
      if (c.sortField() === field) { c.sortAsc(!c.sortAsc()); }
      c.sortField(field);
      var direction = c.sortAsc() ? 'asc' : 'desc';
      c.pads = ld.sortByOrder(c.pads, field, direction);
    };

    /**
    * ### quit
    * `c.quit` function is used to resign user from administration or usage of
    * a group. It is based on `user-invitation` to proceed.
    */

    c.quit = function () {
      if (window.confirm(conf.LANG.GROUP.INFO.RESIGN)) {
        m.request({
          method: 'POST',
          url: conf.URLS.GROUP + '/resign',
          data: { gid: c.group._id }
        }).then(function (resp) {
          var data = model.data();
          delete data[resp.value._id];
          model.data(data);
          notif.success({ body: conf.LANG.GROUP.INFO.RESIGN_SUCCESS });
          m.route('/mypads/group/list');
        }, function (err) {
          notif.error({ body: ld.result(conf.LANG, err.error) });
        });
      }
    };

    /**
    * ### submitPass
    *
    * This function manages password sending for private group when the user is
    * not an admin of this group.
    */

    c.submitPass = function (e) {
      e.preventDefault();
      model.fetchGroup(key, c.privatePassword(), function (err) {
        if (err) { return c.sendPass(false); }
        c.group = model.data()[key];
        c.sendPass(true);
      });
    };

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
  var sortIcon = (function () {
    if (c.sortField()) {
      return (c.sortAsc() ? 'up-dir' : 'down-dir');
    } else {
      return 'arrow-combo';
    }
  })();
  var sortView = m('p.sort', [
    m('i.icon-' + sortIcon),
    m('span', conf.LANG.GROUP.PAD.SORT_BY),
    m('button', {
      type: 'button',
      onclick: ld.partial(c.sortBy, '_id')
    }, conf.LANG.GROUP.PAD.SORT_BY_CREATION),
    m('button', {
      type: 'button',
      onclick: ld.partial(c.sortBy, 'name')
    }, conf.LANG.GROUP.PAD.SORT_BY_NAME)
  ]);
    var padView = (function () {
      if (ld.size(c.group.pads) === 0) {
        return m('p', conf.LANG.GROUP.PAD.NONE);
      } else {
        return m('ul', ld.map(c.pads, function (p) {
          var actions = [
            (function () {
              if (!c.isGuest) {
                var isBookmarked = ld.includes(c.bookmarks, p._id);
                return m('button', {
                  title: (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK),
                  onclick: function () { padMark(p._id); }
                }, [
                  m('i',
                    { class: 'icon-star' + (isBookmarked ? '' : '-empty') })
                ]);
              }
            })(),
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
          if (c.isAdmin) {
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
    var padBlocks = [];
    if (c.isAdmin) { padBlocks.push(addView, moveView); }
    padBlocks.push(sortView, padView);
    return m('section.pad', padBlocks);
  };

  /**
  * ### users
  *
  * View for all `users` and admins, displayed with some information and quick
  * actions. `users` block is shown only if group has `visibility` *restricted*.
  */

  view.users = function (c) {
    if(c.isGuest) {
      return m('p', conf.LANG.GROUP.PAD.PUBLIC_DENIED);
    }
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
    if (c.isAdmin) {
      sectionElements.push(
        m('a.add', { href: route + '/user/share', config: m.route },
          [ m('i.icon-plus-squared'), conf.LANG.GROUP.SHARE_ADMIN ]));
    }
    sectionElements.push(list(c.admins));
    sectionElements.push(m('h4.block', conf.LANG.GROUP.PAD.USERS));
    if (c.isAdmin && (c.group.visibility === 'restricted')) {
        sectionElements.push(
          m('a.add', { href: route + '/user/invite', config: m.route },
            [ m('i.icon-plus-squared'), conf.LANG.GROUP.INVITE_USER.IU ]));
    }
    sectionElements.push(list(c.users));
    return m('section', sectionElements);
  };

  view.passForm = function (c) {
    return [ m('form', {
      id: 'password-form',
      onsubmit: c.submitPass
    }, [
      m('label.block', { for: 'mypadspassword' }, conf.LANG.USER.PASSWORD),
      m('input.block', {
        type: 'password',
        required: true,
        placeholder: conf.LANG.USER.UNDEF,
        value: c.privatePassword(),
        oninput: m.withAttr('value', c.privatePassword)
      }),
      m('input.ok.block', {
        form: 'password-form',
        type: 'submit',
        value: conf.LANG.USER.OK
      })
    ])];
  };

  /**
  * ### main
  *
  * `main` view, composed by properties, pads and users.
  */

  view.main = function (c) {
    var h2Elements = [ m('span', conf.LANG.GROUP.GROUP + ' ' + c.group.name) ];
    if (c.isAdmin) {
      h2Elements.push(
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
      );
    }
    var canQuit = (c.isAdmin && c.admins.length > 1) || (!c.isAdmin);
    if (!c.isGuest && canQuit) {
      h2Elements.push(m('button.cancel', { onclick: c.quit },
          [ m('i.icon-cancel'), conf.LANG.GROUP.QUIT_GROUP ]));
    }
    var showPass = (!c.isAdmin && (c.group.visibility === 'private') &&
      !c.sendPass());
    if (showPass) {
      return m('section', { class: 'block-group group' }, [
        m('h2.block', h2Elements),
        view.passForm(c)
      ]);
    } else {
      return m('section', { class: 'block-group group' }, [
        m('h2.block', h2Elements),
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
    }
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
