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
  var und = require('underscore');
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
  * It takes three arguments :
  *
  * - a `params` JS object
  * - a `callback` function
  * - a n optional `strFields` array, with fields of the `params` objects that
  *   must be not empty strings
  */

  common.addSetInit = function (params, callback, strFields) {
    if (!und.isObject(params)) {
      throw(new TypeError('parameters are mandatory for creation'));
    }
    if (!und.isFunction(callback)) {
      throw(new TypeError('callback must be a function'));
    }
    if (!und.isUndefined(params._id)) {
      if (!und.isString(params._id) || (und.isEmpty(params._id))) {
        throw new TypeError('_id, when defined, must be a string');
      }
    }
    if (strFields) {
      var isFS = function (s) { return (und.isString(s) && !und.isEmpty(s)); };
      und.forEach(strFields, function (s) {
        if (!isFS(params[s])) {
          throw new TypeError(s + ' must be a string');
        }
      });
    }
  };

  /**
  * ### checkExistence
  *
  * `checkExistence` is an asynchronous function that takes
  *
  * - a database `key`
  * - a `callback` function, returnning an *Error* or a boolean for existence
  */

  common.checkExistence = function (key, callback) {
    storage.db.get(key, function(err, res) {
      if (err) { return callback(err); }
      return callback(null, !!res);
    });
  };

  /**
  * ### checkMultiExist
  *
  * `checkMultiExist` is an asynchronous function that uses
  * `common.checkExistence` to check multiple keys.
  * It takes :
  *
  * - an array of `keys`
  * - a `callback` function, returning an Error or *null* and a boolean for
  *   existence.
  *
  * At the first not found record, callback will be called.
  * FIXME: TCO ?
  */

  common.checkMultiExist = function (keys, callback) {
    var done = function (err, res) {
      if (keys.length) {
        if (err) { return callback(err); }
        if (!res) { return callback(null, res); }
        common.checkExistence(keys.pop(), done);
      } else {
        return callback(null, res);
      }
    };
    done(null, true);
  };

  /**
  *  ### getDel
  *
  *  Model common reading
  *
  *  This function takes mandatory arguments
  *
  *  - a `del` boolean, to add a second step, removal, in the case of *true*
  *  - a `PREFIX`, used to compute real key
  *  - a `key`, the unique identifier of the object
  *  - a `callback` function, that returns an error if there is a problem or if
  *  the key is not found. In the other case, it returns *null* if `del` or
  *  *null* plus the model object.
  */

  common.getDel = function (del, PREFIX, key, callback) {
    if (!und.isString(key)) { throw new TypeError('key must be a string'); }
    if (!und.isFunction(callback)) {
      throw new TypeError('callback must be a function');
    }
    key = PREFIX + key;
    storage.db.get(key, function (err, obj) {
      if (err) { return callback(err); }
      if (und.isUndefined(obj)) {
        return callback(new Error('key is not found'));
      }
      if (!del) {
        return callback(null, obj);
      } else {
        storage.db.remove(key, function (err) {
          if (err) { return callback(err); }
          return callback(null, obj);
        });
      }
    });
  };

  return common;

}).call(this);
