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
  var user = require('../../model/user.js');
  var group = require('../../model/group.js');
  var pad = require('../../model/pad.js');
  var specCommon = require('./common.js');
  var CPREFIX = storage.DBPREFIX.CONF;

  xdescribe('MyPads API', function () {
    pending('HTTP REST API suspended, due to problems with yajsml middleware');
    /**
    * For standalone backend testing : mocking a fresh Express app and
    * initializate API routes.
    */
    var route = 'http://127.0.0.1:8042' + api.initialRoute;
    var rq;
    var conf = require('../../configuration.js');
    var j = request.jar();

    beforeAll(function (done) {
      specCommon.mockupExpressServer();
      specCommon.reInitDatabase(function () {
        conf.init(function () {
          api.init(specCommon.express.app);
          rq = request.defaults({ json: true, jar: j });
          done();
        });
      });
    });

    afterAll(function (done) {
      specCommon.unmockExpressServer();
      specCommon.reInitDatabase(done);
    });

    describe('authentification API', function () {
      var authRoute = route + 'auth';

      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          user.set({ login: 'guest', password: 'willnotlivelong' }, done);
        });
      });
      afterAll(specCommon.reInitDatabase);

      describe('auth.check POST', function () {

        beforeAll(function (done) {
          var params = {
            body: { login: 'guest', password: 'willnotlivelong' }
          };
          rq.post(authRoute + '/login', params, done);
        });
        afterAll(function (done) { rq.get(authRoute + '/logout', done); });

        it('should return an error if params are inexistent', function (done) {
          rq.post(authRoute + '/check', {}, function (err, resp, body) {
            expect(resp.statusCode).toBe(400);
            expect(body.error).toBe('login must be a string');
            done();
          });
        });

        it('should return an error if user does not exist', function (done) {
          var params = { body: { login: 'inexistent', password: 'pass' } };
          rq.post(authRoute + '/check', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(400);
            expect(body.error).toBe('user not found');
            done();
          });
        });

        it('should not auth if user exists but pasword does not match',
          function (done) {
            var params = { body: { login: 'guest', password: 'pass' } };
            rq.post(authRoute + '/check', params, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toBe('password is not correct');
              done();
            });
          }
        );

        it('should return success otherwise', function (done) {
          var params = {
            body: { login: 'guest', password: 'willnotlivelong' }
          };
          rq.post(authRoute + '/check', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            done();
          });
        });

      });

      describe('auth.login POST', function () {

        it('should not auth if params are inexistent', function (done) {
          rq.post(authRoute + '/login', {}, function (err, resp, body) {
            expect(resp.statusCode).toBe(400);
            expect(body.error).toBe('Missing credentials');
            done();
          });
        });

        it('should not auth if params are incorrect', function (done) {
          var params = { body: { login: 'inexistent', password: 123 } };
          rq.post(authRoute + '/login', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(400);
            expect(body.error).toBe('password must be a string');
            done();
          });
        });

        it('should not auth if user does not exist', function (done) {
          var params = { body: { login: 'inexistent', password: 'pass' } };
          rq.post(authRoute + '/login', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(400);
            expect(body.error).toBe('user not found');
            done();
          });
        });

        it('should not auth if user exists but pasword does not match',
          function (done) {
            var params = { body: { login: 'guest', password: 'pass' } };
            rq.post(authRoute + '/login', params, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toBe('password is not correct');
              done();
            });
          }
        );

        it('should auth otherwise', function (done) {
          var params = {
            body: { login: 'guest', password: 'willnotlivelong' }
          };
          rq.post(authRoute + '/login', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.user).toBeDefined();
            expect(body.user._id).toBeDefined();
            expect(body.user.login).toBe('guest');
            expect(body.user.password).toBeUndefined();
            done();
          });
        });
      });

      describe('auth.logout GET', function () {

        it('should not logout if not already authenticated', function (done) {
          rq.get(authRoute + '/logout', { jar: false },
            function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(400);
              expect(body.error).toBe('not authenticated');
              done();
            }
          );
        });

        it('should logout if authenticated', function (done) {
          var params = {
            body: { login: 'guest', password: 'willnotlivelong' }
          };
          rq.post(authRoute + '/login', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            rq.get(authRoute + '/logout', function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              rq.get(route + 'configuration/inexistent',
                function (err, resp, body) {
                  expect(err).toBeNull();
                  expect(body.error).toMatch('must be authenticated');
                  done();
                }
              );
            });
          });
        });

      });
    });

    describe('unAuth legitimate tests', function () {

      describe('configuration.public GET', function () {
        var confRoute = route + 'configuration';

        beforeAll(function (done) {
          var kv = { title: 'Amigo', field: 3 };
          storage.fn.setKeys(ld.transform(kv, function (memo, val, key) {
            memo[CPREFIX + key] = val; }), done);
        });

        afterAll(specCommon.reInitDatabase);

        it('should reply with all public setting with GET method',
          function (done) {
            rq.get(confRoute, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(ld.isObject(body.value)).toBeTruthy();
              expect(body.value.title).toBe('Amigo');
              expect(body.value.field).toBeUndefined();
              done();
            });
          }
        );
      });
    });

    describe('configuration API', function () {
      var confRoute = route + 'configuration';

      beforeAll(function (done) {
        var kv = { field1: 8, field2: 3, field3: ['a', 'b'] };
        storage.fn.setKeys(ld.transform(kv, function (memo, val, key) {
          memo[CPREFIX + key] = val; }), function () {
            var u = { login: 'guest', password: 'willnotlivelong' };
            user.set(u, function () {
              rq.post(route + 'auth/login', { body: u }, done);
            });
          }
        );
      });

      afterAll(function (done) {
        rq.get(route + 'auth/logout', done);
      });

      describe('configuration.all GET', function () {
        it('should not reply to DELETE method here', function (done) {
          rq.del(confRoute, function (err, resp, body) {
            expect(resp.statusCode).toBe(404);
            expect(body).toMatch('Cannot DELETE');
            done();
          });
        });

        it('should reply with all settings with GET method', function (done) {
          rq.get(confRoute, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(ld.isObject(body.value)).toBeTruthy();
            expect(body.value.field1).toBe(8);
            expect(body.value.field2).toBe(3);
            expect(ld.size(body.value.field3)).toBe(2);
            //expect(body.value.field3[1]).toBe('b');
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
        conf.init(function () {
          var set = require('../../model/user.js').set;
          var u = { login: 'guest', password: 'willnotlivelong' };
          set(u, function () {
            rq.post(route + 'auth/login', { body: u }, done);
          });
        });
      });

      afterAll(function (done) {
        rq.get(route + 'auth/logout', done);
      });

      describe('user.set/add POST and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.post(userRoute, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('must be a string');
              var b = { body: { login: 'parker', password: '' } };
              rq.post(userRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('must be a string');
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
            rq.post(userRoute, b, function () {
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
              expect(body.error).toMatch('must be a string');
              var b = { body: { login: 'parker', password: '' } };
              rq.put(userRoute + '/parker', b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('must be a string');
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

        it('should create a user otherwise', function (done) {
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
            rq.get(userRoute + '/parker', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.value.login).toBe('parker');
              expect(body.value.firstname).toBe('Parker');
              expect(ld.isArray(body.value.groups)).toBeTruthy();
              done();
            });
          });
        });

        it('should accept updates on an existing user',
          function (done) {
            var b = { body: { password: 'missMusso', } };
            rq.put(userRoute + '/mikey', b, function () {
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

        xit('should accept login change',
          function (done) {
            var b = { body: { password: 'missMusso', } };
            rq.put(userRoute + '/mikey', b, function () {
              b.body.login = 'mike';
              rq.put(userRoute + '/mikey', b, function (err, resp, body) {
                console.log(body);
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                expect(body.key).toBe('mikey');
                expect(body.value.login).toBe('mike');
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
              expect(body.error).toMatch('user not found');
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

      describe('user.del DELETE and key/login', function () {

        it('will return an error if the user does not exist',
          function (done) {
            rq.del(userRoute + '/inexistent', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('user not found');
              done();
            });
          }
        );

        it('should deletes the record and returns the key and success' +
         ' otherwise', function (done) {
            rq.del(userRoute + '/guest', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe('guest');
              rq.get(userRoute + '/guest', function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('user not found');
                done();
              });
            });
          }
        );

      });

    });

    describe('group API', function () {
      var groupRoute = route + 'group';
      var uid;
      var gid;

      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          var params = { login: 'guest', password: 'willnotlivelong' };
          user.set(params, function (err, u) {
            if (err) { console.log(err); }
            uid = u._id;
            group.set({ name: 'g1', admin: u._id },
              function (err, res) {
                if (err) { console.log(err); }
                gid = res._id;
                rq.post(route + 'auth/login', { body: params }, done);
            });
          });
        });
      });
      afterAll(function (done) {
        rq.get(route + 'auth/logout', function () {
          specCommon.reInitDatabase(done);
        });
      });

      describe('group.get GET and id', function () {

        it('should return an error if the id does not exist',
          function (done) {
            rq.get(groupRoute + '/ginexistent', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('key is not found');
              expect(body.key).toBe('ginexistent');
              done();
            });
          }
        );

        it('should give the key and the group attributes otherwise',
          function (done) {
            rq.get(groupRoute + '/' + gid, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(gid);
              expect(body.value._id).toBe(gid);
              expect(body.value.name).toBe('g1');
              expect(body.value.visibility).toBe('restricted');
              expect(ld.isArray(body.value.users)).toBeTruthy();
              expect(ld.isArray(body.value.pads)).toBeTruthy();
              expect(body.value.password).toBeNull();
              expect(body.value.readonly).toBeFalsy();
              expect(ld.size(body.value.admins)).toBe(1);
              expect(body.value.admins[0]).toBe(uid);
              done();
            });
          }
        );
      });

      describe('group.set/add POST and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.post(groupRoute, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('must be a string');
              var b = { body: { name: 'group1' } };
              rq.post(groupRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('must be a string');
                done();
              });
            });
          }
        );

        it('should return an error if admin user does not exist',
          function (done) {
            var b = { body: { name: 'group1', admin: 'inexistentId' } };
            rq.post(groupRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('Some users');
              done();
            });
          }
        );

        it('should create a new group otherwise', function (done) {
          var b = {
            body: {
              name: 'groupOk',
              admin: uid,
              visibility: 'private',
              password: 'secret'
            }
          };
          rq.post(groupRoute, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBeDefined();
            var key = body.key;
            expect(body.value.name).toBe('groupOk');
            rq.get(groupRoute + '/' + key,
              function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(body.key).toBe(key);
                expect(body.value._id).toBe(key);
                expect(body.value.name).toBe('groupOk');
                expect(body.value.visibility).toBe('private');
                expect(body.value.password).toBeDefined();
                expect(ld.isArray(body.value.users)).toBeTruthy();
                expect(ld.isArray(body.value.pads)).toBeTruthy();
                expect(body.value.readonly).toBeFalsy();
                expect(ld.size(body.value.admins)).toBe(1);
                expect(body.value.admins[0]).toBe(uid);
                done();
              }
            );
          });
        });

      });

      describe('group.set PUT key in URL and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.put(groupRoute + '/' + gid, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('must be a string');
              var b = { body: { name: 'group1' } };
              rq.put(groupRoute + '/' + gid, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('must be a string');
                b = { body: { name: 'group1', admin: 'inexistentId' } };
                rq.put(groupRoute + '/' + gid, b, function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('Some users');
                  done();
                });
              });
            });
          }
        );

        it('should update an existing group otherwise', function (done) {
          var b = {
            body: {
              _id: gid,
              name: 'gUpdated',
              admin: uid,
              visibility: 'public',
              readonly: true
            }
          };
          rq.put(groupRoute + '/' + gid, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe(gid);
            expect(body.value.name).toBe('gUpdated');
            rq.get(groupRoute + '/' + gid,
              function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.key).toBe(gid);
                expect(body.value._id).toBe(gid);
                expect(body.value.name).toBe('gUpdated');
                expect(body.value.visibility).toBe('public');
                expect(ld.isArray(body.value.users)).toBeTruthy();
                expect(ld.isArray(body.value.pads)).toBeTruthy();
                expect(body.value.readonly).toBeTruthy();
                expect(ld.size(body.value.admins)).toBe(1);
                expect(body.value.admins[0]).toBe(uid);
                done();
              }
            );
          });
        });

        it('should also create a non existent group', function (done) {
          var b = {
            body: {
              name: 'gCreated',
              admin: uid,
              visibility: 'public',
              readonly: true
            }
          };
          rq.put(groupRoute + '/newgid', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBeDefined();
            expect(body.value.name).toBe('gCreated');
            var key = body.key;
            rq.get(groupRoute + '/' + key,
              function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.key).toBe(key);
                expect(body.value._id).toBe(key);
                expect(body.value.name).toBe('gCreated');
                expect(body.value.visibility).toBe('public');
                expect(ld.isArray(body.value.users)).toBeTruthy();
                expect(ld.isArray(body.value.pads)).toBeTruthy();
                expect(body.value.readonly).toBeTruthy();
                expect(ld.size(body.value.admins)).toBe(1);
                expect(body.value.admins[0]).toBe(uid);
                done();
              }
            );
          });
        });
      });

      describe('group.del DELETE and id', function () {
        it('will return an error if the group does not exist',
          function (done) {
            rq.del(groupRoute + '/inexistentId', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('key is not found');
              done();
            });
          }
        );

        it('should deletes the record and returns the key and success' +
         ' otherwise', function (done) {
            rq.del(groupRoute + '/' + gid, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe(gid);
              rq.get(groupRoute + '/' + gid, function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('key is not found');
                done();
              });
            });
          }
        );
      });
    });

    describe('pad API', function () {
      var padRoute = route + 'pad';
      var uid;
      var gid;
      var pid;

      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          var params = { login: 'guest', password: 'willnotlivelong' };
          user.set(params, function (err, u) {
            if (err) { console.log(err); }
            uid = u._id;
            group.set({ name: 'g1', admin: u._id }, function (err, g) {
              if (err) { console.log(err); }
              gid = g._id;
              pad.set({ name: 'p1', group: g._id }, function (err, p) {
                if (err) { console.log(err); }
                pid = p._id;
                rq.post(route + 'auth/login', { body: params }, done);
              });
            });
          });
        });
      });
      afterAll(function (done) {
        rq.get(route + 'auth/logout', function () {
          specCommon.reInitDatabase(done);
        });
      });

      describe('pad.get GET and id', function () {

        it('should return an error if the id does not exist',
          function (done) {
            rq.get(padRoute + '/pinexistent', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('key is not found');
              expect(body.key).toBe('pinexistent');
              done();
            });
          }
        );

        it('should give the key and the pad attributes otherwise',
          function (done) {
            rq.get(padRoute + '/' + pid, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(pid);
              expect(body.value._id).toBe(pid);
              expect(body.value.group).toBe(gid);
              expect(body.value.name).toBe('p1');
              expect(body.value.visibility).toBeNull();
              expect(body.value.password).toBeNull();
              expect(body.value.readonly).toBeNull();
              expect(ld.isArray(body.value.users)).toBeTruthy();
              done();
            });
          }
        );
      });

      describe('pad.set/add POST and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.post(padRoute, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('must be a string');
              var b = { body: { name: 'pad1' } };
              rq.post(padRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('must be a string');
                done();
              });
            });
          }
        );

        it('should return an error if pad does not exist',
          function (done) {
            var b = { body: { name: 'pad1', group: gid, _id: 'inexistent' } };
            rq.post(padRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('pad does not');
              done();
            });
          }
        );

        it('should return an error if group does not exist',
          function (done) {
            var b = { body: { name: 'pad1', group: 'inexistentId' } };
            rq.post(padRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('pad group');
              done();
            });
          }
        );

        it('should return an error if users are not found',
          function (done) {
            var b = { body:
              {
                name: 'pad1',
                group: gid,
                visibility: 'restricted',
                users: ['inexistentId']
              }
            };
            rq.post(padRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('users are not found');
              done();
            });
          }
        );

        it('should create a new pad otherwise', function (done) {
          var b = {
            body: {
              name: 'padOk',
              group: gid,
              visibility: 'private',
              password: 'secret'
            }
          };
          rq.post(padRoute, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBeDefined();
            var key = body.key;
            expect(body.value.name).toBe('padOk');
            rq.get(padRoute + '/' + key,
              function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(body.key).toBe(key);
                expect(body.value._id).toBe(key);
                expect(body.value.name).toBe('padOk');
                expect(body.value.visibility).toBe('private');
                expect(body.value.password).toBeDefined();
                expect(ld.isArray(body.value.users)).toBeTruthy();
                expect(body.value.readonly).toBeNull();
                done();
              }
            );
          });
        });

      });

      describe('pad.set PUT key in URL and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.put(padRoute, function (err, resp) {
              expect(resp.statusCode).toBe(404);
              var b = { body: { name: 'pad1' } };
              rq.put(padRoute + '/' + pid, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('must be a string');
                done();
              });
            });
          }
        );

        it('should update an existing pad otherwise', function (done) {
          var b = {
            body: {
              _id: pid,
              name: 'pUpdated',
              group: gid,
              visibility: 'public',
              readonly: true
            }
          };
          rq.put(padRoute + '/' + pid, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe(pid);
            expect(body.value.name).toBe('pUpdated');
            rq.get(padRoute + '/' + pid,
              function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.key).toBe(pid);
                expect(body.value._id).toBe(pid);
                expect(body.value.group).toBe(gid);
                expect(body.value.name).toBe('pUpdated');
                expect(body.value.visibility).toBe('public');
                expect(ld.isArray(body.value.users)).toBeTruthy();
                done();
              }
            );
          });
        });

        it('should also create a non existent pad', function (done) {
          var b = {
            body: {
              name: 'pCreated',
              group: gid,
              visibility: 'public',
              readonly: true
            }
          };
          rq.put(padRoute + '/newpid', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBeDefined();
            expect(body.value.name).toBe('pCreated');
            rq.get(padRoute + '/' + pid,
              function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.key).toBe(pid);
                expect(body.value._id).toBe(pid);
                expect(body.value.group).toBe(gid);
                expect(body.value.name).toBe('pUpdated');
                expect(body.value.visibility).toBe('public');
                expect(ld.isArray(body.value.users)).toBeTruthy();
                done();
              }
            );
          });
        });
      });

      describe('pad.del DELETE and id', function () {
        it('will return an error if the pad does not exist',
          function (done) {
            rq.del(padRoute + '/inexistentId', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('key is not found');
              done();
            });
          }
        );

        it('should deletes the record and returns the key and success' +
         ' otherwise', function (done) {
            rq.del(padRoute + '/' + pid, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe(pid);
              rq.get(padRoute + '/' + pid, function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('key is not found');
                done();
              });
            });
          }
        );
      });
    });
  });

}).call(this);
