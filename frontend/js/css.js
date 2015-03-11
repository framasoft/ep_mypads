/**
*  # CSS
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
*  This module contains globals for dynamic CSS Styling
*/

module.exports = (function () {

  // Dependencies
  var m = require('mithril');

  var css = {};

  /*
  * ## Global rules
  *
  * Here are variables and constants for global styling of MyPads.
  */

  css.vars = {};

  css.vars.colors = {
    lightest: '#fafafa',
    light: '#f5f5f5',
    lightgrey: '#e0e0e0',
    grey: '#949494',
    dark: '#333333',
    purplemid: '#8157c2',
    purple : '#6a5687',
    purpledark: '#635182',
    red: '#cc2d18',
    yellowlight: '#fff8e3',
    yellowdark: '#c47e1b',
    yellowdarkest: '#a15014'
  };
  var colors = css.vars.colors;

  css.vars.fonts = {
    family: 'DejaVu Sans, Verdana, sans-serif'
  };
  var fonts = css.vars.fonts;

  css.vars.blocks = {
    body: {
      'font-size': '1em',
      'font-family': fonts.family,
      'background': colors.dark
    }
  };
  var blocks = css.vars.blocks;

  css.rules = {};

  css.rules.globals = {
    'main.block, aside.block': { 'background-color': colors.lightest },
    'main.block > section.block': { 'width': '100%', 'padding': '1em' },
    'main.block > aside.block': { 'width': '100%', 'padding': '1em' },
    'body.block-group': blocks.body,
  };

  css.rulesRaw = [ '@media (min-width: 60em) ' +
    '{ main.block > section.block { width: 70%; } ' +
    'main.block > aside.block { width: 30%; } }' ];

  css.rules.tags = {
    'header, footer': {
      'color': colors.light,
      'background-color': colors.dark
    },
    'header h1': { 'padding-left': '1%' },
    'footer': {
      'font-size': '0.7em',
      'text-align': 'center'
    },
    'a, a:visited, a:link': {
      'background-color': colors.purple,
      'color': colors.lightest,
      'text-decoration': 'underline dotted'
    },
    'fieldset': { 'border': 'none' },
    'legend': {
      'font': '1.1em bold',
      'border-bottom': '0.1em solid ' + colors.dark,
      'margin-bottom': '1em'
    },
    'label, input': { 'margin': '0.5em 0 0.5em' },
    'label': { 'text-transform': 'uppercase' },
    'input': {
      'padding': '0.7em',
      'border': '0.1em solid ' + colors.lightgrey,
      'border-radius': '0.3em',
      'color': colors.dark,
      'background': colors.lightest
    },
    'input[type=text]:focus, input[type=password]:focus': {
      'border-color': colors.grey,
      'border-left-width': '0.3em',
      'border-right-width': '0.3em'
    },
    'input:invalid': { 'border-color': colors.red },
    'input.send': {
      'font-weight': 'bold',
      'color': colors.yellowlight,
      'background': colors.yellowdarkest
    },
    'input.send:hover, input.send:focus': { 'background': colors.yellowdark }
  };

  css.rules.icons = {
    'i.icon-alert': { 'color': colors.red }
  };

  /*
  * ## Functions
  *
  * Global functions helpers
  */

  css.fn = {};

  /*
  * ### createStyleSheet
  *
  * `createStyleSheet` is a function that injects a *style* tag into the head
  * and returns the stylesheet just created by this way.
  */

  css.fn.createStyleSheet = function () {
    var styl = document.createElement('style');
    document.head.appendChild(styl);
    return styl.sheet;
  };

  /*
  * ### addProps
  *
  * `addProps` is a function that takes a `sheet` and a `props` JS object,
  * composed by rules and values to insert to the sheet.
  *
  * The `props` object, can be  for example :
  *
  * var props = {
  *   'body': { 'background': 'black', 'border-width': '1em' },
  *   'a': { 'text-decoration': 'none' }
  * };
  */

  css.fn.addProps = function (sheet, props) {
    for (var selector in props) {
      var rules = props[selector];
      var ruleStr = '';
      for (var r in rules) {
        var v = rules[r];
        ruleStr += r + ': ' + v + '; ';
      }
      ruleStr = selector + ' { ' + ruleStr + '}';
      sheet.insertRule(ruleStr, sheet.cssRules.length);
    }
  };

  /**
  * ### Media Queries
  *
  * `medias` is an object containing a list of responsive breaks and functions
  * to call when they match.
  */


  css.medias = {};

  css.medias.breaks = {
    desktop: window.matchMedia('(min-width: 60em)'),
    largetablet: window.matchMedia('(min-width: 50em)'),
    tablet: window.matchMedia('(min-width: 40em)')
  };

  css.medias.fns = {};
  css.medias.fns.desktop = [
    function () { console.log('desktop'); }
  ];
  css.medias.fns.tablet = [
    function () { console.log('tablet'); }
  ];

  /**
  * `init` adds a new stylesheet and its global properties.
  * It also creates listeners for responsive design and apply functions when
  * break is matched.
  */

  css.init = function () {
    var sheet = css.fn.createStyleSheet();
    for (var r in css.rules) {
      css.fn.addProps(sheet, css.rules[r]);
    }
    for (r in css.rulesRaw) {
      sheet.insertRule(css.rulesRaw[r], sheet.cssRules.length);
    }
    // TODO: only m.redraws ?
    var listener = function (name) {
      return function (m) {
        if (m.matches) {
          for (var i = 0, l = css.medias.fns[name].length; i < l; i++) {
            css.medias.fns[name][i]();
          }
        }
      };
    };
    //css.medias.breaks.desktop.addListener(listener('desktop'));
    //css.medias.breaks.tablet.addListener(listener('tablet'));
    for (var name in css.medias.breaks) {
      css.medias.breaks[name].addListener(m.redraw);
    }
  };

  return css;

}).call(this);
