/**
*  # Login form style
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
  var utils = require('./utils.js');
  var vars = require('./vars.js');

  var login = {};

  /**
  * ## rules
  *
  * Local rules for notifs
  */

  login.rules = {};
  login.rules.section = {
    'width': '100%',
    'margin': '0 auto 0 auto'
  };
  login.rules.label = { 'width': '100%' };
  login.rules.input = { 'width': '95%' };
  login.rules.i = { 'width': '5%' };
  login.rules.inputSubmit = {
    'text-transform': 'uppercase',
    'margin-left': '50%',
    'width': '50%'
  };
  login.rules.h2 = { 'color': vars.color.yellowdarkest };
  login.rules.a = {
    'color': vars.color.dark,
    'background': 'none',
    'font-size': 'smaller'
  };
  login.rules.form = {
    'background': vars.color.yellowlight,
    'border': '0.1em solid' + vars.color.yellow,
    'border-radius': '0.2em',
    'padding': '1em'
  };
  login.rules.legend = {
    'font': '1.4em bold',
    'padding-bottom': '0.6em'
  };

  login.rules.sectionAside = { 'margin': '1em' };
  login.rules.h2Aside = {
    'text-align': 'center',
    'color': vars.color.purpledarkest
  };
  login.rules.articleAside = {
    'background': vars.color.purplelight,
    'border': '0.15em solid' + vars.color.purplemidlight,
    'border-radius': '0.5em',
    'padding': '1em'
  };

  login.responsive = {
    tablet: {
      section: { 'width': '80%' },
      inputSubmit: { 'margin-left': '80%', 'width': '20%' }
    },
    desktop: {
      section: { 'width': '40em' },
      label: { 'width': '50%' },
      input: { 'width': '45%' }
    }
  };

  /**
  * ## attach
  *
  * Attach the local styles, plus all responsives variants
  */

  login.attach = function () {
    login.sheet = utils.fn.attach(login.rules, login.responsive);
  };

  /**
  * ## detach
  *
  * Detaching already attached local styles, performance reasons
  */

  login.detach = utils.fn.detach.bind(null, login.sheet);

  return login;

}).call(this);
