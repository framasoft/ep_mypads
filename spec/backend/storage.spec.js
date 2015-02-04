/**
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

(function () {
  'use strict';

  var ld = require('lodash');
  var storage = require('../../storage.js');
  var specCommon = require('./common.js');
  var conf = require('../../configuration.js');

  describe('storage', function () {
    beforeAll(specCommon._reInitDatabase);
    afterAll(specCommon._reInitDatabase);

    describe('Private functions fns', function () {

      describe('getKeys', function () {

        beforeAll(function (done) {
          var db = storage.db;
          db.set('key1', 'value1', function (err) {
            db.set('key2', 'value2', function (err) {
              done();
            });
          });
        });

        it('should return an undefined value for non existent keys',
          function (done) {
            storage.fns.getKeys(['key1', 'inexistent'], function (err, results) {
              expect(results.inexistent).toBeUndefined();
              done();
            });
          }
        );

        it('should return the result for one key or more', function (done) {
          storage.fns.getKeys(['key1'], function (err, results) {
            expect(err).toBeNull();
            expect(results.key1).toBe('value1');
            storage.fns.getKeys(['key2', 'key1'], function (err, results) {
              expect(err).toBeNull();
              expect(ld.isObject(results)).toBeTruthy();
              expect(results.key1).toBe('value1');
              expect(results.key2).toBe('value2');
              done();
            });
          });
        });
      });
    });
  });
}).call(this);
