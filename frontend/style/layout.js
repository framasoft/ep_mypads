/**
*  # Global CSS Style
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
  var jss = require('jss');
  var jssNested = require('jss-nested');
  jss.use(jssNested);
  var vars = require('./vars.js');
  var tooltip = require('./tooltip.js');
  var notif = require('./notification.js');

  var layout = {};

  /**
  * ## rules
  *
  * All global CSS rules.
  */

  layout.rules = {
    'main.block, aside.block': { 'background-color': vars.color.lightest },
    'aside.block, main.block > section.block': {
      'width': '100%',
      'padding': '1em'
    },
    'body': {
      'font-size': '1em',
      'font-family': vars.font.family,
      'background': vars.color.dark
    },
    'header, footer': {
      'color': vars.color.light,
      'background-color': vars.color.dark
    },
    'header h1': { 'padding-left': '1%' },
    'footer': {
      'font-size': '0.7em',
      'text-align': 'center'
    },
    'a, a:visited, a:link': {
      'background-color': vars.color.purple,
      'color': vars.color.lightest,
      'text-decoration': 'underline dotted'
    },
    'fieldset': { 'border': 'none' },
    'legend': {
      'font': '1.1em bold',
      'border-bottom': '0.1em solid ' + vars.color.dark,
      'margin-bottom': '1em'
    },
    'label, input': { 'margin': '0.5em 0 0.5em' },
    'label': { 'text-transform': 'uppercase' },
    'input': {
      'padding': '0.7em',
      'border': '0.1em solid ' + vars.color.lightgrey,
      'border-radius': '0.3em',
      'color': vars.color.dark,
      'background': vars.color.lightest
    },
    'input:focus': {
      'border-color': vars.color.grey,
      'border-left-width': '0.3em',
      'border-right-width': '0.3em'
    },
    'input:invalid': { 'border-color': vars.color.red },
    'input[type=submit]': {
      'font-weight': 'bold',
      'color': vars.color.yellowlight,
      'background': vars.color.yellowdarkest
    },
    'input[type=submit]:hover, input[type=submit]:focus': {
      'background': vars.color.yellowdark
    },
    'i.icon-alert': { 'color': vars.color.red }
  };

  /**
  * ## Animations
  */

  var fadeIn = { from: { 'opacity': 0 }, to: { 'opacity': 1 } };
  layout.rules['@keyframes fadein'] = { 'from': fadeIn.from, 'to': fadeIn.to };
  layout.rules['@-moz-keyframes fadein'] = {
    'from': fadeIn.from,
    'to': fadeIn.to
  };
  layout.rules['@-webkit-keyframes fadein'] = {
    'from': fadeIn.from,
    'to': fadeIn.to
  };

  /**
  * ## Responsiveness
  */

  layout.responsive = {
    'main.block > section.block': { 'width': '70%' },
    'main.block > aside.block': { 'width': '30%' }
  };

  /**
  * ## attach
  *
  * This function attaches the global stylesheet to the application.
  * It uses classic css tags and not the named ones.
  */

  layout.attach = function () {
    layout.sheet = {
      main: jss.createStyleSheet(layout.rules, { named: false }).attach(),
      desktop: jss.createStyleSheet(layout.responsive, {
        media: '(min-width: 60em)',
        named: false
      }).attach()
    };
    tooltip.attach();
    notif.attach();
  };

  return layout;

}).call(this);
