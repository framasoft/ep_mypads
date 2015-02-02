// All with closure like object and private data field
// .all() or .data() for all
// .get(x) and .set(x, val)

/**
* # Configuration Module
* 
* ## License
* 
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
* 
*   http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
* 
* ## Description
*
* This is the module for MyPads configuration.
*/

// Dependencies
var ld = require('lodash');

module.exports = (function() {
  'use strict';

  /**
  * The closure contains a private `data` field, holding real configuration.
  * Configuration data is taken from the database, applying defaults when
  * necessary.
  * TODO: retrieve config from database
  */

  var _data = ld.defaults({}, { passwordMin: 8, passwordMax: 30 });
 
  /**
  * `conf` object is a closure to interact with the whole configuration. It
  * will be exported.
  */

  var conf = {
    /** 
    * `get` is a function taking a mandatory `key` string argument, returning
    * the config property according to it.
    */
    get: function (key) {
      if (!ld.isString(key)) {
        throw(new TypeError('key must be a string'));
      }
      return _data[key];
    },
    /**
    * `set` is a function taking two mandatory arguments:
    *
    * - `key` string;
    * - `value`.
    *
    * `set` set the value for the config key.
    */
    set: function (key, value) {
      if (!ld.isString(key)) {
        throw(new TypeError('key must be a string'));
      }
      if (ld.isUndefined(value)) {
        throw(new TypeError('value is mandatory'));
      }
      _data[key] = value;
    },
    // `all` is the way to get the private data object, whole configuration
    all: function() { return _data; }
  };
  return conf;
}).call(this);


