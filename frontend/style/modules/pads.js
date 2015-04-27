/**
*  # Pads style
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
*  This module contains styles for main module : `pads`.
*/

module.exports = (function () {

  // Dependencies
  var utils = require('../utils.js');
  var vars = require('../vars.js');

  var pads = {};

  /**
  * ## rules
  *
  * Local rules
  */

  pads.rules = {};
  pads.rules.section = {};
  pads.rules.h2 = {};
  pads.rules.a = {};
  pads.rules.sectionAside = {};

  pads.responsive = {};

  /**
  * ## attach
  *
  * Attach the local styles, plus all responsives variants
  */

  pads.attach = function () {
    pads.sheet = utils.fn.attach(pads.rules, pads.responsive);
  };

  return pads;
}).call(this);
