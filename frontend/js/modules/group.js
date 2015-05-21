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
  var notif = require('../widgets/notification.js');
  var auth = require('../auth.js');
  var u = auth.userInfo;
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
    * #### filterToggle
    *
    * `filterToggle` is a function taking a `field` string object, key of
    * `c.filters` for toggling filter, accoding to group `field` (for instance
    * used for admins and users).
    */

    c.filterToggle = function (field) { 
      if (!c.filters[field]) {
        c.filters[field] = function (g) {
          return ld.includes(g[field], u()._id);
        }; 
      } else {
        c.filters[field] = false;
      }
      c.computeGroups();
    };

    /**
    * #### filterTag
    *
    * `filterTag` is similar to `filterToggle` but works with several tags, as
    * taken as argument.
    */

    c.filterTag = function (tag) {
      if (!c.filters[tag]) {
        c.filters[tag] = function (g) { return ld.includes(g.tags, tag); };
      } else {
        c.filters[tag] = false;
      }
      c.computeGroups();
    };

    /**
    * #### filterVisibility
    *
    * `filterVisibility` is similar to `filterTag` but works exact given
    * `visibility` string.
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
    * ### computeGroups
    *
    * `computeGroups` is an internal function that computed groups according to
    * list view needs. It :
    *
    * - filters according to `c.filters`
    * - takes model.data() and creates a new object with separate bookmared,
    *   archived and normal groups
    * - sets `c.groups` for usage in view.
    */

    c.computeGroups = function () {
      c.groups = ld(model.data()).values().sortBy('name').value();
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


    /**
    * ### mark
    *
    * `mark` function takes a group object and adds or removes it from the
    * bookmarks of the current user.
    */

    c.mark = function (gid) {
      var user = u();
      var errfn = function (err) { return notif.error({ body: err.error }); };
      if (ld.includes(user.bookmarks.groups, gid)) {
        ld.pull(user.bookmarks.groups, gid);
      } else {
        user.bookmarks.groups.push(gid);
      }
      m.request({
        url: conf.URLS.USERMARK,
        method: 'POST',
        data: { type: 'groups', key: gid }
      }).then(function () {
        c.computeGroups();
        notif.success({ body: GROUP.MARK_SUCCESS });
      }, errfn);
    };

    // Bootstrapping
    if (ld.isEmpty(model.data())) {
      model.fetch(c.computeGroups);
    } else {
      c.computeGroups();
    }

    window.c = c;
    return c;
  };

  /**
  * ## Views
  *
  */

  var view = {};

  view.search = function (c) {
    return m('section.search.block-group', [
      m('h3.block', [
        m('span', GROUP.SEARCH.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': GROUP.SEARCH.HELP })
      ]),
      m('input.block', {
        type: 'search',
        placeholder: GROUP.SEARCH.TYPE,
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
      m('button.block',
        { type: 'button', onclick: c.filterSearch },
        conf.LANG.USER.OK)
    ]);
  };

  view.filters = function (c) {
    return m('section.filter', [
      m('h3', [
        m('span', GROUP.FILTERS.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': GROUP.FILTERS.HELP })
      ]),
      m('ul', [
        m('li', [
          m('button',
            {
              class: 'admin' + (c.filters.admins ? ' active' : ''),
              onclick: ld.partial(c.filterToggle, 'admins') 
            },
            GROUP.FILTERS.ADMIN)
        ]),
        m('li', [
          m('button',
            {
              class: 'user' + (c.filters.users ? ' active' : ''),
              onclick: ld.partial(c.filterToggle, 'users') 
            },
          GROUP.FILTERS.USER)
        ]),
        m('li', [
          (function () {
            return ld.map(['restricted', 'private', 'public'], function (f) {
              return m('button',
                {
                  class: 'user' + ((c.filterVisibVal === f) ? ' active' : ''),
                  onclick: ld.partial(c.filterVisibility, f) 
                }, GROUP.GROUPS + ' ' + GROUP.FIELD[f.toUpperCase()]);
            });
          })()
        ])
      ])
    ]);
  };

  view.tags = function (c) {
    return m('section.tag', [
      m('h3', [
        m('span', GROUP.TAGS.TITLE),
        m('i.tooltip.icon-info-circled', { 'data-msg': GROUP.TAGS.HELP })
      ]),
      m('ul', ld.map(model.tags(), function (t) {
        return m('li', [
          m('button',
            {
              class: (c.filters[t] ? 'active': ''),
              onclick: ld.partial(c.filterTag, t)
            },
            t)
        ]);
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
        m('button.block', {
          onclick: c.mark.bind(c, g._id)
          }, (function () {
            if (ld.includes(u().bookmarks.groups, g._id)) {
              return GROUP.UNMARK;
            } else {
              return GROUP.BOOKMARK;
            }
        })()),
        m('ul.block', ld.map(g.tags, function (t) { return m('li', t); }))
      ])
    ]);
  };

  view._groups = function (c, type) {
    return m('ul.group', ld.map(c.groups[type], ld.partial(view.group, c)));
  };
  view.groups = ld.partialRight(view._groups, 'normal');
  view.bookmarked = ld.partialRight(view._groups, 'bookmarked');
  view.archived = ld.partialRight(view._groups, 'archived');

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
