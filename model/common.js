/**
*  # Common for Models
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
*/

module.exports = (function() {
  'use strict';

  // Dependencies
  var ld = require('lodash');
  var storage = require('../storage.js');

  /**
  * ## Description
  *
  * This module regroups shared functions for several models.
  */

  var common = {};

  /**
  * ### addSetInit
  *
  * This function throws errors for common parameters missing or mistyped.
  * It takes two mandatory arguments :
  *
  * - a `params` JS object
  * - a `callback` function
  */

  common.addSetInit = function (params, callback) {
    if (!ld.isObject(params)) {
      throw(new TypeError('parameters are mandatory for creation'));
    }
    if (!ld.isFunction(callback)) {
      throw(new TypeError('callback must be a function'));
    }
  };

  /**
  * ### checkExistence
  *
  * `checkExistence` is an asynchronous function that takes
  *
  * - a database `key`
  * - a `callback` function, returnning an Error or a boolean for existence
  */

  common.checkExistence = function (key, callback) {
    storage.db.get(key, function(err, res) {
      if (err) { return callback(err); }
      return callback(null, !!res);
    });
  };

  return common;

}).call(this);
