/**
*  # Notification style
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

  var notif = {};

  /**
  * ## rules
  *
  * Local rules for notifs
  */

  notif.rules = {};
  notif.rules.global = {
    'z-index': 99,
    'cursor': 'pointer'
  };
  notif.rules.section = {
    'width': '80%',
    'position': 'fixed',
    'right': '1%',
    'bottom': '2%'
  };
  notif.rules.div = {
    'margin': '0.3em',
    'padding': '0.8em',
    'border': '0.1em solid',
    'border-radius': '0.3em',
    'background-color': vars.color.lightgrey,
    'animation': '1s fadein',
    '-moz-animation': '1s fadein',
    '-webkit-animation': '1s fadein'
  };
  notif.rules.success = { 'background-color': vars.color.green };
  notif.rules.info = { 'background-color': vars.color.bluelight };
  notif.rules.warning = { 'background-color': vars.color.yellow };
  notif.rules.error = { 'background-color': vars.color.redlight };

  notif.rules.header = {
    'color': 'inherit',
    'background-color': 'inherit',
    'font-weight': 'bold',
    'width': '95%'
  };
  notif.rules.p = { 'font-size': '0.8em' };
  notif.rules.iclose = { 'width': '5%' };

  notif.responsive = {
    tablet: {
      section: { 'width': '40%' }
    },
    desktop: {
      section: { 'width': '25%' }
    }
  };

  /**
  * ## attach
  *
  * Attach the local styles, plus all responsives variants
  */

  notif.attach = function () {
    notif.sheet = utils.fn.attach(notif.rules, notif.responsive);
  };

  return notif;

}).call(this);
