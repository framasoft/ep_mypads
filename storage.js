/**
*  # Database Module
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
*  This module consists only on a wrapper around etherpad database.
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var ld = require('lodash');

  var storage = {};
  try {
    // Normal case : when installed as a plugin
    storage.db = require('ep_etherpad-lite/node/db/DB').db;
  }
  catch (e) {
    /**
    * Testing case : we need to mock the database connection, using ueberDB and
    * coherent default configuration with eptherpad-lite one.
    */
    var ueberDB = require('ueberDB');
    storage.db = new ueberDB.database('dirty', { filename: './test.db' });
    storage.db.init(function (err) { if (err) { console.log(err); } });
  }

  /**
  * `init` function for in memory secondary indexes.
  * At the moment only user / logins.
  */

  storage.init = function (callback) {
    var user = require('./model/user.js');
    user.init(callback);
  };

  /**
  * ## Internal functions `fn`
  */

  storage.fn = {};

  /**
  * `getKeys` is a function for multiple asynchronous gets, taking :
  s
  * - a `keys` array, wich contains a list a keys to retrieve
  * - a `callback` function, called if error or when finished with null and the
  *   `results` object composed of keys and values
  * FIXME: TCO ?
  */

  storage.fn.getKeys = function (keys, callback) {
    var results = {};
    var get = function (k) {
      storage.db.get(k, function (err, res) {
        if (err) { return callback(err); }
        results[k] = res;
        done();
      });
    };
    var done = function () {
      if (keys.length) {
        get(keys.pop());
      } else {
        return callback(null, results);
      }
    };
    done();
  };

  /**
  * `setKeys` is a function for multiple asynchronous sets, taking :
  s
  * - a `kv` object, wich contains a list a keys and values to set
  * - a `callback` function, called if error or when finished with null
  * FIXME: TCO ?
  */
  storage.fn.setKeys = function (kv, callback) {
    var pairs = ld.pairs(kv);
    var set = function (k, v) { storage.db.set(k, v, done); };
    var done = function (err) {
      if (err) { return callback(err); }
      if (pairs.length) {
        var pair = pairs.pop();
        set(pair[0], pair[1]);
      } else {
        return callback(null);
      }
    };
    done();
  };

  return storage;
}).call(this);
