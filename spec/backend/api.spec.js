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
  var request = require('request');
  var api = require('../../api.js');
  var storage = require('../../storage.js');
  var specCommon = require('./common.js');

  describe('MyPads API', function () {
    /**
    * For standalone backend testing : mocking a fresh Express app and
    * initializate API routes.
    */
    var express = require('express');
    var app = express();
    app.use(express.bodyParser());
    api.init(app);
    var server = app.listen(8042);
    var route = 'http://127.0.0.1:8042' + api.initialRoute;
    var rq;
    var conf = require('../../configuration.js');

    beforeAll(function (done) {
      rq = request.defaults({ json: true });
      specCommon.reInitDatabase(done);
    });

    afterAll(function (done) {
      server.close();
      specCommon.reInitDatabase(done);
    });


    describe('configuration API', function () {
      var confRoute = route + 'configuration';

      beforeAll(function (done) {
        var conf = require('../../configuration.js');
        var kv = { field1: 8, field2: 3, field3: ['a', 'b'] };
        storage.fn.setKeys(ld.transform(kv, function (memo, val, key) {
          memo[conf.PREFIX + key] = val; }), done);
      });

      describe('configuration.all GET', function () {
        it('should not reply to DELETE method here', function (done) {
          rq.del(confRoute, function (err, resp, body) {
            expect(resp.statusCode).toBe(404);
            expect(body).toMatch('Cannot DELETE');
            done();
          });
        });

        it('should reply with all setting with GET method', function (done) {
          rq.get(confRoute, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(ld.isObject(body.value)).toBeTruthy();
            expect(body.value.field1).toBe(8);
            expect(body.value.field2).toBe(3);
            expect(ld.size(body.value.field3)).toBe(2);
            expect(body.value.field3[1]).toBe('b');
            done();
          });
        });
      });

      describe('configuration.get GET key', function () {

        it('should return an error if the field does not exist',
          function (done) {
            rq.get(confRoute + '/inexistent', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('Key doesn\'t');
              expect(body.key).toBe('inexistent');
              done();
            });
          }
        );

        it('should give the key and the value otherwise', function (done) {
          rq.get(confRoute + '/field1', function (err, resp, body) {
            expect(resp.statusCode).toBe(200);
            expect(body.key).toBe('field1');
            expect(body.value).toBe(8);
            done();
          });
        });
      });

      describe('configuration.set POST/PUT key value', function () {

        it('post : should return an error if key and/or value are not provided',
          function (done) {
            rq.post(confRoute, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toBe('key must be a string');
              var b = { body: { key: 'field1' } };
              rq.post(confRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toBe('value is mandatory');
                done();
              });
            });
          }
        );

        it('put : should return an error if key is not in URL and if no value',
          function (done) {
            rq.put(confRoute, function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body).toMatch('Cannot PUT');
              rq.put(confRoute + '/field1', function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toBe('value is mandatory');
                done();
              });
            });
          }
        );

        it('post : should save good request like expected', function (done) {
          var b = { body: { key: 'field1', value: 'éèà' } };
          rq.post(confRoute, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe(b.body.key);
            expect(body.value).toBe(b.body.value);
            rq.get(confRoute + '/' + b.body.key, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(b.body.key);
              expect(body.value).toBe(b.body.value);
              done();
            });
          });
        });

        it('put : should save good request like expected', function (done) {
          var b = { body: { value: 42 } };
          rq.put(confRoute + '/field1', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe('field1');
            expect(body.value).toBe(b.body.value);
            rq.get(confRoute + '/field1', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe('field1');
              expect(body.value).toBe(b.body.value);
              done();
            });
          });
        });


      });

      describe('configuration.del DELETE key', function () {

        it('will not return an error if the field does not exist',
          function (done) {
            rq.del(confRoute + '/inexistent', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe('inexistent');
              done();
            });
          }
        );

        it('should deletes the record and returns the key, value and success' +
         ' otherwise', function (done) {
            rq.del(confRoute + '/field1', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe('field1');
              rq.get(confRoute + '/field1', function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('Key doesn\'t');
                expect(body.key).toBe('field1');
                done();
              });
            });
          }
        );
      });
    });

    describe('user API', function () {
    var userRoute = route + 'user';

    beforeAll(function (done) {
      conf.init(function (err) {
        var add = require('../../model/user.js').add;
        add({ login: 'guest', password: 'willnotlivelong' }, done);
      });
    });

      describe('user.add POST and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.post(userRoute, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('must be strings');
              var b = { body: { login: 'parker', password: '' } };
              rq.post(userRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('must be strings');
                b = { body: { login: 'parker', password: 'secret' } };
                rq.post(userRoute, b, function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('password length must be');
                  done();
                });
              });
            });
          }
        );

        it('should return an error if password size is not correct',
          function (done) {
            var b = { body: { login: 'parker', password: '1' } };
            rq.post(userRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('between');
              done();
            });
          }
        );

        it('should create a new user otherwise', function (done) {
          var b = {
            body: {
              login: 'parker',
              password: 'lovesKubiak',
              firstname: 'Parker',
              lastname: 'Lewis'
            }
          };
          rq.post(userRoute, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe('parker');
            expect(body.value.login).toBe('parker');
            expect(body.value.lastname).toBe('Lewis');
            rq.get(userRoute + '/parker', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.value.login).toBe('parker');
              expect(body.value.firstname).toBe('Parker');
              expect(ld.isArray(body.value.groups)).toBeTruthy();
              done();
            });
          });
        });

        it('should return an error if the login/key already exists',
          function (done) {
            var b = { body: { login: 'mikey', password: 'missMusso', } };
            rq.post(userRoute, b, function (err, resp, body) {
              rq.post(userRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('user already exists');
                done();
              });
            });
          }
        );

      });

      describe('user.set PUT key in URL and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.put(userRoute + '/parker', function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('must be strings');
              var b = { body: { login: 'parker', password: '' } };
              rq.put(userRoute + '/parker', b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('must be strings');
                b = { body: { login: 'parker', password: 'secret' } };
                rq.put(userRoute + '/parker', b, function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('password length must be');
                  done();
                });
              });
            });
          }
        );

        it('should return an error if password size is not correct',
          function (done) {
            var b = { body: { login: 'parker', password: '1' } };
            rq.put(userRoute + '/parker', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('between');
              done();
            });
          }
        );

        it('should create a new user otherwise', function (done) {
          var b = {
            body: {
              password: 'lovesKubiak',
              firstname: 'Parker',
              lastname: 'Lewis'
            }
          };
          rq.put(userRoute + '/parker', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe('parker');
            expect(body.value.login).toBe('parker');
            expect(body.value.lastname).toBe('Lewis');
            // TODO: rq.get to check existence in db
            done();
          });
        });

        it('should accept updates on an existing user',
          function (done) {
            var b = { body: { password: 'missMusso', } };
            rq.put(userRoute + '/mikey', b, function (err, resp, body) {
              b.body.email = 'mikey@randall.com';
              rq.put(userRoute + '/mikey', b, function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                expect(body.key).toBe('mikey');
                expect(body.value.email).toBe('mikey@randall.com');
                done();
              });
            });
          }
        );

      });

      describe('user.get GET and key/login', function () {

        it('should return an error if the login does not exist',
          function (done) {
            rq.get(userRoute + '/inexistent', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('user is not found');
              expect(body.key).toBe('inexistent');
              done();
            });
          }
        );

        it('should give the login/key and the user attributes, password' +
          ' excepted otherwise',
          function (done) {
            rq.get(userRoute + '/parker', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(resp.statusCode).toBe(200);
              expect(body.value.login).toBe('parker');
              expect(body.value.firstname).toBe('Parker');
              expect(ld.isArray(body.value.groups)).toBeTruthy();
              done();
            });
          }
        );

      });

      describe('user.get DELETE and key/login', function () {

        it('will return an error if the field does not exist',
          function (done) {
            rq.del(userRoute + '/inexistent', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('user is not found');
              done();
            });
          }
        );

        it('should deletes the record and returns the key, value and success' +
         ' otherwise', function (done) {
            rq.del(userRoute + '/guest', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe('guest');
              rq.get(userRoute + '/guest', function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('user is not found');
                done();
              });
            });
          }
        );

      });

    });
    // add, get, set, del

  });

}).call(this);
