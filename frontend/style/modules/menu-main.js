/**
*  # Menu Main Style
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
*/

module.exports = (function () {

  // Dependencies
  var utils = require('../utils.js');
  var vars = require('../vars.js');

  var menuMain = {};

  /**
  * ## rules
  *
  * Local rules for the main menu
  */

  menuMain.rules = {};
  var rules = menuMain.rules;
  var itemFocused = { 'background-color': vars.color.purpledark };

  rules.nav = { 'text-align': 'right' };
  rules.ul = { 'list-style-type': 'none' };
  rules.li = {
    'padding': '1em',
    'display': 'inline',
    'font-weight': 'bold',
    '&:hover': itemFocused
  };

  var link = { 'background': 'none', 'text-decoration': 'none' };
  rules.a = link;
  rules.a['&:link'] = link;
  rules.a['&:focus'] = itemFocused;
  rules.span = { 'display': 'none' };
  rules.itemActive = { 'background-color': vars.color.purplemid };

  menuMain.responsive = {
    largetablet: { span: { 'display': 'inherit' } }
  };

  /**
  * ## attach
  *
  * Attach the local styles, plus all responsives variants
  */

  menuMain.attach = function () {
    menuMain.sheet = utils.fn.attach(menuMain.rules, menuMain.responsive);
  };

  /**
  * ## detach
  *
  * Detaching already attached local styles, performance reasons
  */

  menuMain.detach = utils.fn.detach.bind(null, menuMain.sheet);

  return menuMain;

}).call(this);
