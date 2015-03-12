/**
*  # Tooltip style
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

  var tooltip = {};

  /**
  * ## rules
  *
  * Local rules for tooltips
  */

  tooltip.rules = {};
  var tooltipOn = {
    'position': 'absolute',
    'bottom': '1.5em',
    'right': '0.1em',
    'padding': '0.4em',
    'width': '17em',
    'color': vars.color.light,
    'background-color': vars.color.dark,
    'opacity': '0.9',
    'border': '0.1em solid ' + vars.color.light,
    'border-radius': '0.1em',
    'font-size': '0.8em',
    'content': 'attr(data-msg)'
  };
  tooltip.rules.global = {
    'position': 'relative',
    '&:hover:after': tooltipOn,
    '&:focus:after': tooltipOn
  };

  /**
  * ## attach
  *
  * Attach the local styles, plus all responsives variants
  */

  tooltip.attach = function () {
    tooltip.sheet = utils.fn.attach(tooltip.rules);
  };

  /**
  * ## detach
  *
  * Detaching already attached local styles, performance reasons
  */

  tooltip.detach = utils.fn.detach.bind(null, tooltip.sheet);

  return tooltip;

}).call(this);
