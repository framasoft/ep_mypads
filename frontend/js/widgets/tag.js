
/**
*  # Tag field module
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
*  This module contains a generic widget handling tag like widget, using HTML5
*  datalist element.
*/

module.exports = (function () {
  'use strict';
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  // Local dependencies
  var conf = require('../configuration.js');
  var TAG = conf.LANG.TAG;

  var tag = {};

  /**
  * ## Controller
  *
  * Used for state. Takes a `config` JS Object with :
  *
  * - `content` ??
  * - `tags` array, containing available choices
  * - `current` array, for current attached values
  * - optional `label` text for input field, default to *TAG.TAGS*
  * - optional `placeholder` text for input field, default to *TAG.PLACEHOLDER*
  * - optional `name` attribute, for the name of the input, default to *tags*
  */

  tag.controller = function (config) {
    var c = config;
    c.label = c.label || TAG.TAGS;
    c.placeholder = c.placeholder || TAG.PLACEHOLDER;
    c.name = c.name || 'tags';

    c.tags = ld.difference(c.tags, c.current);

    c.add = function (input) {
      var v = input.value;
      if (v.length !== 0) {
        if (!ld.includes(c.current, v)) { c.current.push(v); }
        ld.pull(c.tags, v);
        input.value = '';
      }
    };

    return c;
  };

  /**
  * ## Views
  *
  * Views for the widget.
  */

  var view = {};

  view.icon = function () {
    return m('i', {
      class: 'block tooltip icon-info-circled tag',
      'data-msg': TAG.HELP
    });
  };

  view.input = function (c) {
    return m('input.block', {
      id: c.name + '-input',
      name: c.name,
      type: 'text',
      list: c.name,
      placeholder: c.placeholder,
      onkeydown: function (e) {
        if (e.keyCode === 13) { // ENTER
          e.preventDefault();
          c.add(e.target);
        }
      },
      onchange: function (e) { c.add(e.target); }
    });
  };

  view.datalist = function (c) {
    return m('datalist', { id: c.name }, ld.map(c.tags, function (tag) {
      return m('option', { value: tag });
    }));
  };

  view.tagslist = function (c) {
    return m('ul.block', ld.map(c.current, function (tag) {
      return m('li', [
        m('span', tag),
        m('i', {
          role: 'button',
          class: 'icon-cancel',
          onclick: function (e) {
            var value = e.target.parentElement.textContent;
            ld.pull(c.current, value);
            c.tags.push(value);
          }
        })
        ]);
      }));
  };

  tag.view = function (c) {
    return m('div.block-group.tag', [
      m('label.block', { for: c.name }, c.label),
      view.input(c),
      view.icon(),
      m('button.block.ok', {
        type: 'button',
        onclick: function () {
          c.add(document.getElementById(c.name + '-input'));
        },
      }, conf.LANG.USER.OK),
      view.datalist(c),
      view.tagslist(c)
    ]);
  };

  return tag;
}).call(this);
