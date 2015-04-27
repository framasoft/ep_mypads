/**
*  # User style
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
*  This module contains common styles for `user`, `subscribe` and `profile
*  modules.`
*/

module.exports = (function () {

  // Dependencies
  var utils = require('../utils.js');
  var vars = require('../vars.js');

  var user = {};

  /**
  * ## rules
  *
  * Local rules for user
  */

  user.rules = {};
  user.rules.section = {
    'width': '100%',
    'margin': '0 auto 0 auto'
  };
  user.rules.label = { 'width': '100%' };
  user.rules.input = { 'width': '95%' };
  user.rules.i = { 'width': '5%' };
  user.rules.inputSubmit = {
    'text-transform': 'uppercase',
    'margin-left': '50%',
    'width': '50%'
  };
  user.rules.h2 = { 'color': vars.color.yellowdarkest };
  user.rules.a = {
    'color': vars.color.dark,
    'background': 'none',
    'font-size': 'smaller'
  };
  user.rules.form = {
    'background': vars.color.yellowlight,
    'border': '0.1em solid' + vars.color.yellow,
    'border-radius': '0.2em',
    'padding': '1em'
  };
  user.rules.legend = {
    'font': '1.4em bold',
    'padding-bottom': '0.6em'
  };
  user.rules.legendopt = {
    'font': '1.3em bold',
    'padding-bottom': '0.4em',
    'color': vars.color.grey,
    'border-color': vars.color.grey
  };

  user.rules.sectionAside = { 'margin': '1em' };
  user.rules.h2Aside = {
    'text-align': 'center',
    'color': vars.color.purpledarkest
  };
  user.rules.articleAside = {
    'background': vars.color.purplelight,
    'border': '0.15em solid' + vars.color.purplemidlight,
    'border-radius': '0.5em',
    'padding': '1em'
  };

  user.responsive = {
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

  user.attach = function () {
    user.sheet = utils.fn.attach(user.rules, user.responsive);
  };

  return user;

}).call(this);
