/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
  var ready = require('../helpers/ready.js');
  var sortingPreferences = require('../helpers/sortingPreferences.js');
  var filterPads = require('../helpers/filterPads.js');
  var groupMark = require('./group-mark.js');

  var u = auth.userInfo;
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
      group: { visibility: '', tags: [] },
      privatePassword: m.prop(''),
      sendPass: m.prop(false)
    };
    if (auth.isAuthenticated()) {
      c.bookmarks = auth.userInfo().bookmarks.pads;
    }
    c.isGuest = !auth.isAuthenticated();

    var init = function (err) {
      if (err) { return m.route('/mypads'); }
      var _init = function (err) {
        if (err) { return m.route('/mypads'); }
        var data = c.isGuest ? model.tmp() : model;
        c.group = data.groups()[key];
        if (!c.isGuest) {
          c.isAdmin = ld.includes(c.group.admins, auth.userInfo()._id);
          c.isUser  = ld.includes(c.group.users,  auth.userInfo()._id);
          var pads = model.pads();
          var users = model.users();
          c.pads = ld.sortBy(ld.map(c.group.pads, function (x) {
              return pads[x];
            }), sortingPreferences.padByField());
          c.users = ld.map(c.group.users, function (x) { return users[x]; });
          c.admins = ld.map(c.group.admins, function (x) { return users[x]; });
        } else {
          c.isAdmin = false;
          c.isUser  = false;
          c.pads = ld.sortBy(ld.compact(ld.map(c.group.pads, function (x) {
            return data.pads()[x];
          })), sortingPreferences.padByField());
        }
        if (!sortingPreferences.padAsc()) {
          c.pads.reverse();
        }
        document.title = conf.LANG.GROUP.GROUP + ' ' + c.group.name +
          ' - ' + conf.SERVER.title;
      };
      if (model.groups()[key]) {
        _init();
      } else {
        c.isGuest = true;
        model.fetchObject({ group: key }, undefined, _init);
      }
    };

    var fetchFn = (function () {
      if (auth.isAuthenticated()) {
        return ld.partial(model.fetch, init);
      } else {
        return ld.partial(model.fetchObject, { group: key }, undefined, init);
      }
    })();
    if (ld.isEmpty(model.groups())) { fetchFn(); } else { init(); }

    /**
    * ### sortBy
    *
    * `c.sortBy` function sort pads by the `field` argument.
    * If already sorted by the same field, it reverses order.
    */

    c.sortField = m.prop(sortingPreferences.padByField());
    c.sortAsc = m.prop(sortingPreferences.padAsc());
    c.sortBy = function (field, asc) {
      if (c.sortField() === field && typeof(asc) !== 'boolean') {
        c.sortAsc(!c.sortAsc());
      }
      c.sortField(field);
      var direction = c.sortAsc() ? 'asc' : 'desc';
      c.pads = ld.sortByOrder(c.pads, field, direction);
      sortingPreferences.updateValues({
        padByField: c.sortField(),
        padAsc: c.sortAsc()
      });
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
          data: {
            gid: c.group._id,
            auth_token: auth.token()
          }
        }).then(function (resp) {
          var data = model.groups();
          delete data[resp.value._id];
          model.groups(data);
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
      model.fetchObject({ group: key }, c.privatePassword(), function (err) {
        if (err) { return c.sendPass(false); }
        var data = c.isGuest ? model.tmp() : model;
        c.group = data.groups()[key];
        c.pads = ld.sortBy(ld.compact(ld.map(c.group.pads,
          function (x) { return data.pads()[x]; })), sortingPreferences.padByField());
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
    return m('table.table.table-stripped.table-bordered', [
      m('thead',
        m('tr', [
          m('th', {scope: 'col'}, conf.LANG.GROUP.PAD.PADS),
          m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.VISIBILITY},
            m('i.glyphicon.glyphicon-eye-open',
              m('span.sr-only', conf.LANG.GROUP.PAD.VISIBILITY)
            )
          ),
          m('th', {scope: 'col'}, conf.LANG.GROUP.FIELD.READONLY),
          m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.ADMINS},
            m('i.glyphicon.glyphicon-knight',
              m('span.sr-only', conf.LANG.GROUP.PAD.ADMINS)
            )
          ),
          m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.USERS},
            m('i.glyphicon.glyphicon-user',
              m('span.sr-only', conf.LANG.GROUP.PAD.USERS)
            )
          ),
          m('th', {scope: 'col'}, conf.LANG.GROUP.TAGS.TITLE),
        ])
      ),
      m('tbody',
        m('tr.text-center', [
          m('td', ld.size(c.group.pads)),
          m('td', conf.LANG.GROUP.FIELD[c.group.visibility.toUpperCase()]),
          m('td', conf.LANG.GLOBAL[c.group.readonly ? 'YES' : 'NO']),
          m('td', ld.size(c.group.admins)),
          m('td', ld.size(c.group.users)),
          m('td', m('ul.list-inline', ld.map(c.group.tags, function (t) {
                    return m('li.label.label-default', t);
          })))
        ])
      )
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
    var addView = m('p.col-sm-4.text-center', [
      m('a.btn.btn-default', { href: route + '/pad/add', config: m.route }, [
        m('i.glyphicon.glyphicon-plus.text-success'),
        ' '+conf.LANG.GROUP.PAD.ADD
      ])
    ]);
    var moveView = m('p.text-center', [
      m('a.btn.btn-default', { href: route + '/pad/move', config: m.route }, [
        m('i.glyphicon.glyphicon-transfer'),
        ' '+conf.LANG.GROUP.PAD.MOVE
      ])
    ]);
    var filterView = m('p.col-sm-4.text-center.form-inline', [
      m('.form-group', [
        m('label', {
          for: 'pad-filter-form'
        }, conf.LANG.GROUP.SEARCH.TITLE+' '),
        m('input.form-control', {
          id: 'pad-filter-form',
          type: 'search',
          placeholder: conf.LANG.GROUP.SEARCH.TYPE,
          oninput: m.withAttr('value', filterPads.filterKeyword)
        }),
      ])
    ]);
    var sortIcon = (function () {
      if (c.sortField()) {
        return (c.sortAsc() ? 'top' : 'bottom');
      } else {
        return 'arrow-combo';
      }
    })();
    var sortView = m('p.col-sm-4.text-right.small', [
      m('span', ' '+conf.LANG.GROUP.PAD.SORT_BY),
      m('button.btn.btn-default.btn-xs', {
        type: 'button',
        onclick: ld.partial(c.sortBy, 'ctime')
      }, [conf.LANG.GROUP.PAD.SORT_BY_CREATION+' ',
        m('i.small.glyphicon glyphicon-triangle-' + sortIcon)]
      ),
      m('button.btn.btn-default.btn-xs', {
        type: 'button',
        onclick: ld.partial(c.sortBy, 'name')
      }, [ conf.LANG.GROUP.PAD.SORT_BY_NAME+' ',
        m('i.small.glyphicon glyphicon-triangle-' + sortIcon)])
    ]);
    var padView = (function () {
      if (ld.size(c.group.pads) === 0) {
        return m('p', conf.LANG.GROUP.PAD.NONE);
      } else {
        return m('ul.list-group.col-sm-12', ld.map(c.pads, function (p) {
          var actions = [
            (function () {
              if ((c.group.visibility !== 'restricted') ||
                (p.visibility && p.visibility !== 'restricted')) {
                return m('button.btn.btn-default.btn-xs', {
                  title: conf.LANG.GROUP.SHARE,
                  onclick: padShare.bind(c, c.group._id, p._id)
                }, [ m('i.glyphicon.glyphicon-link') ]);
              }
            })()
          ];
          if (c.isAdmin) {
            actions.push(
              m('a.btn.btn-default.btn-xs', {
                href: route + '/pad/edit/' + p._id,
                config: m.route,
                title: conf.LANG.MENU.CONFIG
              }, [ m('i.glyphicon.glyphicon-wrench') ]),
              m('a.btn.btn-default.btn-xs', {
                href: route + '/pad/remove/chat/history/' + p._id,
                config: m.route,
                title: conf.LANG.GROUP.REMOVE_CHAT_HISTORY
              }, [ m('i.glyphicon.glyphicon-volume-off') ]),
              m('a.btn.btn-default.btn-xs', {
                href: route + '/pad/remove/' + p._id,
                config: m.route,
                title: conf.LANG.GROUP.REMOVE
              }, [ m('i.glyphicon.glyphicon-trash.text-danger') ])
            );
          }
          var padName = p.name;
          if (p.visibility && (p.visibility !== c.group.visibility)) {
            var visib = conf.LANG.GROUP.FIELD[p.visibility.toUpperCase()];
            padName += ' (' + visib + ')';
          }
          return m('li.list-group-item.group-pad-item', {
              'data-padname': padName
            }, [
            (function () {
              if (!c.isGuest) {
                var isBookmarked = ld.includes(c.bookmarks, p._id);
                return m('button.btn.btn-link.btn-lg', {
                  title: (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK),
                  onclick: function () { padMark(p._id); }
                }, [
                  m('i',
                    { class: 'glyphicon glyphicon-star' +
                      (isBookmarked ? '' : '-empty') })
                ]);
              }
            })(),
            m('span.name', [
              m('a', {
                href: route + '/pad/view/' + p._id,
                config: m.route,
                title: conf.LANG.GROUP.VIEW
              }, padName)
              ]),
            m('span.pull-right', actions)
          ]);
        }));
      }
    })();
    var padBlocks = [];
    if (c.isAdmin) { padBlocks.push(addView);}
    padBlocks.push(filterView, sortView, padView);
    if (c.isAdmin) { padBlocks.push(moveView);}
    return m('section.panel-body', padBlocks);
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
        return m('ul.list-group', ld.map(users, function (u) {
          return m('li.list-group-item', userView(u));
        }));
      }
    };
    var route = '/mypads/group/' + c.group._id;
    var sectionListAdmins = [ m('h4', conf.LANG.GROUP.PAD.ADMINS) ];
    if (c.isAdmin) {
      sectionListAdmins.push(
        m('p.text-center',
          m('a.btn.btn-default',
            { href: route + '/user/share', config: m.route },
            [ m('i.glyphicon.glyphicon-plus.text-success'),
                ' '+conf.LANG.GROUP.SHARE_ADMIN
            ]
          )
        )
      );
    }
    sectionListAdmins.push(list(c.admins));

    var sectionListUsers = [ m('h4', conf.LANG.GROUP.PAD.USERS) ];
    if (c.isAdmin) {
      sectionListUsers.push(
        m('p.text-center',
          m('a.btn.btn-default',
            { href: route + '/user/invite', config: m.route },
            [ m('i.glyphicon.glyphicon-plus.text-success'),
                ' '+conf.LANG.GROUP.INVITE_USER.IU ]
          )
        )
      );
    }
    sectionListUsers.push(list(c.users));
    return m('section.panel-body', [
      m('.col-sm-6',sectionListAdmins),
      m('.col-sm-6',sectionListUsers)
    ]);
  };

  view.passForm = function (c) {
    return [ m('form', {
      id: 'password-form',
      config: ready.inFrame,
      onsubmit: c.submitPass
    }, [
      m('label', { for: 'mypadspassword' }, conf.LANG.USER.PASSWORD),
      m('input', {
        type: 'password',
        required: true,
        placeholder: conf.LANG.USER.UNDEF,
        value: c.privatePassword(),
        oninput: m.withAttr('value', c.privatePassword)
      }),
      m('input.ok', {
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
    var isBookmarked = (auth.isAuthenticated()) ? (ld.includes(u().bookmarks.groups, c.group._id)) : false;
    var h2Elements = [ m('span', [
      m('button.btn.btn-link.btn-lg', {
          onclick: function (e) {
            e.preventDefault();
            groupMark(c.group)
          },
          title: (isBookmarked ? conf.LANG.GROUP.UNMARK : conf.LANG.GROUP.BOOKMARK)
        }, [
          m('i',
            { class: 'glyphicon glyphicon-star' +
              (isBookmarked ? '' : '-empty') })
        ]
      ),
      conf.LANG.GROUP.GROUP + ' ' + c.group.name
    ])];
    var shareBtn = '';
    if (c.group.visibility !== 'restricted') {
      shareBtn = m('button.btn.btn-default', {
        title: conf.LANG.GROUP.SHARE,
        onclick: padShare.bind(c, c.group._id, null)
      },
      [ m('i.glyphicon.glyphicon-link'),
        m('span', ' '+conf.LANG.GROUP.SHARE)
      ]);
    }
    var buttonsArray = [shareBtn];
    if (c.isAdmin) {
      buttonsArray.push(
        m('a.btn.btn-default', {
          href: '/mypads/group/' + c.group._id + '/edit',
          config: m.route,
          title: conf.LANG.MENU.CONFIG
        },
        [ m('i.glyphicon.glyphicon-wrench'),
          m('span', ' '+conf.LANG.MENU.CONFIG)
        ]),
        m('a.btn.btn-danger', {
          href: '/mypads/group/' + c.group._id + '/remove',
          config: m.route,
          title: conf.LANG.GROUP.REMOVE
        },
        [ m('i.glyphicon.glyphicon-trash'),
          m('span', ' '+conf.LANG.GROUP.REMOVE)
        ])
      );
    }
    var canQuit = (c.isAdmin && c.admins.length > 1) || (!c.isAdmin);
    if (!c.isGuest && canQuit) {
      buttonsArray.push(m('button.cancel.btn.btn-warning', { onclick: c.quit },
          [ m('i.glyphicon glyphicon-fire'), ' '+conf.LANG.GROUP.QUIT_GROUP ]));
    }
    h2Elements.push(
      m('.btn-group.pull-right', {role:'group'}, buttonsArray)
    );
    var showPass = (!c.isAdmin && !c.isUser && (c.group.visibility === 'private') &&
      !c.sendPass());
    if (showPass) {
      return m('section', [
        m('h2', h2Elements),
        view.passForm(c)
      ]);
    } else {
      return m('section', [
        m('h2', h2Elements),
        m('section.description', [  ]),
        m('section.panel.panel-primary.props', [
          m('.panel-heading',
            m('h3.panel-title', conf.LANG.GROUP.PROPERTIES)
          ),
          m('.panel-body', c.group.description),
          view.properties(c)
        ]),
        m('section.panel.panel-info.pads', [
          m('.panel-heading',
            m('h3.panel-title', conf.LANG.GROUP.PAD.PADS)
          ),
          view.pads(c)
        ]),
        m('section.panel.panel-warning.users', [
          m('.panel-heading',
            m('h3.panel-title',
              conf.LANG.GROUP.PAD.ADMINS + ' & ' + conf.LANG.GROUP.PAD.USERS
            )
          ),
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
      m('article.well', m.trust(conf.LANG.GROUP.VIEW_HELP))
    ]);
  };

  group.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return group;
}).call(this);
