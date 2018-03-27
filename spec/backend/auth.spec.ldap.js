/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
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

(function () {
  'use strict';
  process.env.TEST_LDAP = true;
  var ld = require('lodash');
  var specCommon = require('./common.js');
  var user = require('../../model/user.js');
  var auth = require('../../auth.js');

  describe('auth', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('isPasswordValid', function () {
      var params;
      beforeAll(function (done) {
        user.fn.hashPassword(null, 'password', function (err, res) {
          if (err) { console.log(err); }
          params = { password: res };
          done();
        });
      });

      it('should return an Error if password is not given', function (done) {
        expect(auth.fn.isPasswordValid(params, undefined, function (err) {
          expect(ld.isError(err));
          expect(err).toMatch('PASSWORD_MISSING');
          done();
        }));
      });

      it('should return null and false if no login is given',
        function (done) {
          auth.fn.isPasswordValid(params, 'anotherOne', function (err, res) {
            expect(err).toBeNull();
            expect(res).toBeFalsy();
            done();
          });
        }
      );

      it('should return null and false if password does not match',
        function (done) {
          params = {
            login: 'fry'
          };
          auth.fn.isPasswordValid(params, 'anotherOne', function (err, res) {
            expect(err).toBeNull();
            expect(res).toBeFalsy();
            done();
          });
        }
      );

      it('should return null and true if password does match', function (done) {
        auth.fn.isPasswordValid(params, 'fry', function (err, res) {
          expect(err).toBeNull();
          expect(res).toBeTruthy();
          done();
        });
      });
    });

    describe('localFn and checkMyPadsUser', function () {
    var params;
    beforeAll(function (done) {
      specCommon.reInitDatabase(function () {
        params = {
          login: 'fry',
          password: 'soooo_useless',
          firstname: 'Philip',
          lastname: 'Fry',
          email: 'fry@planetexpress.com'
        };
        user.set(params, done);
      });
    });

      it('should not auth if user does not exist', function (done) {
        auth.fn.localFn('inexistent', 'none', function (err) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('USER.NOT_FOUND');
          done();
        });
      });

      it('should not auth if password does not match', function (done) {
        auth.fn.localFn(params.login, 'anotherOne', function (err, res) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('PASSWORD_INCORRECT');
          expect(res).toBeFalsy();
          done();
        });
      });

      it('should auth if login and password match', function (done) {
        params.password = 'fry';
        auth.fn.localFn(params.login, params.password,
          function (err, res) {
            expect(err).toBeNull();
            expect(ld.isObject(res)).toBeTruthy();
            expect(res.login).toBe(params.login);
            expect(res.firstname).toBe(params.firstname);
            expect(res.lastname).toBe(params.lastname);
            expect(ld.isString(res.password.hash)).toBeTruthy();
            done();
          }
        );
      });
    });

    describe('checkAdminUser', function () {

      it('should not auth if admin does not exist', function (done) {
        auth.fn.checkAdminUser('inexistent', 'passw0rd', function (err, u) {
          expect(err).toMatch('USER.NOT_FOUND');
          expect(u).toBeNull();
          done();
        });
      });

      it('should not auth if password does not match', function (done) {
        auth.fn.checkAdminUser('admin', 'badPassW0rd', function (err, u) {
          expect(err).toMatch('AUTHENTICATION.PASSWORD_INCORRECT');
          expect(u).toBeFalsy();
          done();
        });
      });

      it('should not auth if user is not admin', function (done) {
        auth.fn.checkAdminUser('parker', 'lovesKubiak', function (err, u) {
          expect(err).toMatch('AUTHENTICATION.ADMIN');
          expect(u).toBeFalsy();
          done();
        });
      });

      it('should auth if login and password match', function (done) {
        auth.fn.checkAdminUser('admin', 'admin', function (err, u) {
          expect(err).toBeNull();
          expect(u).toBeDefined();
          done();
        });
      });

    });
  });
}).call(this);
