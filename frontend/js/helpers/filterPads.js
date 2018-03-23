/**
*  # FilterPads helpers functions
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
*  This module contains a function to filter pads in a folder
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');

  var filterPads = {};

  /**
  * `filter` will hide or show pads which name matches the filter
  */

  filterPads.filter = function(filter) {
    if (typeof filter === 'undefined' || filter === '') {
      var pads = document.querySelectorAll('li.list-group-item.group-pad-item');
      [].forEach.call(pads, function(element) {
        element.classList.remove('hidden');
      });
    } else {
      var pads = document.querySelectorAll('li.list-group-item.group-pad-item');
      [].forEach.call(pads, function(element) {
        if (element.getAttribute('data-padname').indexOf(filter) === -1) {
          element.classList.add('hidden');
        } else {
          element.classList.remove('hidden');
        }
      });
    }
  };

  return filterPads;

}).call(this);
