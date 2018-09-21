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
  var m      = require('mithril');
  var ld     = require('lodash');
  var encode = require('js-base64').Base64.encode;

  // Local dependencies
  var conf      = require('../configuration.js');
  var auth      = require('../auth.js');
  var layout    = require('./layout.js');
  var model     = require('../model/group.js');
  var padMark   = require('./pad-mark.js');
  var padShare  = require('./pad-share.js');
  var expandPad = require('../helpers/expandPad.js');
  var ready     = require('../helpers/ready.js');

  var pad = {};

  /**
  * ## Controller
  */

  pad.controller = function () {

    var c = {
      group: {},
      pad: {},
      sendPass: m.prop(false),
      password: m.prop(''),
      showIframe: m.prop(true)
    };

    c.isAuth    = auth.isAuthenticated();
    c.isGuest   = !c.isAuth;
    c.bookmarks = (c.isAuth ? auth.userInfo().bookmarks.pads : []);

    c.gid = m.route.param('group');
    c.pid = m.route.param('pad');

    /**
    * ## init function
    *
    * Gathers group and pad values from local cache.
    * Admin should not need password when visibility is private.
    */

    var init = function (err) {
      if (err) { return m.route('/mypads'); }
      var _init = function () {
        var data = c.isGuest ? model.tmp() : model;
        c.group  = data.groups()[c.gid] || {};
        c.pad    = data.pads()[c.pid];
        if (!c.pad) { return m.route('/mypads'); }
        document.title = conf.LANG.GROUP.PAD.PAD + ' ' + c.pad.name;
        document.title += ' - ' + conf.SERVER.title;
        c.isAdmin = (function () {
          if (c.isAuth && c.group.admins) {
            return ld.includes(c.group.admins, auth.userInfo()._id);
          } else {
            return false;
          }
        })();
      };
      if (model.pads()[c.pid]) {
        _init();
      } else {
        c.isGuest = true;
        model.fetchObject({ group: c.gid, pad: c.pid }, undefined, _init);
      }
    };

    var fetchFn = (function () {
      if (c.isAuth) {
        return ld.partial(model.fetch, init);
      } else {
        var keys = { group: c.gid, pad: c.pid };
        return ld.partial(model.fetchObject, keys, undefined, init);
      }
    })();
    if (ld.isEmpty(model.pads())) { fetchFn(); } else { init(); }

    c.submit = function (e) {
      e.preventDefault();
      model.fetchObject({ group: c.gid, pad: c.pid }, c.password(),
        function (err) {
          if (err) { return c.sendPass(false); }
          var data = c.isGuest ? model.tmp() : model;
          c.group  = data.groups()[c.gid];
          c.pad    = data.pads()[c.pid];
          c.sendPass(true);
        }
      );
    };

    return c;
  };

  /**
  * ## Views
  */

  var view = {};

  view.passForm = function(c) {
    return m('form', {
      id: 'password-form',
      config: ready.inFrame,
      onsubmit: c.submit
    }, [
      m('label.block', { for: 'mypadspassword' }, conf.LANG.USER.PASSWORD),
      m('input.block', {
        type: 'password',
        required: true,
        placeholder: conf.LANG.USER.UNDEF,
        value: c.password(),
        oninput: m.withAttr('value', c.password)
      }),
      m('input.ok.block', {
        form: 'password-form',
        type: 'submit',
        value: conf.LANG.USER.OK
      })
    ]);
  };

  view.pad = function (c) {
    var u  = auth.userInfo();
    var p  = (c.sendPass() ? '&mypadspassword=' + encode(c.password()) : '');
    var a  = (auth.isAuthenticated() ? '&auth_token=' + auth.token() : '');
    var n  = '';
    var co = '';
    if (u) {
      if (((u.useLoginAndColorInPads || conf.SERVER.useFirstLastNameInPads) && u.color)) {
        co = '&userColor=' + u.color;
      }
      if (conf.SERVER.useFirstLastNameInPads) {
        var firstname = (u.firstname) ? u.firstname : '';
        var lastname  = (u.lastname)  ? u.lastname  : '';

        n = '&userName=' + firstname + ' ' + lastname;
      } else if (u.useLoginAndColorInPads) {
        if (u.padNickname) {
          n = '&userName=' + u.padNickname;
        } else {
          n = '&userName=' + u.login;
        }
      }
    }
    var link = conf.URLS.RAWBASE.replace('mypads/', '') + 'p/' + c.pad._id + '?' + p + a + co + n;
    return [
      m('p.text-right', [
        m('a.btn.btn-default.expand-toggle', {
          href: '#',
          title: conf.LANG.GROUP.PAD.EXPAND,
          onclick: function (e) {
            e.preventDefault();
            if (expandPad.isExpanded()) {
              expandPad.reduceIframe();
            } else {
              expandPad.expandIframe();
            }
            return true;
          }
        }, [
          m('i.glyphicon.glyphicon-resize-full')
        ]),
        m('a.btn.btn-default.new-window', {
          href: link,
          target: '_blank',
          title: conf.LANG.GROUP.PAD.OPEN_TAB,
          onclick: function () {
            expandPad.reduceIframe(false);
            c.showIframe(false);
            return true;
          }
        }, [
          m('i.glyphicon.glyphicon-new-window')
        ])
        ]),
      (function () {
        if (c.showIframe()) {
          return m('iframe', { src: link });
        }
      })()
    ];
  };

  view.main = function (c) {
    var isPrivate = (function () {
      if (c.pad) {
        return (c.pad.visibility === 'private');
      } else {
        return (c.group.visibility && c.group.visibility === 'private');
      }
    })();
    var showPass = (!c.isAdmin && isPrivate && !c.sendPass());
    if (showPass) { return view.passForm(c); }
    var route = '/mypads/group/' + c.gid;
    var GROUP = conf.LANG.GROUP;
    return m('section', { class: 'group' }, [
      m('.btn-group.pull-right', [
        (function () {
          var isGroupSharable = (c.group && c.group.visibility &&
            c.group.visibility !== 'restricted');
          var isPadSharable = (c.pad.visibility &&
            c.pad.visibility !== 'restricted');
          if (isGroupSharable || isPadSharable || conf.SERVER.allPadsPublicsAuthentifiedOnly) {
              return m('button.btn.btn-default', {
                title: conf.LANG.GROUP.SHARE,
                onclick: padShare.bind(c, c.gid, c.pad._id)
              },
              [ m('i.glyphicon glyphicon-link'),
                m('span', ' '+conf.LANG.GROUP.SHARE)
              ]);
          }
        })(),
        (function () {
          if (c.isAdmin) {
            return m('a.btn.btn-default', {
              href: route + '/pad/edit/' + c.pad._id,
              config: m.route,
              title: conf.LANG.MENU.CONFIG
            },
            [ m('i.glyphicon glyphicon-wrench'),
              m('span', ' '+conf.LANG.MENU.CONFIG)
            ]);
            }
        })(),
        (function () {
          if (c.isAdmin) {
            return m('a.btn.btn-danger', {
              href: route + '/pad/remove/' + c.pad._id,
              config: m.route,
              title: conf.LANG.GROUP.REMOVE
            },
            [ m('i.glyphicon glyphicon-trash'),
              m('span', ' '+conf.LANG.GROUP.REMOVE)
            ]);
          }
        })()
      ]),
      m('h2', [
        (function () {
          if (auth.isAuthenticated()) {
            var isBookmarked = ld.includes(c.bookmarks, c.pad._id);
            return m('button.btn.btn-link.btn-lg', {
              title: (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK),
              onclick: function () { padMark(c.pad); }
            }, [
              m('i',
                { class: 'glyphicon glyphicon-star' +
                  (isBookmarked ? '' : '-empty'),
                  title: (isBookmarked ? GROUP.UNMARK : GROUP.BOOKMARK) })
            ]);
          }
        })(),
        m('span', conf.LANG.GROUP.PAD.PAD + ' ' + c.pad.name),
        (function () {
          if (c.group && c.group.name) {
            return [ m('br'), m('span.h3', [
              ' (',
              conf.LANG.GROUP.PAD.FROM_GROUP+' ',
              m('a', {
                href: route + '/view',
                config: m.route,
                title: conf.LANG.GROUP.VIEW
              }, c.group.name ),
              ')'
            ])];
          }
        })()
      ]),
      m('section.pad', view.pad(c))
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
      m('article.well', m.trust(conf.LANG.GROUP.PAD.VIEW_HELP))
    ]);
  };

  pad.view = function (c) {
    return layout.view(view.main(c), view.aside());
  };

  return pad;

}).call(this);
