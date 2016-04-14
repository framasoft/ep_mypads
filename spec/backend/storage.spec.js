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

  describe('storage', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('Internal functions fn', function () {

      describe('getKeys', function () {

        beforeAll(function (done) {
          var db = storage.db;
          db.set('key1', 'value1', function () {
            db.set('key2', 'value2', function () {
              db.set('convictedKey', 'tmp', function () { done(); });
            });
          });
        });

        it('should return an undefined value for non existent keys',
          function (done) {
            storage.fn.getKeys(['key1', 'inexistent'], function (err, res) {
              expect(res.inexistent).toBeUndefined();
              done();
            });
          }
        );

        it('should return an undefined value for removed keys',
           function (done) {
             storage.db.remove('convictedKey', function () {
               storage.fn.getKeys(
                 ['key1', 'convictedKey'],
                 function (err, res) {
                   expect(res.convictedKey).toBeUndefined();
                   done();
                 }
               );
             });
           }
          );

        it('should return the result for one key or more', function (done) {
          storage.fn.getKeys(['key1'], function (err, results) {
            expect(err).toBeNull();
            expect(results.key1).toBe('value1');
            storage.fn.getKeys(['key2', 'key1'], function (err, results) {
              expect(err).toBeNull();
              expect(ld.isObject(results)).toBeTruthy();
              expect(results.key1).toBe('value1');
              expect(results.key2).toBe('value2');
              done();
            });
          });
        });
      });

      describe('delKeys', function () {

        beforeAll(function (done) {
          var db = storage.db;
          db.set('key1', 'value1', function () {
            db.set('key2', 'value2', function () {
              db.set('key3', 'value3', function () {
                done();
              });
            });
          });
        });

        it('should removes every given keys, even if thet don`t exist',
          function (done) {
            storage.fn.delKeys(['key1'], function (err, res) {
              expect(err).toBeNull();
              expect(res).toBeTruthy();
              storage.fn.delKeys(['key2', 'key3', 'key4'],
                function (err, res) {
                  expect(err).toBeNull();
                  expect(res).toBeTruthy();
                  done();
                }
              );
            });
          }
        );
      });

      describe('setKeys', function () {

        beforeAll(function (done) {
          var db = storage.db;
          db.set('existent', [1, 2, 3], function () { done(); });
        });

        it('should put the keys and their values into the database',
          function (done) {
            var kv = { 'JS': 'JavaScript', 'PL': 'Perl', 'existent': [2, 4] };
            storage.fn.setKeys(kv, function () {
              storage.fn.getKeys(ld.keys(kv), function (err, results) {
                expect(results.JS).toBe('JavaScript');
                expect(results.PL).toBe('Perl');
                expect(ld.isArray(results.existent)).toBeTruthy();
                expect(results.existent[1]).toBe(4);
                done();
              });
            });
          }
        );
      });
    });
  });
}).call(this);
