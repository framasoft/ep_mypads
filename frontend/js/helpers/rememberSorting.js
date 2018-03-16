/**
*  # rememberSorting helpers functions
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
*  This module contains function to check if the user cache is populated
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');
  var conf = require('../configuration.js');
  var cookie = require('js-cookie');

  var rememberSorting = {};

  /*
   * Default values
   */
  currentValues = {
    wantPadByField: 'ctime',
    wantPadAsc: true,
    wantGroupByField: 'ctime',
    wantGroupAsc: true
  };

  /*
   * Get values from the cookie
   */
  rememberSorting.init = function() {
    var cookieValues = cookie.get('rememberSorting');
    if (cookieValues) {
      var values = JSON.parse(cookieValues);
      Object.keys(values).forEach(function(e) {
        currentValues[e] = values[e];
      });
    }
  }

  /*
   * Update the values and save them in the cookie
   */
  rememberSorting.updateValues = function(values) {
    Object.keys(values).forEach(function(e) {
      currentValues[e] = values[e];
    });
    cookie.set('rememberSorting', JSON.stringify(currentValues), { expires: 365, path: conf.URLS.RAWBASE });
  }

  /*
   * Expose values
   */
  rememberSorting.wantPadByField = function() {
    return currentValues.wantPadByField;
  }
  rememberSorting.wantPadAsc = function() {
    return currentValues.wantPadAsc;
  }
  rememberSorting.wantGroupByField = function() {
    return currentValues.wantGroupByField;
  }
  rememberSorting.wantGroupAsc = function() {
    return currentValues.wantGroupAsc;
  }

  rememberSorting.init();

  return rememberSorting;

}).call(this);
