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

module.exports = (function() {
  'use strict';

  // Dependencies
  var ld = require('lodash');
  var storage = require('./storage.js');
  var db = storage.db;

  /**
  * The closure contains a private `DEFAULTS` field, holding defaults settings.
  * Configuration data is taken from the database, applying defaults when
  * necessary, for example at the plugin initialization.
  */

  var DEFAULTS = {
    title: 'MyPads',
    passwordMin: 8,
    passwordMax: 30,
    languages: ['en', 'fr']
  };
  var DBPREFIX = storage.DBPREFIX.CONF;

  /**
  * `configuration` object is a closure to interact with the whole
  * config. It will be exported.
  */

  var configuration = {

    /**
    * `init` is called when mypads plugin is initialized. It fixes the default
    * data for the configuration into the database.
    * It takes an optional `callback` function used after `db.set` abstraction
    * to return an eventual *error*.
    */

    init: function (callback) {
      callback = callback || function () {};
      if (!ld.isFunction(callback)) {
        throw new TypeError('callback must be a function');
      }
      // Would like to use doBulk but not supported for all *ueberDB* backends
      storage.fn.setKeys(ld.transform(DEFAULTS, function (memo, val, key) {
        memo[DBPREFIX + key] = val; }), callback);
    },

    /**
    * `get` is an asynchronous function taking :
    *
    * - a mandatory `key` string argument,
    * - a mandatory `callback` function argument returning *Error* if error,
    *   *null* otherwise and the result
    */

    get: function (key, callback) {
      if (!ld.isString(key)) {
        throw new TypeError('key must be a string');
      }
      if (!ld.isFunction(callback)) {
        throw new TypeError('callback must be a function');
      }
      db.get(DBPREFIX + key, function (err, res) {
        if (err) { return callback(err); }
        if (ld.isUndefined(res)) {
          return callback(new Error('Key doesn\'t exist'));
        }
        callback(null, res);
      });
    },

    /**
    * `set` is an asynchronous function taking two mandatory arguments:
    *
    * - `key` string;
    * - `value`.
    * - `callback` function argument returning *Error* if error, *null*
    *   otherwise
    *
    * `set` sets the `value` for the configuration `key`.
    */

    set: function (key, value, callback) {
      if (!ld.isString(key)) {
        throw new TypeError('key must be a string');
      }
      if (ld.isUndefined(value)) {
        throw new TypeError('value is mandatory');
      }
      if (!ld.isFunction(callback)) {
        throw new TypeError('callback must be a function');
      }
      db.set(DBPREFIX + key, value, callback);
    },

    /**
    * `del` is an asynchronous function that removes a configuration option.
    * It takes two mandatory arguments :
    *
    * - a `key` string,
    * - a `callback` function argument returning *Error* if error
    */

    del: function (key, callback) {
      if (!ld.isString(key)) {
        throw new TypeError('key must be a string');
      }
      if (!ld.isFunction(callback)) {
        throw new TypeError('callback must be a function');
      }
      db.remove(DBPREFIX + key, callback);
    },

    /**
    * `all` is an asynchronous function that returns the whole configuration
    * from database. Fields / keys are unprefixed. It needs a `callback`
    * function returning *Error* if error, *null* otherwise and the result
    * object.
    */

    all: function (callback) {
      if (!ld.isFunction(callback)) {
        throw new TypeError('callback must be a function');
      }
      db.findKeys(DBPREFIX + '*', null, function (err, keys) {
        if (err) { return callback(err); }
        storage.fn.getKeys(keys, function (err, results) {
          if (err) { return callback(err); }
          results = ld.transform(results, function (memo, val, key) {
            memo[key.replace(DBPREFIX, '')] = val;
          });
          callback(null, results);
        });
      });
    },

    /**
    * `public` is an asynchronous function that returns the whole publicly
    * available configuration from database. Fields / keys are unprefixed. It
    * needs a `callback` function returning *Error* if error, *null* and the
    * result object otherwise.
    */

    public: function (callback) {
      if (!ld.isFunction(callback)) {
        throw new TypeError('callback must be a function');
      }
      configuration.all(function (err, all) {
        if (err) { return callback(err); }
        var filtered = ld.pick(all, 'title', 'passwordMin', 'passwordMax',
          'languages');
        return callback(null, filtered);
      });
    }
  };

  return configuration;

}).call(this);


