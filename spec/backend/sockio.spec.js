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
  var io = require('socket.io-client');
  var sockio = require('../../sockio.js');
  var conf = require('../../configuration.js');
  var storage = require('../../storage.js');
  var user = require('../../model/user.js');
  var specCommon = require('./common.js');
  var CPREFIX = storage.DBPREFIX.CONF;

  describe('MyPads socket.io API', function () {
    /**
    * For standalone backend testing : mocking a fresh Express app
    */
    var api;

    /**
    * `testRunner` is provided to be able to queue and launch tests for
    * socket.io (based on events) in the provided ordrer.
    * It takes :
    *
    * - `path` eventName
    * - an array of `tests`, with `data` object
    * - `expectations` function, and the `done` callback function.
    */

    var testRunner = function (path, tests, done) {
      tests.reverse();
      var expectFn;
      var runner = function () {
        var t = tests.pop();
        expectFn = t.expectations;
        api.emit(path, t.data);
      };
      api.on(path, function (resp) {
        expectFn(resp); 
        return tests.length ? runner() : done();
      });
      runner();
    };

    beforeAll(function (done) {
      specCommon.mockupExpressServer();
      specCommon.reInitDatabase(function () {
        conf.init(function () {
          sockio.init(specCommon.express.app, specCommon.express.io);
          api = io.connect('http://127.0.0.1:8042' + sockio.initialNamespace);
          api.on('connect', done);
        });
      });
    });

    afterAll(function (done) {
      api.emit('disconnect');
      specCommon.unmockExpressServer();
      specCommon.reInitDatabase(done);
    });

    describe('configurationAPI', function () {
      var pre = 'configuration:';

      beforeAll(function (done) {
        var kv = { field1: 8, field2: 3, field3: ['a', 'b'] };
        storage.fn.setKeys(ld.transform(kv, function (memo, val, key) {
          memo[CPREFIX + key] = val; }), function () {
            var u = { login: 'guest', password: 'willnotlivelong' };
            user.set(u, function () {
              //rq.post(route + 'auth/login', { body: u }, done);
              done();
            });
          }
        );
      });

      afterAll(function (done) {
        //rq.get(route + 'auth/logout', done);
        done();
      });

      describe('configuration.all get', function () {
        var getPath = pre + 'get';

        it('should reply with all settings with get command', function (done) {
          api.emit(getPath);
          api.on(getPath, function (resp) {
            expect(ld.isObject(resp.value)).toBeTruthy();
            expect(resp.value.field1).toBe(8);
            expect(resp.value.field2).toBe(3);
            expect(ld.size(resp.value.field3)).toBe(2);
            done();
          });
        });

      });

    });

    describe('authentification API', function () {
      var pre = 'auth:';

      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          user.set({ login: 'guest', password: 'willnotlivelong' }, done);
        });
      });
      afterAll(specCommon.reInitDatabase);

      describe('auth.check', function () {
        var checkPath = pre + 'check';

        it('should waterfall tests correctly', function (done) {
          var tests = [
            {
              // it should return an error if params are inexistent
              data: undefined,
              expectations: function (r) {
                expect(r.error).toBe('login must be a string'); 
              }
            }, {
              // it should return an error if user does not exist
              data: { login: 'inexistent', password: 'pass' },
              expectations: function (r) {
                expect(r.error).toBe('user not found'); 
              }
            }, {
              // should check if user exists but pasword does not match
              data: { login: 'guest', password: 'pass' },
              expectations: function (r) {
                expect(r.error).toBe('password is not correct'); 
              }
            }, {
              // should return success otherwise
              data: { login: 'guest', password: 'willnotlivelong' },
              expectations: function (r) { expect(r.success).toBeTruthy(); }
            }
          ];
          testRunner(checkPath, tests, done);
        });
      });

      describe('auth.login', function () {
        var loginPath = pre + 'login';

        it('should waterfall tests correctly', function (done) {
          var tests = [
            {
              // should not auth if params are inexistent
              data: undefined,
              expectations: function (r) {
                expect(r.error).toBe('Missing credentials');
              }
            }, {
              // it should return an error if user does not exist
              data: { login: 'inexistent', password: 'pass' },
              expectations: function (r) {
                expect(r.error).toBe('user not found');
              }
            }, {
              // should not auth if user exists but pasword does not match
              data: { login: 'guest', password: 'pass' },
              expectations: function (r) {
                expect(r.error).toBe('password is not correct'); 
              }
            }, {
              // should auth otherwise
              data: { login: 'guest', password: 'willnotlivelong' },
              expectations: function (r) {
                expect(r.success).toBeTruthy();
                expect(r.user).toBeDefined();
                expect(r.user._id).toBeDefined();
                expect(r.user.login).toBe('guest');
                expect(r.user.password).toBeUndefined();
              }
            }
          ];
          testRunner(loginPath, tests, done);
        });
      });
    });
  });

}).call(this);
