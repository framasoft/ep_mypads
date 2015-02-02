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
  var partial = require('lodash').partial;
  var conf = require('../../../configuration.js');

  describe('configuration', function () {
    'use strict';

    it('comes with defaults', function () {
      assert.equal(conf.get('passwordMin'), 8);
      assert.equal(conf.get('passwordMax'), 30);
    });

    describe('get', function () {

      it('throws an error if key isn\'t a string', function () {
        assert.throws(conf.get, TypeError);
        assert.throws(partial(conf.get, 12), TypeError);
        assert.throws(partial(conf.get, {}), TypeError);
      });

      it('returns the value of the field', function () {
        assert.equal(conf.get('passwordMin'), 8);
        assert.equal(conf.get('inexistent'), undefined);
      });
    });

    describe('set', function () {

      it('throws an error if key isn\'t a string and value is undefined',
        function () {
          assert.throws(partial(conf.set, 12), TypeError);
          assert.throws(partial(conf.set, [], 12), TypeError);
          assert.throws(partial(conf.set, 'key'), TypeError);
      });

      it('sets a key for the conf object with the given value', function () {
        conf.set('key', 'value');
        conf.set('array', [1, 2, 3]);
        assert.equal(conf.get('key'), 'value');
        assert.equal(conf.get('array').length, 3);
      });
    });

    describe('all', function () {

      it('returns the configuration object', function () {
        conf.set('key', 10);
        conf.set('power', 'max');
        assert.equal(conf.all().key, 10);
        assert.equal(conf.all().power, 'max');
      });
    });
  });

}).call(this);
