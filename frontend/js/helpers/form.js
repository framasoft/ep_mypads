/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Form helpers functions
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
*  This module contains common functions used with forms.
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');

  var form = {};

  /**
  * ## icon
  *
  * `icon` is an helper that makes an classic icon by its :
  *
  * - `c` controller,
  * - `name` of the field,
  * - `info` message
  * - `err` message
  *
  * It returns a vdom node.
  */

  form.icon = function (c, name, info, err) {
    var icls = 'glyphicon mp-tooltip glyphicon-';
    icls += (c.valid[name]() ? 'info-sign' : 'exclamation-sign');
    var msg = c.valid[name]() ? info : err;
    return m('i', {
      class: icls,
      'data-msg': msg
    });
  };

  /**
  * ## field
  *
  * `field` is an helper that returns the triplet of vdoms, by taking
  *
  * - the `c` controller,
  * - the `name` of the field,
  * - the `label` locale
  *   the `icon` ready vdom
  */

  form.field = function (c, name, label, icon) {
    return {
      label: m('label', { for: name }, [ label, icon ]),
      input:
        m('input.form-control', {
          name: name,
          value: c.data[name]() || '',
          oninput: form.handleField.bind(null, c)
        }),
      icon: icon
    };
  };


  /**
  * `initFields` takes
  *
  * - a controller instance
  * - an array of field `names`
  *
  * It creates local data states for values of these fields and booleans values
  * for validitation purpose.
  */

  form.initFields = function (c, names) {
    c.data = {};
    c.valid = {};
    names.forEach(function (n) {
      c.data[n] = m.prop();
      c.valid[n] = m.prop(true);
    });
  };

  /**
  * `handleField` function takes
  *
  * - a `c` controller instance, used to set validity and fix value
  * - an `extra` optional function that can be used to add another test to HTML5
  *   validity, that takes itself `c` controller and `e` event
  * - a DOM Event, which use HTML5 Validation API to ensure input is valid or
  *   not.
  */

  form.handleField = function (c, extra, e) {
    if (!e) {
      e = extra;
      extra = undefined;
    }
    var field = e.target.getAttribute('name');
    var isValid = function () {
      if (extra) {
        return (e.target.checkValidity() && extra(c, e));
      } else {
        return e.target.checkValidity();
      }
    };
    c.data[field](e.target.value);
    c.valid[field](isValid());
  };

  /**
  * `focusOnInit` is a mithril.config attribute that focus on a given `element`
  * at first initialization.
  */

  form.focusOnInit = function (element, isInit) {
    if (!isInit) { element.focus(); }
  };

  return form;

}).call(this);
