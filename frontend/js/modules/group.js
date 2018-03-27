/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
  var notif = require('../widgets/notification.js');
  var auth = require('../auth.js');
  var u = auth.userInfo;
  var layout = require('./layout.js');
  var model = require('../model/group.js');
  var padShare = require('./pad-share.js');
  var sortingPreferences = require('../helpers/sortingPreferences.js');

  var group = {};

  /**
  * ### mark
  *
  * `mark` public function takes a group object and adds or removes it from the
  * bookmarks of the current user. It also can have a `successFn` function that
  * is called after success.
  */

  group.mark = function (gid, successFn) {
    var user = u();
    var errfn = function (err) {
      return notif.error({ body: ld.result(conf.LANG, err.error) });
    };
    if (ld.includes(user.bookmarks.groups, gid)) {
      ld.pull(user.bookmarks.groups, gid);
    } else {
      user.bookmarks.groups.push(gid);
    }
    m.request({
      url: conf.URLS.USERMARK,
      method: 'POST',
      data: {
        type: 'groups',
        key: gid,
        auth_token: auth.token()
      }
    }).then(function () {
      notif.success({ body: conf.LANG.GROUP.MARK_SUCCESS });
      if (successFn) { successFn(); }
    }, errfn);
  };


  /**
  * ## Controller
  *
  * Used for module state and actions.
  */

  group.controller = function () {
    if (!auth.isAuthenticated()) {
      conf.unauthUrl(true);
      return m.route('/login');
    }
    document.title = conf.LANG.GROUP.MYGROUPS + ' - ' + conf.SERVER.title;
    var c = { groups: {} };

    /**
    * ### filters
    *
    * `filters` is an object of active functions to apply to the current list of
    * groups. Keys are composed with filter names, being able to remove it if
    * necessary.
    */
    c.filters = { admins: false, users: false };

    /**
    * #### filterFn
    *
    * Private `filterFn` is a function taking :
    *
    * - `name` filter for `c.filters` storing
    * - `cond` expression, for toggling purpose
    * - `action` function, value for `c.filters[name]` if `cond` is *true*
    *
    * It fixes filters according to arguments and calls `computeGroups`.
    */

    var filterFn = function (name, cond, action) {
      c.filters[name] = cond ? action : false;
      c.computeGroups();
    };

    /**
    * #### filterToggle
    *
    * `filterToggle` is a function taking a `field` string object, key of
    * `c.filters` for toggling filter, accoding to group `field` (for instance
    * used for admins and users).
    */

    c.filterToggle = function (field) {
      var action = function (g) { return ld.includes(g[field], u()._id); };
      filterFn(field, !c.filters[field], action);
    };

    /**
    * #### filterTag
    *
    * `filterTag` is similar to `filterToggle` but works with several tags, as
    * taken as argument.
    */

    c.filterTag = function (tag) {
      var action = function (g) { return ld.includes(g.tags, tag); };
      filterFn(tag, !c.filters[tag], action);
    };

    /**
    * #### filterVisibility
    *
    * `filterVisibility` is similar to `filterTag` but works exact given
    * `visibility` string and keeps in memory old visibility value because it
    * should only be one selected at the same time.
    */

    c.filterVisibility = function (visibility) {
      if (c.filterVisibVal === visibility) {
        c.filters.visibility = false;
        c.filterVisibVal = false;
      } else {
        c.filterVisibVal = visibility;
        c.filters.visibility = function (g) {
          return (g.visibility === visibility);
        };
      }
      c.computeGroups();
    };

    /*
    * #### filterSearch
    *
    * `filterSearch` function checks group *name* and *tags* field with
    * full-text search pattern `c.search` but only if `c.search` has 3
    * characters or more.
    */

    c.search = m.prop('');
    c.filterSearch = function () {
      if (c.search().length > 2) {
        c.filters.search = function (g) {
          var re = new RegExp(c.search(), 'gi');
          if (g.name.match(re)) { return true; }
          return g.tags.toString().match(re);
        };
      } else {
        c.filters.search = false;
      }
      c.computeGroups();
    };

    /**
    * ### sortBy
    *
    * `c.sortBy` function sort pads by the `field` argument.
    * If already sorted by the same field, it reverses order.
    */

    window.c = c;
    c.sortField = m.prop(sortingPreferences.groupByField());
    c.sortAsc = m.prop(sortingPreferences.groupAsc());
    c.sortBy = function (field) {
      if (c.sortField() === field) { c.sortAsc(!c.sortAsc()); }
      c.sortField(field);
      var direction = c.sortAsc() ? 'asc' : 'desc';
      c.groups = ld.transform(c.groups, function (memo, groups, type) {
        memo[type] = ld.sortByOrder(groups, field, direction);
      });
      sortingPreferences.updateValues({
        groupByField: c.sortField(),
        groupAsc: c.sortAsc()
      });
    };

    /**
    * ### computeGroups
    *
    * `computeGroups` is an internal function that computed groups according to
    * list view needs. It :
    *
    * - filters according to `c.filters`
    * - takes model.groups() and creates a new object with separate bookmared,
    *   archived and normal groups
    * - sets `c.groups` for usage in view.
    */

    c.computeGroups = function () {
      c.groups = ld(model.groups()).values().sortBy(c.sortField()).value();
      if (!c.sortAsc()) {
        c.groups.reverse();
      }
      var userGroups = u().bookmarks.groups;
      c.groups = ld.reduce(c.groups, function (memo, g) {
        for (var k in c.filters) {
          if (c.filters[k]) {
            if (!c.filters[k](g)) { return memo; }
          }
        }
        if (ld.includes(userGroups, g._id)) {
          memo.bookmarked.push(g);
        } else if (g.readonly) {
          memo.archived.push(g);
        } else {
          memo.normal.push(g);
        }
        return memo;
      }, { bookmarked: [], archived: [], normal: [] });
    };

    // Bootstrapping
    if (ld.isEmpty(model.groups())) {
      model.fetch(c.computeGroups);
    } else {
      c.computeGroups();
    }

    return c;
  };

  /**
  * ## Views
  *
  */

  var view = {};

  view.sort = function (c) {
    var btn = function (field, txt) {
      return m('button.btn.btn-default.btn-xs', {
        class: (c.sortField() === field) ? ' btn-info': '',
        onclick: ld.partial(c.sortBy, field)
      }, [
        m('span', txt+' '),
        m('i.small.glyphicon glyphicon-triangle-' +
          (c.sortAsc() ? 'top' : 'bottom'))
      ]);
    };
    return m('section.sort', [
      m('h3', [
        m('span', conf.LANG.GROUP.SORT.TITLE),
        m('i.mp-tooltip.glyphicon glyphicon-info-sign',
          { 'data-msg': conf.LANG.GROUP.SORT.HELP })
      ]),
      m('ul.list-inline', [
        m('li', [ btn('ctime', conf.LANG.GROUP.PAD.SORT_BY_CREATION) ]),
        m('li', [ btn('name', conf.LANG.GROUP.PAD.SORT_BY_NAME) ]),
      ])
    ]);
  };

  view.search = function (c) {
    return m('section.search', [
      m('h3', [
        m('span', conf.LANG.GROUP.SEARCH.TITLE),
        m('i.mp-tooltip.glyphicon glyphicon-info-sign',
          { 'data-msg': conf.LANG.GROUP.SEARCH.HELP })
      ]),
      m('.input-group', [
        m('input.form-control', {
          type: 'search',
          placeholder: conf.LANG.GROUP.SEARCH.TYPE,
          minlength: 3,
          pattern: '.{3,}',
          value: c.search(),
          oninput: m.withAttr('value', c.search),
          onkeydown: function (e) {
            if (e.keyCode === 13) { // ENTER
              e.preventDefault();
              c.filterSearch();
            }
          }
        }),
        m('span.input-group-btn',
          m('button.btn.btn-default',
            { type: 'button', onclick: c.filterSearch },
            conf.LANG.USER.OK)
        ),
      ])
    ]);
  };

  view.filters = function (c) {
    return m('section.filter', [
      m('h3', [
        m('span', conf.LANG.GROUP.FILTERS.TITLE),
        m('i.mp-tooltip.glyphicon glyphicon-info-sign',
          { 'data-msg': conf.LANG.GROUP.FILTERS.HELP })
      ]),
      m('ul.list-unstyled', [
        m('li', [
          m('button.btn.btn-default.btn-xs.btn-block',
            {
              class: 'admin' + (c.filters.admins ? ' btn-info' : ''),
              onclick: ld.partial(c.filterToggle, 'admins')
            },
            conf.LANG.GROUP.FILTERS.ADMIN)
        ]),
        m('li', [
          m('button.btn.btn-default.btn-xs.btn-block',
            {
              class: 'user' + (c.filters.users ? ' btn-info' : ''),
              onclick: ld.partial(c.filterToggle, 'users')
            },
          conf.LANG.GROUP.FILTERS.USER)
        ]),
        m('li', [
          (function () {
            return ld.map(['restricted', 'private', 'public'], function (f) {
              return m('button.btn.btn-default.btn-xs.btn-block',
                {
                  class: 'user' + ((c.filterVisibVal === f) ? ' btn-info' : ''),
                  onclick: ld.partial(c.filterVisibility, f)
                }, conf.LANG.GROUP.FIELD.VISIBILITY + ' : ' +
                  conf.LANG.GROUP.FIELD[f.toUpperCase()]);
            });
          })()
        ])
      ])
    ]);
  };

  view.tags = function (c) {
    return m('section.tag', [
      m('h3', [
        m('span', conf.LANG.GROUP.TAGS.TITLE),
        m('i.mp-tooltip.glyphicon glyphicon-info-sign',
          { 'data-msg': conf.LANG.GROUP.TAGS.HELP })
      ]),
      m('ul.list-inline', ld.map(model.tags(), function (t) {
        return m('li', [
          m('button.btn.btn-default.btn-xs',
            {
              class: (c.filters[t] ? 'btn-info': ''),
              onclick: ld.partial(c.filterTag, t)
            },
            t)
        ]);
      }))
    ]);
  };

  view.aside = function (c) {
    var views = [ view.search(c), view.sort(c) ];
    if (!conf.SERVER.allPadsPublicsAuthentifiedOnly) { views.push(view.filters(c)); }
    views.push(view.tags(c));
    return m('section.group-aside', views);
  };

  view.group = function (c, g) {
    var padRoute = '/mypads/group/' + g._id;
    var isBookmarked = (ld.includes(u().bookmarks.groups, g._id));
    var GROUP = conf.LANG.GROUP;
    var isAdmin = ld.includes(g.admins, u()._id);
    var actions = [
      (function () {
        if (g.visibility !== 'restricted' || conf.SERVER.allPadsPublicsAuthentifiedOnly) {
          return m('button.btn.btn-default.btn-xs', {
            type: 'button',
            onclick: padShare.bind(c, g._id, null),
            title: conf.LANG.GROUP.SHARE
          }, [ m('i.glyphicon.glyphicon-link') ]);
        }
      })()
    ];
    if (isAdmin) {
      actions.push(m('a.btn.btn-default.btn-xs', {
        href: padRoute + '/edit',
        config: m.route,
        title: conf.LANG.MENU.CONFIG
      }, [ m('i.glyphicon glyphicon-wrench') ]),
      m('a.btn.btn-default.btn-xs', {
        href: padRoute + '/remove',
        config: m.route,
        title: conf.LANG.GROUP.REMOVE
      }, [ m('i.glyphicon.glyphicon-trash.text-danger') ]));
    }
    return m('tr', [
      m('th', [
        m('p.pull-right', actions),
        m('a.btn.btn-link.btn-lg', {
          onclick: group.mark.bind(c, g._id, c.computeGroups),
          href: '/mypads',
          config: m.route,
          title: (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK)
        }, [
          m('i',
            { class: 'glyphicon glyphicon-star' +
              (isBookmarked ? '' : '-empty') })
        ]),
        m('a', {
          href: '/mypads/group/' + g._id + '/view',
          config: m.route,
          title: conf.LANG.GROUP.VIEW_MANAGE
        }, g.name)
      ]),
      m('td', [
        ld.size(g.pads), (function () {
        var icons = [];
        if (isAdmin) {
          icons.push(m('a.btn.btn-default.btn-xs.pull-right',
            { href: padRoute + '/pad/add', config: m.route },
            [ m('i.glyphicon.glyphicon-plus.text-success',
                { title: conf.LANG.GROUP.PAD.ADD })
            ])
          );
        }
          return icons;
        })()
      ]),
      (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('td', conf.LANG.GROUP.FIELD[g.visibility.toUpperCase()]),
      (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('td', [ ld.size(g.admins), (function () {
        if (isAdmin) {
          return m('a.btn.btn-default.btn-xs.pull-right',
            { href: padRoute + '/user/share', config: m.route },
            [ m('i.glyphicon.glyphicon-plus.text-success',
              { title: conf.LANG.GROUP.SHARE_ADMIN })
            ]);
        }
      })()
      ]),
      (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('td', [
        (function () {
          if (g.visibility === 'restricted') {
            return [
              ld.size(g.users),
              (function () {
                if (isAdmin) {
                  return m(
                    'a.btn.btn-default.btn-xs.pull-right',
                    { href: padRoute + '/user/invite', config: m.route },
                    [
                      m('i.glyphicon.glyphicon-plus.text-success',
                        { title: conf.LANG.GROUP.INVITE_USER.IU })
                    ]
                  );
                }
              })()
            ];
          }
        })()
      ]),
      m('td', [
        m('ul.list-inline', ld.map(g.tags, function (t) {
          return m('li.label.label-default', {
            class: (c.filters[t] ? 'label-info' : ''),
            onclick: ld.partial(c.filterTag, t)
          }, t);
        }))
      ])
    ]);
  };

  view._groups = function (c, type) {
    return ld.map(c.groups[type], ld.partial(view.group, c));
  };
  view.groups = ld.partialRight(view._groups, 'normal');
  view.bookmarked = ld.partialRight(view._groups, 'bookmarked');
  view.archived = ld.partialRight(view._groups, 'archived');

  view.main = function (c) {
    return m('section', [
      m('h2', [
        m('span', conf.LANG.GROUP.MYGROUPS),
        m('i.mp-tooltip.glyphicon glyphicon-info-sign',
          { 'data-msg': conf.LANG.GROUP.HELP }),
        m('a.btn.btn-primary.pull-right', {
          href: '/mypads/group/add',
          config: m.route
        }, [
          m('span', conf.LANG.GROUP.ADD)
        ])
      ]),
      m('section.panel.panel-primary', [
        m('.panel-heading',
          m('h3.panel-title', conf.LANG.GROUP.GROUPS)
        ),
        m('table.table.table-stripped.table-bordered', [
          m('thead',
            m('tr', [
              m('th', {scope: 'col'}, conf.LANG.GROUP.GROUPS),
              m('th', {scope: 'col'}, conf.LANG.GROUP.PAD.PADS),
              (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.VISIBILITY},
                m('i.glyphicon.glyphicon-eye-open',
                  m('span.sr-only', conf.LANG.GROUP.PAD.VISIBILITY)
                )
              ),
              (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.ADMINS},
                m('i.glyphicon.glyphicon-knight',
                  m('span.sr-only', conf.LANG.GROUP.PAD.ADMINS)
                )
              ),
              (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.USERS},
                m('i.glyphicon.glyphicon-user',
                  m('span.sr-only', conf.LANG.GROUP.PAD.USERS)
                )
              ),
              m('th', {scope: 'col'}, conf.LANG.GROUP.TAGS.TITLE),
            ])
          ),
          m('tbody', [
            view.bookmarked(c),
            view.groups(c)

          ])
        ])
      ]),
      m('section.panel.panel-default', [
        m('.panel-heading',
          m('h3.panel-title', conf.LANG.GROUP.ARCHIVED)
        ),
        m('table.table.table-stripped.table-bordered', [
          m('thead',
            m('tr', [
              m('th', {scope: 'col'}, conf.LANG.GROUP.GROUPS),
              m('th', {scope: 'col'}, conf.LANG.GROUP.PAD.PADS),
              (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.VISIBILITY},
                m('i.glyphicon.glyphicon-eye-open',
                  m('span.sr-only', conf.LANG.GROUP.PAD.VISIBILITY)
                )
              ),
              (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.ADMINS},
                m('i.glyphicon.glyphicon-knight',
                  m('span.sr-only', conf.LANG.GROUP.PAD.ADMINS)
                )
              ),
              (conf.SERVER.allPadsPublicsAuthentifiedOnly) ? null : m('th', {scope: 'col', title: conf.LANG.GROUP.PAD.USERS},
                m('i.glyphicon.glyphicon-user',
                  m('span.sr-only', conf.LANG.GROUP.PAD.USERS)
                )
              ),
              m('th', {scope: 'col'}, conf.LANG.GROUP.TAGS.TITLE),
            ])
          ),
          view.archived(c)
        ])
      ])
    ]);
  };

  group.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };

  return group;
}).call(this);
