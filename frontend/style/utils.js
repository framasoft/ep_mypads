/**
*  # CSS Style utilities
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
  var ld = require('lodash');
  var jss = require('jss');
  var vars = require('./vars.js');

  var utils = {};

  /**
  * ## fn
  *
  * Public functions to help working with styles and JSS.
  */

  utils.fn = {};

  /**
  * ## attach
  *
  * Function to attach the local styles, plus all responsives variants
  * Takes as arguments :
  *
  * - `rules` object of defaults JSS rules to attach
  * - optional `responsiveRules` object of special JSS rules, according to
  *   `vars.media.breaks`
  *
  * It creates and return a `sheet` object, where *main* and responsive
  * sheets are stored. We use global non named sheets for responsivemess,
  * because of a temporary limitation of JSS.
  */

  utils.fn.attach = function (rules, responsiveRules) {
    var sheet = {};
    sheet.main = jss.createStyleSheet(rules).attach();
    responsiveRules = responsiveRules || {};
    ld.forOwn(responsiveRules, function (rls, brk) {
      rls = ld.reduce(rls, function (memo, v, k) {
        memo['.' + sheet.main.classes[k]] = v;
        return memo;
      }, {});
      sheet[brk] = jss.createStyleSheet(rls, {
        named: false,
        media: vars.media[brk]
      }).attach();
    });
    return sheet;
  };

  /**
  * ## detach
  *
  * Detach already attached local styles, for performance considerations
  */

  utils.fn.detach = function (sheet) {
    ld.map(sheet, function (m) { m.detach(); });
  };

  return utils;

}).call(this);
