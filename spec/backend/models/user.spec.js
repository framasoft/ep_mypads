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
  var user = require('../../../models/user.js');
  var db = require('../../../db.js');
  var conf = require('../../../configuration.js');

  describe('user', function () {
    beforeAll(function (done) { conf.init(done); });

    describe('creation', function () {

      it('should return a TypeError and a message if either login or password' +
        ' aren\'t given; nor callback function', function () {
        expect(user.add).toThrow();
        expect(ld.partial(user.add, { another: 'object' })).toThrow();
        expect(ld.partial(user.add, { login: 'Johnny' })).toThrow();
        expect(ld.partial(user.add, { password: 'secret' })).toThrow();
        expect(ld.partial(user.add, { login: 'john', password: 'secret' })).toThrow();
      });

      it('should return an Error to the callback if password size is not' +
        ' appropriate', function (done) {
        user.add({ login: 'bob', password: '1'}, function (err, res) {
          expect(ld.isError(err)).toBeTruthy();
          done();
        });
      });

      it('should accept any creation if login & password are fixed', function () {
        var u;
        expect(function () {
          u = user.add({ login: 'parker', password: 'lovesKubiak' });
        }).not.toThrow();
        expect(u.login).toBe('parker');
        expect(u.password).toBeDefined();
      });
    });
  });

  describe('user helpers', function() {

    describe('_getKeys', function () {

      beforeAll(function (done) {
        var db = require('../../../db.js');
        db.set('key1', 'value1', function (err) {
          db.set('key2', 'value2', function (err) {
            done();
          });
        });
      });

      it('should returns the result for one key or more', function (done) {
        user.helpers._getKeys({ keys: ['key1'] }, function (err, params) {
          expect(err).toBeNull();
          expect(params.key1).toBe('value1');
          user.helpers._getKeys({ keys: ['key2', 'key1'] },
            function (err, params) {
              expect(err).toBeNull();
              expect(ld.isArray(params.keys)).toBeTruthy();
              expect(params.keys.length).toBe(0);
              expect(params.key1).toBe('value1');
              expect(params.key2).toBe('value2');
              done();
          });
        });
      });
    });

    describe('_checkPassword', function () {
      var params = {};

      beforeAll(function () {
        params[conf.PREFIX + 'passwordMin'] = 4;
        params[conf.PREFIX + 'passwordMax'] = 8;
      });

      it('should return an Error to the callback if password size is not' +
        ' appropriate', function (done) {
          params.password = 'a';
          user.helpers._checkPassword(params, function (err) {
            expect(ld.isError(err)).toBeTruthy();
            done();
          });
      });

      it('should return null to the callback if password size is good',
        function (done) {
          params.password = '123456';
          user.helpers._checkPassword(params, function (err) {
            expect(err).toBeNull();
            done();
          });
      });
    });
  });
}).call(this);
