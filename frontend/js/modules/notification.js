/**
*  # Notification module
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
*  This module contains a generic widgets handling several types of visual
*  notifications.
*/

module.exports = (function () {
  // Global dependencies
  var m = require('mithril');
  // Local dependencies
  var conf = require('../configuration.js');
  var NOTIF = conf.LANG.NOTIFICATION;
  var notifStyle = require('../../style/notification.js');
  var classes = notifStyle.sheet.main.classes;

  var notif = {};

  /**
  * ## Model
  *
  * `model` contains a list of items id -> item and an autoincrement id.
  */

  notif.model = {
    items: {},
    counter: 0
  };

  /**
  * ## Controller
  *
  * `controller` relies on `model` and gives functions to close directly or
  * after a delay a notification.
  */
  notif.controller = function () {
    var c = {};
    c.toClose = {};
    c.close = function (id, from) {
      // with from false, no clear because notimeout
      if ((from) && (from !== 'timeout')) {
        window.clearTimeout(c.toClose[id]);
      }
      delete c.toClose[id];
      delete notif.model.items[id];
    };

    c.delayClose = function (id, timeout) {
      if ((timeout) && !(c.toClose[id])) {
        c.toClose[id] = window.setTimeout(function () {
          m.startComputation();
          c.close(id, 'timeout');
          m.endComputation();
        }, timeout * 1000);
      }
    };
    return c;
  };

  /**
  * ## View
  *
  * Self contained view for notifications.
  */

  notif.view = function (ctrl) {
    var keys = Object.keys(notif.model.items).sort();
    return m('div', { class: classes.global }, keys.map(function (id) {
      var n = notif.model.items[id];
      ctrl.delayClose(id, n.timeout);
      var closeFn = ctrl.close.bind(ctrl, id, n.timeout);
      var notifClass = [classes.div];
      if (n.cls) { notifClass.push(classes[n.cls]); }
      return m('div.block-group', {
        class: notifClass.join(' '),
        onclick: (n.click ? n.click : closeFn)
      }, [
        m('header', { class: 'block ' + classes.header }, [
          (n.icon ? m('i', { class: 'icon-' + n.icon }) : ''),
          m('span', n.title)
        ]),
        m('i', {
          class: 'block close icon-cancel-circled ' + classes.iclose,
          onclick: closeFn
        }),
        m('p', { class: 'block ' + classes.p }, m.trust(n.body))
      ]);
    }));
  };

  /**
  * ## Public functions
  *
  * `send` is the generic way of sending a new notification.
  * They all takes an `options` object and a `callback` function.
  */

  notif.send = function (options, callback) {
    if (options.timeout === undefined) { options.timeout = 10; }
    notif.model.counter += 1;
    notif.model.items[notif.model.counter] = options;
    m.redraw();
    if (callback) { callback(); }
  };

  notif.success = function (options, callback) {
    options.title = options.title || NOTIF.SUCCESS;
    options.cls = 'success';
    options.icon = 'check';
    notif.send(options, callback);
  };

  notif.info = function (options, callback) {
    options.title = options.title || NOTIF.INFO;
    options.cls = 'info';
    options.icon = 'info-circled';
    notif.send(options, callback);
  };

  notif.warning = function (options, callback) {
    options.title = NOTIF.WARNING;
    options.cls = options.icon = 'warning';
    options.timeout = 15;
    notif.send(options, callback);
  };

  notif.error = function (options, callback) {
    options.title = NOTIF.ERROR;
    options.cls = 'error';
    options.icon = 'alert';
    options.timeout = false;
    notif.send(options, callback);
  };

  notif.errorUnexpected = function (options, callback) {
    options.body = '<em>' + options.body + '</em><br>' + NOTIF.ERROR_UNEXPECTED;
    notif.error(options, callback);
  };

  return notif;

}).call(this);
