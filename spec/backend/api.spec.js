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
    var confRoute = route + 'configuration';
    var rq;

    beforeAll(function (done) {
      rq = request.defaults({ json: true });
      specCommon.reInitDatabase(done);
    });

    describe('configuration API', function () {
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
              rq.get(confRoute + '/inexistent', function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('Key doesn\'t');
                expect(body.key).toBe('inexistent');
                done();
              });
            });
          }
        );
      });
    });

    afterAll(function (done) {
      server.close();
      specCommon.reInitDatabase(done);
    });
  });

}).call(this);
