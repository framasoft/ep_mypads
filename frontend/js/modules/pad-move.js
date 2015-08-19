/**
*  # Pad migration from a group to another
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
*  Short module for pad adding and updating by name
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var auth = require('../auth.js');
  var conf = require('../configuration.js');
  var model = require('../model/group.js');
  var notif = require('../widgets/notification.js');
  var layout = require('./layout.js');

  var move = {};

  /**
  * ## Controller
  *
  * Used for authentication enforcement, model initialization and
  * pre-calculation of available groups (where user is admin and where the
  * group is not the same as the former one);
  */

  move.controller = function () {
    if (!auth.isAuthenticated()) { return m.route('/login'); }

    var c = { data: { newGroup: m.prop() } };
    var gid = m.route.param('group');

    var init = function () {
      c.selectedGroups = ld(model.groups())
        .values()
        .filter(function (g) {
          var isAdmin = ld.includes(g.admins, auth.userInfo()._id);
          return (isAdmin && (g._id !== gid));
        })
        .value();
      c.group = model.groups()[gid];
    };

    if (ld.isEmpty(model.groups())) { model.fetch(init); } else { init(); }

    /**
    * ### c.movePads
    *
    * `c.movePads` is a non-optimized function that uses multiple API PUT to
    * effectively change the group. It takes care of updating the local indexed
    * for groups and pads.
    */

    c.movePads = function (e) {
      e.preventDefault();
      var _pads = ld.clone(model.pads(), true);
      var pads = ld.reduce(model.pads(), function (memo, p, k) {
        if (p.group === gid) {
          p.group = c.data.newGroup();
          _pads[k] = p;
          memo.push(p);
        }
        return memo;
      }, []);
      var updatePad = function (p) {
        m.request({
          method: 'PUT',
          url: conf.URLS.PAD + '/' + p._id,
          data: ld.assign(p, { auth_token: auth.token() })
        }).then(done, function (err) {
          notif.error({ body: ld.result(conf.LANG, err.error) });
        });
      };
      var done = function (resp) {
        if (resp) {
          ld.pull(model.groups()[gid].pads, resp.key);
          model.groups()[c.data.newGroup()].pads.push(resp.key);
        }
        if (pads.length) {
          updatePad(pads.pop());
        } else {
          model.pads(_pads);
          notif.success({ body: conf.LANG.GROUP.INFO.PAD_MOVE_SUCCESS });
          m.route('/mypads/group/' + c.data.newGroup() + '/view');
        }
      };
      done();
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  /**
  * ### group field
  * 
  * A selection fields of groups where user is the admin.
  * Composed with a label, input and icon
  */

  view.groups = function (c) {
    var label = m('label.block', { for: 'group' },
      conf.LANG.GROUP.MYGROUPS);
    var select = (function () {
      var options = ld.map(c.selectedGroups, function (g) {
        return m('option', { value: g._id }, g.name);
      });
      if (options.length > 0) {
        options.splice(0, 0, m('option'));
        return m('select', {
          name: 'group',
          class: 'block',
          required: true,
          value: c.data.newGroup(),
          onchange: m.withAttr('value', c.data.newGroup)
        }, options);
      } else {
        return m('div.block', conf.LANG.GROUP.INFO.PAD_MOVE_NOGROUP);
      }
    })();
    var icon = m('i', {
      class: 'block tooltip icon-info-circled',
      'data-msg': conf.LANG.GROUP.INFO.PAD_MOVE
    });
    return { label: label, icon: icon, select: select };
  };

  /**
  * ### form
  *
  * Main form with unique field : group selection
  */

  view.form = function (c) {
    var vg = view.groups(c);
    var elements = [ vg.label, vg.select, vg.icon ];
    if (c.selectedGroups.length > 0) {
      elements.push(m('input.block.send', {
        form: 'padmove-form',
        type: 'submit',
        value: conf.LANG.ACTIONS.SAVE
      }));
    }
    return m('form.block', {
      id: 'padmove-form',
      onsubmit: c.movePads
    }, elements);
  };

  /**
  * ### main and global view
  *
  * Views with cosmetic and help changes according to the current page.
  */

  view.main = function (c) {
    var route = '/mypads/group/' + c.group._id;
    return m('section', { class: 'block-group padmove user group-form' }, [
      m('h2.block', [
        m('span', conf.LANG.GROUP.PAD.MOVE_TITLE),
        m('a', {
          href: route + '/view',
          config: m.route,
          title: conf.LANG.GROUP.VIEW
        }, c.group.name )
      ]),
      view.form(c)
    ]);
  };

  view.aside = function () {
    return m('section.user-aside', [
      m('h2', conf.LANG.ACTIONS.HELP),
      m('article', m.trust(conf.LANG.GROUP.PAD.MOVE_HELP))
    ]);
  };

  move.view = function (c) {
    return layout.view(view.main(c), view.aside(c));
  };


  return move;

}).call(this);
