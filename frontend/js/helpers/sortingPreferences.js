/**
*  # sortingPreferences helpers functions
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
*  This module contains function to check if the user cache is populated.
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');
  var conf = require('../configuration.js');
  var cookie = require('js-cookie');

  var sortingPreferences = {};

  /*
   * Default values
   */
  currentValues = {
    padByField: 'ctime',
    padAsc: true,
    groupByField: 'ctime',
    groupAsc: true
  };

  /*
   * Get values from the cookie
   */
  sortingPreferences.init = function() {
    var cookieValues = cookie.get('sortingPreferences');
    if (cookieValues) {
      try {
        var values = JSON.parse(cookieValues);
        for (var key in values) {
          currentValues[key] = values[key];
        }
      } catch(e) {
      }
    }
  }

  /*
   * Update the values and save them in the cookie
   */
  sortingPreferences.updateValues = function(values) {
    for (var key in values) {
      currentValues[key] = values[key];
    }
    cookie.set('sortingPreferences', JSON.stringify(currentValues), { expires: 365, path: conf.URLS.RAWBASE });
  }

  /*
   * Expose values
   */
  sortingPreferences.padByField = function() {
    return currentValues.padByField;
  }
  sortingPreferences.padAsc = function() {
    return currentValues.padAsc;
  }
  sortingPreferences.groupByField = function() {
    return currentValues.groupByField;
  }
  sortingPreferences.groupAsc = function() {
    return currentValues.groupAsc;
  }

  sortingPreferences.init();

  return sortingPreferences;

}).call(this);
