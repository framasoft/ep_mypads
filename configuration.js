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
//var db = require('ep_etherpad-lite/node/db/DB').db;
var db = require('./db.js');

module.exports = (function() {
  'use strict';

  /**
  * The closure contains a private `defaults` field, holding defaults settings.
  * Configuration data is taken from the database, applying defaults when
  * necessary, for example at the plugin initialization.
  */

  var defaults = { passwordMin: 8, passwordMax: 30 };
  var KEY = 'mypads:configuration';
 
  /**
  * `configuration` object is a closure to interact with the whole
  * config. It will be exported.
  */

  var configuration = {
    /**
    * `init` is called when mypads plugin is initialized. It fixes the default
    * data for the configuration into the database.
    * It takes an optional `callback` function used after db.set abstraction to
    * return an eventual error.
    */
    init: function (callback) {
      if (callback && !ld.isFunction(callback)) {
        throw(new TypeError('callback must be a function'));
      }
      db.set(KEY, JSON.stringify(defaults), callback);
    },
    /** 
    * `get` is an asynchronous function taking :
    * - a mandatory `key` string argument,
    * - a mandatory `callback` function argument returning error if error, null
    *   otherwise and the result
    *   TODO: handle non existent key better
    */
    get: function (key, callback) {
      if (!ld.isString(key)) {
        throw(new TypeError('key must be a string'));
      }
      if (!ld.isFunction(callback)) {
        throw(new TypeError('callback must be a function'));
      }
      configuration.all(function (err, res) {
        if (err) { callback(err); }
        callback(null, res[key]);
      });
    },
    /**
    * `set` is an asynchronous function taking two mandatory arguments:
    *
    * - `key` string;
    * - `value`.
    * - `callback` function argument returning error if error, null otherwise
    *
    * `set` sets the value for the configuration key.
    */
    set: function (key, value, callback) {
      if (!ld.isString(key)) {
        throw(new TypeError('key must be a string'));
      }
      if (ld.isUndefined(value)) {
        throw(new TypeError('value is mandatory'));
      }
      if (!ld.isFunction(callback)) {
        throw(new TypeError('callback must be a function'));
      }
      configuration.all(function (err, res) {
        if (err) { callback(err); }
        res[key] = value;
        db.set(KEY, JSON.stringify(res), callback);
      });
    },
    /**
    * `remove` is an asynchronous function that removes a configuration option.
    * It takes two mandatory arguments :
    * - a `key` string,
    * - a `callback` function argument returning error if error
    *
    *   TODO: handle non existent key better
    */
    remove: function (key, callback) {
      if (!ld.isString(key)) {
        throw(new TypeError('key must be a string'));
      }
      if (!ld.isFunction(callback)) {
        throw(new TypeError('callback must be a function'));
      }
      configuration.all(function (err, res) {
        if (res) {
          if (err) { callback(err); }
          if (res[key]) {
            delete res[key];
            db.set(KEY, JSON.stringify(res), callback);
          } else {
            callback('missing key');
          }
        }
      });
    },
    /**
    * `all` is an asynchronous function that returns the whole configuration,
    * from database. It needs a `callback` function returning error if error,
    * null otherwise and the result.
    */
    all: function(callback) { 
      if (!ld.isFunction(callback)) {
        throw(new TypeError('callback must be a function'));
      }
      db.get(KEY, function (err, res) {
        if (err) { callback(err); }
        callback(null, JSON.parse(res));
      });
    }
  };
  return configuration;
}).call(this);


