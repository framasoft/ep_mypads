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

  var DBPREFIX = storage.DBPREFIX.CONF;

  /**
  * `configuration` object is a closure to interact with the whole
  * config. It will be exported.
  */

  var configuration = {

    /**
    * The object contains a private `DEFAULTS` field, holding defaults
    * settings. Configuration data is taken from the database, applying
    * defaults when necessary, for example at the plugin initialization.
    */

    DEFAULTS: {
      title: 'MyPads',
      passwordMin: 8,
      passwordMax: 30,
      languages: { en: 'English', fr: 'Français' },
      defaultLanguage: 'en',
      smtp: true
    },

    /**
    * cache object` stored current configuration for faster access than
    * database
    */

    cache: {},

    /**
    * `init` is called when mypads plugin is initialized. It fixes the default
    * data for the configuration into the database.
    * It takes an optional `callback` function used after `db.set` abstraction
    * to return an eventual *error*.
    */

    init: function (callback) {
      callback = callback || function () {};
      if (!ld.isFunction(callback)) {
        throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
      }
      configuration.cache = ld.clone(configuration.DEFAULTS, true);
      // Would like to use doBulk but not supported for all *ueberDB* backends
      storage.fn.setKeys(ld.transform(configuration.DEFAULTS,
        function (memo, val, key) { memo[DBPREFIX + key] = val; }), callback);
    },

    /**
    * `get` is an synchronous function taking : a mandatory `key` string
    * argument.  It throws *Error* if error, returns *undefined* if key does
    * not exist and the result otherwise.
    */

    get: function (key) {
      if (!ld.isString(key)) {
        throw new TypeError('BACKEND.ERROR.TYPE.KEY_STR');
      }
      return configuration.cache[key];
    },

    /**
    * `set` is an asynchronous function taking two mandatory arguments:
    *
    * - `key` string;
    * - `value`.
    * - `callback` function argument returning *Error* if error, *null*
    *   otherwise
    *
    * `set` sets the `value` for the configuration `key` and takes care of
    * `cache`.
    */

    set: function (key, value, callback) {
      if (!ld.isString(key)) {
        throw new TypeError('BACKEND.ERROR.TYPE.KEY_STR');
      }
      if (ld.isUndefined(value)) {
        throw new TypeError('BACKEND.ERROR.TYPE.VALUE_REQUIRED');
      }
      if (!ld.isFunction(callback)) {
        throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
      }
      db.set(DBPREFIX + key, value, function (err) {
        if (err) { return callback(err); }
        configuration.cache[key] = value;
        callback();
      });
    },

    /**
    * `del` is an asynchronous function that removes a configuration option.
    * It takes two mandatory arguments :
    *
    * - a `key` string,
    * - a `callback` function argument returning *Error* if error
    *
    * It takes care of config `cache`.
    */

    del: function (key, callback) {
      if (!ld.isString(key)) {
        throw new TypeError('BACKEND.ERROR.TYPE.KEY_STR');
      }
      if (!ld.isFunction(callback)) {
        throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
      }
      db.remove(DBPREFIX + key, function (err) {
        if (err) { return callback(err); }
        delete configuration.cache[key];
        callback();
      });
    },

    /**
    * `all` is a synchronous function that returns the whole configuration
    * from `cache`. Fields / keys are unprefixed.
    */

    all: function () { return configuration.cache; },

    /**
    * `public` is a synchronous function that returns the whole publicly
    * available configuration from `cache`. Fields / keys are unprefixed.
    */

    public: function () {
      var all = configuration.all();
      return ld.pick(all, 'title', 'passwordMin', 'passwordMax', 'languages');
    }
  };

  /**
  * Classic bootstrap : get configuration values from database to cache
  */

  db.findKeys(DBPREFIX + '*', null, function (err, keys) {
    if (err) { return console.error(err); }
    storage.fn.getKeys(keys, function (err, results) {
      if (err) { return console.error(err); }
      configuration.cache = ld.transform(results, function (memo, val, key) {
        memo[key.replace(DBPREFIX, '')] = val;
      });
    });
  });

  return configuration;

}).call(this);


