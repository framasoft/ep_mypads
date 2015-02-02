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

  var assert = require('assert');
  var ld = require('lodash');
  var conf = require('../../../configuration.js');

  describe('configuration', function () {
    'use strict';
    it('comes with defaults', function (done) {
      conf.get('passwordMax', function (err, res) {
        assert.equal(res, 30);
        done();
      });
    });

    describe('init', function () {
      it('takes an optional callback as argument that must be a function',
        function () {
          assert.throws(ld.partial(conf.init, 'string'), TypeError);
          assert.doesNotThrow(conf.init);
        }
      );
        it('will call the callback, with an error or null when succeeded',
          function (done) {
            conf.init(function (err) {
              assert.equal(err, null);
              done();
            });
          }
        );
    });

    describe('get', function () {
      it('throws an error if key isn\'t a string and callback not a function',
        function () {
          assert.throws(conf.get, TypeError);
          assert.throws(ld.partial(conf.get, 1), TypeError);
          assert.throws(ld.partial(conf.get, 1, 1), TypeError);
          assert.throws(ld.partial(conf.get, 1, ld.noop), TypeError);
          assert.throws(ld.partial(conf.get, 'key'), TypeError);
          assert.throws(ld.partial(conf.get, 'key', 2), TypeError);
      });
      it('returns the value of the field', function (done) {
        conf.get('passwordMin', function (err, res) {
          assert.equal(res, 8);
          conf.get('inexistent', function (err, res2) {
            assert.equal(res2, undefined);
            done();
          });
        });
      });
    });

    describe('set', function () {
      it('throws an error if key isn\'t a string, value is undefined, '
        + 'callback is not a function', function (done) {
          assert.throws(conf.set, TypeError);
          assert.throws(ld.partial(conf.set, 'key'), TypeError);
          assert.throws(ld.partial(conf.set, 'key', 'value'), TypeError);
          assert.throws(ld.partial(conf.set, 12, ld.noop), TypeError);
          assert.throws(ld.partial(conf.set, [], 12, ld.noop), TypeError);
          assert.throws(ld.partial(conf.set, 'key', 'notAFn'), TypeError);
          done();
      });
      it('sets a key for the conf with the given value', function (done) {
        conf.set('key', 'value', function (err) {
          conf.get('key', function (err, val) {
            assert.equal(val, 'value');
            conf.set('array', [1, 2, 3], function (err) {
              conf.get('array', function (err, val) {
                assert.equal(val.length, 3);
                done();
              });
            });
          });
        });
      });
    });

    describe('all', function () {
      it('requires a mandatory function as callback', function () {
        assert.throws(conf.all, TypeError);
        assert.throws(ld.partial(conf.all, 'notAFn'), TypeError);
      });
      it('returns the configuration object', function (done) {
        conf.set('key', 10, function () {
          conf.set('power', 'max', function () {
            conf.all(function (err, settings) {
              assert.equal(settings.key, 10);
              assert.equal(settings.power, 'max');
              done();
            });
          });
        });
      });
    });
  });

}).call(this);
