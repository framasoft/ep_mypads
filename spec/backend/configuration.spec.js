/**
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
*/

(function () {
  'use strict';

  var ld = require('lodash');
  var specCommon = require('./common.js');
  var conf = require('../../configuration.js');

  describe('configuration', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('init', function () {

      it('takes an optional callback as argument that must be a function',
        function () {
          expect(ld.partial(conf.init, 'string')).toThrow();
          expect(conf.init).not.toThrow();
        }
      );

      it('will call the callback, with an error or null when succeeded',
        function (done) {
          conf.init(function (err) {
            expect(err).toBeNull();
            conf.get('passwordMax', function (err, res) {
              expect(res).toBe(30);
              done();
            });
          });
        });
      });

    describe('get', function () {

      it('throws an error if key isn\'t a string and callback not a function',
        function () {
          expect(conf.get).toThrow();
          expect(ld.partial(conf.get, 1)).toThrow();
          expect(ld.partial(conf.get, 1, 1)).toThrow();
          expect(ld.partial(conf.get, 1, ld.noop)).toThrow();
          expect(ld.partial(conf.get, 'key')).toThrow();
          expect(ld.partial(conf.get, 'key', 2)).toThrow();
      });

      it('returns an Error if the field isn\'t defined', function (done) {
        conf.get('inexistent', function (err, res) {
          expect(ld.isError(err)).toBeTruthy();
          expect(res).toBeUndefined();
          done();
        });
      });

      it('returns the value of the field', function (done) {
        conf.get('passwordMin', function (err, res) {
          expect(res).toBe(8);
          done();
        });
      });
    });

    describe('set', function () {

      it('throws an error if key isn\'t a string, value is undefined, ' +
        'callback is not a function', function (done) {
          expect(conf.set).toThrow();
          expect(ld.partial(conf.set, 'key')).toThrow();
          expect(ld.partial(conf.set, 'key', 'value')).toThrow();
          expect(ld.partial(conf.set, 12, ld.noop)).toThrow();
          expect(ld.partial(conf.set, [], 12, ld.noop)).toThrow();
          expect(ld.partial(conf.set, 'key', 'notAFn')).toThrow();
          done();
      });

      it('sets a key for the conf with the given value', function (done) {
        conf.set('key', 'value', function () {
          conf.get('key', function (err, val) {
            expect(val).toBe('value');
            conf.set('@rray', [1, 2, 3], function () {
              conf.get('@rray', function (err, val) {
                expect(val.length).toBe(3);
                done();
              });
            });
          });
        });
      });
    });

    describe('del', function () {

      it('throws an error if key isn\'t a string and callback not a function',
        function () {
          expect(conf.del).toThrow();
          expect(ld.partial(conf.del, 1)).toThrow();
          expect(ld.partial(conf.del, 1, 1)).toThrow();
          expect(ld.partial(conf.del, 1, ld.noop)).toThrow();
          expect(ld.partial(conf.del, 'key')).toThrow();
          expect(ld.partial(conf.del, 'key', 2)).toThrow();
      });

      it('removes the item otherwise', function (done) {
        conf.set('forremove', 10, function () {
          conf.get('forremove', function (err, res) {
            expect(res).toBe(10);
            conf.del('forremove', function (err) {
              expect(err).toBeUndefined();
              conf.get('forremove', function (err, res) {
                expect(res).toBeUndefined();
                done();
              });
            });
          });
        });
      });
    });

    describe('all', function () {

      it('requires a mandatory function as callback', function () {
        expect(conf.all).toThrow();
        expect(ld.partial(conf.all, 'notAFn')).toThrow();
      });

      it('returns the configuration object', function (done) {
        conf.set('key', 10, function () {
          conf.set('power', 'max', function () {
            conf.all(function (err, settings) {
              expect(settings.key).toBe(10);
              expect(settings.power).toBe('max');
              done();
            });
          });
        });
      });
    });

    describe('public', function () {

      it('requires a mandatory function as callback', function () {
        expect(conf.public).toThrow();
        expect(ld.partial(conf.public, 'notAFn')).toThrow();
      });

      it('returns the filtered configuration object', function (done) {
        conf.set('power', 'max', function () {
          conf.public(function (err, settings) {
            expect(settings.power).toBeUndefined();
            expect(settings.title).toBeDefined();
            expect(settings.descr).toBeDefined();
            expect(settings.passwordMin).toBeDefined();
            expect(settings.passwordMax).toBeDefined();
            done();
          });
        });
      });
    });
  });

}).call(this);
