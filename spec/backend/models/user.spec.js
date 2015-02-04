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
  var specCommon = require('../common.js');
  var user = require('../../../models/user.js');
  var db = require('../../../storage.js').db;
  var conf = require('../../../configuration.js');

  describe('user', function () {
    beforeAll(specCommon._reInitDatabase);
    afterAll(specCommon._reInitDatabase);

    describe('creation', function () {
      beforeAll(function (done) {
        conf.init(done);
      });

      it('should return a TypeError and a message if either login or password' +
        ' aren\'t given; nor callback function', function () {
        expect(user.add).toThrow();
        expect(ld.partial(user.add, { another: 'object' })).toThrow();
        expect(ld.partial(user.add, { login: 'Johnny' })).toThrow();
        expect(ld.partial(user.add, { password: 'secret' })).toThrow();
        expect(ld.partial(user.add, { login: 'john', password: 'secret' }))
          .toThrow();
      });

      it('should return an Error to the callback if password size is not' +
        ' appropriate', function (done) {
        user.add({ login: 'bob', password: '1'}, function (err, res) {
          expect(ld.isError(err)).toBeTruthy();
          done();
        });
      });

      it('should accept any creation if login & password are fixed',
        function (done) {
          user.add({
            login: 'parker',
            password: 'lovesKubiak',
            firstname: 'Parker',
            lastname: 'Lewis'
          }, function (err, u) {
            expect(err).toBeNull();
            expect(u.login).toBe('parker');
            expect(u.password).toBeDefined();
            expect(u.firstname).toBe('Parker');
            expect(u.lastname).toBe('Lewis');
            expect(ld.isString(u.organization)).toBeTruthy();
            done();
          });
        }
      );
    });
  });

  describe('user functions', function() {
    beforeAll(specCommon._reInitDatabase);
    afterAll(specCommon._reInitDatabase);

    describe('getPasswordConf', function () {

      it('should retrieve min and max length for password', function (done) {
        user.fn.getPasswordConf(function (err, results) {
          expect(err).toBeNull();
          var rkeys = ld.keys(results);
          expect(ld.contains(rkeys, conf.PREFIX + 'passwordMin')).toBeTruthy();
          expect(ld.contains(rkeys, conf.PREFIX + 'passwordMax')).toBeTruthy();
          done();
        });
      });

    });

    describe('checkPassword', function () {
      var params = {};

      beforeAll(function () {
        params[conf.PREFIX + 'passwordMin'] = 4;
        params[conf.PREFIX + 'passwordMax'] = 8;
      });

      it('should return an Error to the callback if password size is not' +
        ' appropriate', function (done) {
          params.password = 'a';
          user.fn.checkPassword(params, function (err) {
            expect(ld.isError(err)).toBeTruthy();
            done();
          });
      });

      it('should return null to the callback if password size is good',
        function (done) {
          params.password = '123456';
          user.fn.checkPassword(params, function (err) {
            expect(err).toBeNull();
            done();
          });
      });
    });

    describe('checkUserExistence', function () {
      var ukey = user.PREFIX + 'john';

      beforeAll(function (done) { db.set(ukey, 'exists', done); });
      afterAll(function (done) { db.remove(ukey, done); });

      it('should return an Error if the user exists', function (done) {
        user.fn.checkUserExistence(ukey, function (err) {
          expect(ld.isError(err)).toBeTruthy();
          done();
        });
      });

      it('should return null if the user don\'t exist', function (done) {
        user.fn.checkUserExistence(user.PREFIX + 'bob', function (err) {
          expect(err).toBeNull();
          done();
        });
      });
    });

    describe('assignUserProps', function () {

      it ('should respect given properties if strings and relevant',
        function () {
          var params = {
            login: 'brian',
            password: 'secret',
            organization: 'etherInc',
            firstname: true,
            irrelevant: 123,
            email: 'brian@sample.net'
          };
          var u = user.fn.assignUserProps(params);
          expect(u.login).toBe('brian');
          expect(u.password).toBe('secret');
          expect(u.organization).toBe('etherInc');
          expect(u.email).toBe('brian@sample.net');
          var uf = u.firstname;
          var ul = u.lastname;
          expect(ld.isString(uf) && ld.isEmpty(uf)).toBeTruthy();
          expect(ld.isString(ul) && ld.isEmpty(ul)).toBeTruthy();
          expect(u.irrelevant).toBeUndefined();
          params.email = 'notenamail@@@@';
          u = user.fn.assignUserProps(params);
          var ue = u.email;
          expect(ld.isString(ue) && ld.isEmpty(ue)).toBeTruthy();
        }
      );
    });
  });

  describe('lodash mixins', function () {

    describe('isEmail', function () {

      it ('should returns if the value is an email or not', function () {
        expect(ld.isEmail(1)).toBeFalsy();
        expect(ld.isEmail([])).toBeFalsy();
        expect(ld.isEmail({})).toBeFalsy();
        expect(ld.isEmail('aaa')).toBeFalsy();
        expect(ld.isEmail('aaa@')).toBeFalsy();
        expect(ld.isEmail('aaa@bbb')).toBeFalsy();
        expect(ld.isEmail('aaabbb.com')).toBeFalsy();
        expect(ld.isEmail('@example.com')).toBeFalsy();
        expect(ld.isEmail('john@example.com')).toBeTruthy();
        expect(ld.isEmail('j@example.newdd')).toBeTruthy();
      });
    });

  });
}).call(this);
