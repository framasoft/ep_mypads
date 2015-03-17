/**
*  # Form helpers functions
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
*  This module contains common functions used with forms.
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');

  var form = {};

  /**
  * `initFields` takes
  *
  * - a controller instance
  * - an array of field `names`
  *
  * It creates local data states for values of these fields and booleans values
  * for validitation purpose.
  */

  form.initFields = function (c, names) {
    c.data = {};
    c.valid = {};
    names.forEach(function (n) {
      c.data[n] = m.prop();
      c.valid[n] = m.prop(true);
    });
  };

  /**
  * `handleField` function takes
  *
  * - a `c` controller instance, used to set validity and fix value
  * - and a DOM Event, which use HTML5 Validation API to ensure input is valid
  *   or not.
  */

  form.handleField = function (c, e) {
    var field = e.target.getAttribute('name');
    c.valid[field](e.target.checkValidity());
    c.data[field](e.target.value);
  };

  return form;
    
}).call(this);
