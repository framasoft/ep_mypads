/**
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

(function () {
  'use strict';
  var ld = require('lodash');
  var db = require('../../../storage').db;
  var specCommon = require('../common.js');
  var common = require('../../../model/common.js');

  describe('common', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('addSetInit', function () {
      var addSetI = common.addSetInit;

      it('should throw TypeError if params is not an object or if callback ' +
        'is not a function', function () {
          expect(addSetI).toThrow();
          expect(ld.partial(addSetI, 'notAnObject')).toThrow();
          expect(ld.partial(addSetI, 123, ld.noop)).toThrow();
          expect(ld.partial(addSetI, { empty: false })).toThrow();
          expect(ld.partial(addSetI, { empty: false }, 'notAFunction'))
            .toThrow();
      });

      it('should retuns nothing otherwise', function () {
        expect(ld.partial(addSetI, { empty: false }, ld.noop)).not.toThrow();
        expect(addSetI({ empty: false }, ld.noop)).toBeUndefined();
      });
    });

    describe('checkExistence', function () {
      var key = 'test:john';

      beforeAll(function (done) { db.set(key, 'exists', done); });
      afterAll(function (done) { db.remove(key, done); });

      it('should return null and true if the key exists', function (done) {
        common.checkExistence(key, function (err, res) {
          expect(err).toBeNull();
          expect(res).toBeTruthy();
          done();
        });
      });

      it('should return null and false if the key do not exist',
        function (done) {
          common.checkExistence('test:bob', function (err, res) {
            expect(err).toBeNull();
            expect(res).toBeFalsy();
            done();
          }
        );
      });
    });

    describe('getDel', function () {
      var key = 'test:john';

      beforeAll(function (done) { db.set(key, 'exists', done); });
      afterAll(function (done) { db.remove(key, done); });

      it('throws error if arguments are not given correctly', function () {
        expect(common.getDel).toThrow();
        expect(ld.partial(common.getDel, 123)).toThrow();
        expect(ld.partial(common.getDel, false, 'prefix')).toThrow();
        expect(ld.partial(common.getDel, false, 'prefix')).toThrow();
        expect(ld.partial(common.getDel, true, 'prefix', {})).toThrow();
        expect(ld.partial(common.getDel, true, 'prefix', 'key', {})).toThrow();
        expect(ld.partial(common.getDel, true, 'prefix', false, ld.noop))
          .toThrow();
      });

      it('should return an error through the callback if the key is not found',
        function (done) {
          common.getDel(false, 'prefix:', 'key', function (err, res) {
            expect(ld.isError(err)).toBeTruthy();
            expect(res).toBeUndefined();
            done();
          });
        }
      );

      it('should return null and the object otherwise in edit case (not del)',
        function (done) {
          common.getDel(false, 'test:', 'john', function (err, res) {
            expect(err).toBeNull();
            expect(res).toBe('exists');
            done();
          }
        );
      });

      it('should return null in successfull del case',
        function (done) {
          common.getDel(true, 'test:', 'john', function (err, res) {
            expect(err).toBeNull();
            expect(res).toBeUndefined();
            done();
          }
        );
      });

    });

  });
}).call(this);
