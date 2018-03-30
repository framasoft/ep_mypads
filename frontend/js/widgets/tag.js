/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
    c.label = c.label || conf.LANG.TAG.TAGS;
    c.placeholder = c.placeholder || conf.LANG.TAG.PLACEHOLDER;
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

    c.addMultiple = function (textarea) {
      var v = textarea.value;
      if (v.length !== 0) {
        v = ld.compact(v.split('\n'));
        c.current = ld.union(c.current, v);
        c.tags = ld.difference(c.tags, v);
        textarea.value = '';
      }
    };

    return c;
  };

  /**
  * ## Views
  *
  * Views for the widget.
  */

  tag.views = {};

  tag.views.icon = function () {
    return m('i', {
      class: 'mp-tooltip glyphicon glyphicon-info-sign tag',
      'data-msg': conf.LANG.TAG.HELP
    });
  };

  tag.views.input = function (c) {
    return m('input.form-control', {
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

  tag.views.datalist = function (c) {
    return m('datalist', { id: c.name }, ld.map(c.tags, function (tag) {
      return m('option', { value: tag });
    }));
  };

  tag.views.tagslist = function (c) {
    return m('ul.list-inline help-block', ld.map(c.current, function (tag) {
      return m('li', [
        m('span.label.label-default', tag),
        m('i', {
          role: 'button',
          class: 'small glyphicon glyphicon-remove text-danger',
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
    return m('div.form-group', [
      m('label.col-sm-4', { for: c.name }, [ c.label, tag.views.icon() ]),
      m('.col-sm-7', [
        m('.input-group.input-group-sm', [
          tag.views.input(c),
          m('span.input-group-btn',
            m('button.btn.btn-default', {
              type: 'button',
              onclick: function () {
                c.add(document.getElementById(c.name + '-input'));
              },
            }, conf.LANG.USER.OK)
          )
        ]),
        tag.views.datalist(c),
        tag.views.tagslist(c)
      ])
    ]);
  };

  return tag;
}).call(this);
