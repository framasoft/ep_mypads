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
  var jwt = require('jsonwebtoken');
  var api = require('../../api.js');
  var mail = require('../../mail.js');
  var user = require('../../model/user.js');
  var group = require('../../model/group.js');
  var pad = require('../../model/pad.js');
  var specCommon = require('./common.js');

  describe('MyPads API', function () {
    /**
    * For standalone backend testing : mocking a fresh Express app and
    * initializate API routes.
    */
    var route = 'http://127.0.0.1:8042' + api.initialRoute;
    var adminRoute = 'http://127.0.0.1:8042/admin';
    var adminLogoutRoute = adminRoute + '/logout';
    var rq;
    var conf = require('../../configuration.js');
    var j = request.jar();

    /**
    * `withAdmin` decorator function, that :
    *
    * - uses mocked admin login first
    * - launch given `fn` as argument; this function must take an `after`
    *   callback function
    * - calls the `after` function and finally the jasmine `done` end of test
    */

    var withAdmin = function (fn, done) {
      var after = function () {
        rq.get(adminLogoutRoute, function (err) {
          expect(err).toBeNull();
          done();
        });
      };
      rq.get(adminRoute, function (err) {
        expect(err).toBeNull();
        fn(after);
      });
    };

    /* Global local variables */
    var guest = {
      login: 'guest',
      password: 'willnotlivelong',
      email: 'guest@phantomatic.net'
    };

    beforeAll(function (done) {
      specCommon.mockupExpressServer();
      specCommon.reInitDatabase(function () {
        conf.init(function () {
          api.init(specCommon.express.app, function () {
            rq = request.defaults({ json: true, jar: j });
            setTimeout(done, 500);
          });
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
          user.set(guest, done);
        });
      });
      afterAll(specCommon.reInitDatabase);

      describe('auth.check POST', function () {

        var token;

        beforeAll(function (done) {
          var params = { body: guest };
          rq.post(authRoute + '/login', params, function (err, resp, body) {
            if (!err && resp.statusCode === 200) {
              token = body.token;
              done();
            }
          });
        });
        afterAll(function (done) {
          var b = { body: { auth_token: token } };
          rq.get(authRoute + '/logout', b, done);
        });

        it('should return an error if params are inexistent', function (done) {
          rq.post(authRoute + '/check', {}, function (err, resp) {
            expect(resp.statusCode).toBe(401);
            done();
          });
        });

        it('should return an error if params are bad', function(done) {
          var params = {
            body: {
              login: 'guest',
              password: 'badOne',
              email: 'guest@phantomatic.net',
              auth_token: jwt.sign({}, 'bad')
            } 
          };
          rq.post(authRoute + '/check', params, function (err, resp) {
            expect(resp.statusCode).toBe(401);
            done();
          });
        });

        it('should return success otherwise', function (done) {
          var params = {
            body: {
              login: 'guest',
              password: 'willnotlivelong',
              email: 'guest@phantomatic.net',
              auth_token: token
            } 
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
            expect(body.error).toMatch('PASSWORD_STR');
            done();
          });
        });

        it('should not auth if params are incorrect', function (done) {
          var params = { body: { login: 'inexistent', password: 123 } };
          rq.post(authRoute + '/login', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(400);
            expect(body.error).toMatch('PASSWORD_STR');
            done();
          });
        });

        it('should not auth if user does not exist', function (done) {
          var params = { body: { login: 'inexistent', password: 'pass' } };
          rq.post(authRoute + '/login', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(400);
            expect(body.error).toMatch('USER.NOT_FOUND');
            done();
          });
        });

        it('should not auth if user exists but pasword does not match',
          function (done) {
            var params = { body: ld.clone(guest) };
            params.body.password = 'anotherOne';
            rq.post(authRoute + '/login', params, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PASSWORD_INCORRECT');
              done();
            });
          }
        );

        it('should auth otherwise', function (done) {
          var params = { body: guest };
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
          rq.get(authRoute + '/logout', function (err, resp) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(401);
            done();
          });
        });

        it('should logout if authenticated', function (done) {
          var params = { body: guest };
          rq.post(authRoute + '/login', params, function (err, resp, body) {
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            var params = { body: { auth_token: body.token } };
            rq.get(authRoute + '/logout', params, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              rq.get(route + 'pad/inexistent',
                function (err, resp, body) {
                  expect(err).toBeNull();
                  expect(body.error).toMatch('KEY_NOT_FOUND');
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
          conf.set('title', 'Amigo', function () {
            conf.set('field', 3, done);
          });
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
      var token;

      beforeAll(function (done) {
        var kv = { field1: 8, field2: 3, field3: ['a', 'b'] };
        ld.assign(conf.cache, kv);
        user.set(guest, function () {
          rq.post(route + 'auth/login', { body: guest },
            function (err, resp, b) {
              if (!err && resp.statusCode === 200) {
                token = b.token;
                done();
              }
            }
          );
        });
      });

      afterAll(function (done) {
        rq.get(route + 'auth/logout', { body: { auth_token: token } },  done);
      });

      describe('configuration.all GET', function () {
        it('should not reply to DELETE method here', function (done) {
          rq.del(confRoute, function (err, resp, body) {
            expect(resp.statusCode).toBe(404);
            expect(body).toMatch('Cannot DELETE');
            done();
          });
        });

        it('should reply with filtered settings with GET and no admin role',
          function (done) {
            var params = { body: { auth_token: token } };
            rq.get(confRoute, params, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(ld.isObject(body.value)).toBeTruthy();
              expect(body.value.title).toBeDefined();
              expect(body.value.field1).toBeUndefined();
              expect(body.value.field2).toBeUndefined();
              done();
            });
          }
        );

        it('should reply with all settings with GET method if admin',
          function (done) {
            withAdmin(function (after) {
              rq.get(confRoute, function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(ld.isObject(body.value)).toBeTruthy();
                expect(body.value.field1).toBe(8);
                expect(body.value.field2).toBe(3);
                expect(ld.size(body.value.field3)).toBe(2);
                after();
              });
            }, done);
          }
        );
      });

      describe('configuration.get GET key', function () {

        it('should return an error if the user if not an etherpad admin',
          function (done) {
            rq.get(confRoute + '/whatever', function (err, resp, body) {
              expect(resp.statusCode).toBe(401);
              expect(body.error).toMatch('AUTHENTICATION.ADMIN');
              done();
            });
          }
        );

        it('should return an error if the field does not exist',
          function (done) {
            withAdmin(function (after) {
              rq.get(confRoute + '/inexistent', function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('CONFIGURATION.KEY_NOT_FOUND');
                expect(body.key).toBe('inexistent');
                after();
              });
            }, done);
          }
        );

        it('should give the key and the value otherwise', function (done) {
          withAdmin(function (after) {
            rq.get(confRoute + '/field1', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe('field1');
              expect(body.value).toBe(8);
              after();
            });
          }, done);
        });
      });

      describe('configuration.set POST/PUT key value', function () {

        it('post : should return an error if key and/or value are not provided',
          function (done) {
            withAdmin(function (after) {
              rq.post(confRoute, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('KEY_STR');
                var b = { body: { key: 'field1' } };
                rq.post(confRoute, b, function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('VALUE_REQUIRED');
                  after();
                });
              });
            }, done);
          }
        );

        it('put : should return an error if key is not in URL and if no value',
          function (done) {
            withAdmin(function (after) {
              rq.put(confRoute, function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body).toMatch('Cannot PUT');
                rq.put(confRoute + '/field1', function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('VALUE_REQUIRED');
                  after();
                });
              });
            }, done);
          }
        );

        it('post : should save good request like expected', function (done) {
          var b = { body: { key: 'field1', value: 'éèà' } };
          withAdmin(function (after) {
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
                after();
              });
            });
          }, done);
        });

        it('put : should save good request like expected', function (done) {
          var b = { body: { value: 42 } };
          withAdmin(function (after) {
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
                after();
              });
            });
          }, done);
        });


      });

      describe('configuration.del DELETE key', function () {

        it('will not return an error if the field does not exist',
          function (done) {
            withAdmin(function (after) {
              rq.del(confRoute + '/inexistent', function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                expect(body.key).toBe('inexistent');
                after();
              });
            }, done);
          }
        );

        it('should deletes the record and returns the key, value and success' +
         ' otherwise', function (done) {
           withAdmin(function (after) {
            rq.del(confRoute + '/field1', function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe('field1');
              rq.get(confRoute + '/field1', function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('CONFIGURATION.KEY_NOT_FOUND');
                expect(body.key).toBe('field1');
                after();
              });
            });
           }, done);
          }
        );

      });
    });

    describe('user inactive account limitations', function () {

      beforeAll(function (done) {
        conf.cache.checkMails = true;
        var params = {
          login: 'shelly',
          password: 'lovesKubiak',
          email: 'shelly@lewis.me'
        };
        user.set(params, done);
      });

      afterAll(function (done) {
        conf.cache.checkMails = false;
        rq.get(route + 'auth/logout', done);
      });

      it('should create in inactive account according to the configuration',
        function (done) {
          var b =  { login: 'shelly', password: 'lovesKubiak' };
          rq.post(route + 'auth/login', { body: b },
            function (err, resp, body) {
              expect(err).toBeNull();
              expect(body.error).toMatch('ACTIVATION_NEEDED');
              done();
            }
          );
        }
      );

    });

    describe('user API', function () {
      var userRoute = route + 'user';
      var userlistRoute = route + 'userlist';
      var token;

      beforeAll(function (done) {
        conf.init(function () {
          var set = require('../../model/user.js').set;
          set(guest, function () {
            var p = {
              login: 'jerry',
              password: 'willnotlivelong',
              email: 'jerry@steiner.me'
            };
            set(p, function () {
              p.login = 'mikey';
              p.email = 'mikey@randall.me';
              set(p, function () {
                rq.post(route + 'auth/login', { body: guest },
                  function (err, resp, b) {
                    if (!err && resp.statusCode === 200) {
                      token = b.token;
                      done();
                    }
                  }
                );
              });
            });
          });
        });
      });

      afterAll(function (done) {
        var b = { body: { auth_token: token } };
        rq.get(route + 'auth/logout', b, done);
      });

      describe('user.set/add POST and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.post(userRoute, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PARAM_STR');
              var b = { body: { login: 'parker', password: '' } };
              rq.post(userRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('PARAM_STR');
                b = { body: {
                  login: 'parker',
                  password: 'secret',
                  email: 'parker@lewis.me'
                } };
                rq.post(userRoute, b, function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('PASSWORD_SIZE');
                  done();
                });
              });
            });
          }
        );

        it('should return an error if password size is not correct',
          function (done) {
            var b = { body: {
              login: 'parker',
              password: '1',
              email: 'parker@lewis.me'
            } };
            rq.post(userRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PASSWORD_SIZE');
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
              lastname: 'Lewis',
              email: 'parker@lewis.me'
            }
          };
          rq.post(userRoute, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe('parker');
            expect(body.value.login).toBe('parker');
            expect(body.value.lastname).toBe('Lewis');
            withAdmin(function (after) {
              rq.get(userRoute + '/parker', function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.value.login).toBe('parker');
                expect(body.value.firstname).toBe('Parker');
                expect(ld.isArray(body.value.groups)).toBeTruthy();
                after();
              });
            }, done);
          });
        });

        it('should return an error if the login/key already exists',
          function (done) {
            var b = { body: {
              login: 'mikey',
              password: 'missMusso',
              email: 'mikey@randall.me'
            } };
            rq.post(userRoute, b, function () {
              rq.post(userRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('USER.ALREADY_EXISTS');
                done();
              });
            });
          }
        );

        it('should return an error if the email already exists',
          function (done) {
            var b = { body: {
              login: 'martin',
              password: 'mondovideo',
              email: 'jerry@steiner.me'
            } };
            rq.post(userRoute, b, function () {
              rq.post(userRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('USER.EMAIL_ALREADY_EXISTS');
                done();
              });
            });
          }
        );

      });

      describe('user.set PUT key in URL and value as params', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            var b = { body: { auth_token: token } };
            rq.put(userRoute + '/guest', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PARAM_STR');
              b = { body: { login: 'guest', password: '' } };
              b.body.auth_token = token;
              rq.put(userRoute + '/guest', b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('PARAM_STR');
                b = { body: { login: 'guest', password: 'secret' } };
                b.body.auth_token = token;
                rq.put(userRoute + '/guest', b, function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('EMAIL');
                  b.body.email = 'guest@phantomatic.net';
                  rq.put(userRoute + '/guest', b, function (err, resp, body) {
                    expect(resp.statusCode).toBe(400);
                    expect(body.error).toMatch('PASSWORD_SIZE');
                    done();
                  });
                });
              });
            });
          }
        );

        it('should return an error if password size is not correct',
          function (done) {
            var b = { body: {
              login: 'guest',
              password: '1',
              email: 'guest@phantomatic.net'
            } };
            b.body.auth_token = token;
            rq.put(userRoute + '/guest', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PASSWORD_SIZE');
              done();
            });
          }
        );

        it('should not be allowed to create a user', function (done) {
          var b = {
            body: {
              password: 'lovesKubiak',
              firstname: 'Parker',
              lastname: 'Lewis',
              email: 'parker@lewis.me',
              auth_token: token
            }
          };
          rq.put(userRoute + '/parker', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(401);
            expect(body.error).toMatch('DENIED');
            done();
          });
        });

        it('should create a user, if admin, otherwise', function (done) {
          var b = {
            body: {
              password: 'lovesKubiak',
              firstname: 'Parker',
              lastname: 'Lewis',
              email: 'parker@lewis.me'
            }
          };
          withAdmin(function (after) {
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
                after();
              });
            });
          }, done);
        });

        it('should accept changes with no password if admin', function (done) {
          var b = { body: { organization: 'secret' } };
          withAdmin(function (after) {
            rq.put(userRoute + '/parker', b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe('parker');
              expect(body.value.login).toBe('parker');
              expect(body.value.organization).toBe('secret');
              after();
            });
          }, done);
        });

        it('should accept updates on an existing user, if he is logged himself',
          function (done) {
            var b = { body: guest };
            b.body.email =  'guest@phantomatic.weird';
            b.body.auth_token = token;
            rq.put(userRoute + '/guest', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe('guest');
              expect(body.value.email).toBe('guest@phantomatic.weird');
              done();
            });
          }
        );

        xit('should accept login change',
          function (done) {
            var b = { body: { password: 'missMusso', } };
            rq.put(userRoute + '/mikey', b, function () {
              b.body.login = 'mike';
              rq.put(userRoute + '/mikey', b, function (err, resp, body) {
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
            withAdmin(function (after) {
              rq.get(userRoute + '/inexistent', function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('USER.NOT_FOUND');
                expect(body.key).toBe('inexistent');
                after();
              });
            }, done);
          }
        );

        it('should give the login/key and the user attributes, password' +
          ' excepted otherwise',
          function (done) {
            withAdmin(function (after) {
              rq.get(userRoute + '/parker', function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.value.login).toBe('parker');
                expect(body.value.firstname).toBe('Parker');
                expect(ld.isArray(body.value.groups)).toBeTruthy();
                after();
              });
            }, done);
          }
        );

      });

      describe('userlist testing', function () {
        var ulists;

        describe('userlist POST', function () {

          it('should return an error if no name is sent', function (done) {
            var b = { body: { auth_token: token } };
            rq.post(userlistRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('USERLIST_NAME');
              done();
            });
          });

          it('should allow creation otherwise', function (done) {
            var b = { body: { name: 'friends' } };
            b.body.auth_token = token;
            rq.post(userlistRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              ulists = body.value;
              expect(body.value).toBeDefined();
              expect(ld.size(body.value)).toBe(1);
              expect(ld.values(ulists)[0].name).toBe('friends');
              done();
            });
          });

        });

        describe('userlist PUT', function () {

          it('should return an error if the userlist is not found',
            function (done) {
              var b = { body: { name: 'Useless' } };
              b.body.auth_token = token;
              rq.put(userlistRoute + '/inexistent', b,
                function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('NOT_FOUND');
                  done();
                }
              );
            }
          );

          it('should return an error for set if no uids or no name are given',
            function (done) {
              var b = { body: { auth_token: token } };
              rq.put(userlistRoute + '/' + ld.keys(ulists)[0], b,
                function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('USERLIST_SET_PARAMS');
                  done();
                }
              );
            }
          );

          it('should update a list name', function (done) {
            var ulkey = ld.keys(ulists)[0];
            var b = { body: { name: 'Good friends' } };
            b.body.auth_token = token;
            rq.put(userlistRoute + '/' + ulkey, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              ulists = body.value;
              expect(ld.isObject(ulists)).toBeTruthy();
              var ul = ld.values(ulists)[0];
              expect(ul.name).toBe('Good friends');
              done();
            });
          });

          it('should update a list with filtered logins or emails',
            function (done) {
              var ulk = ld.keys(ulists)[0];
              var b = { body: {
                loginsOrEmails: ['inexistent', 'mikey@randall.me', 'jerry']
              } };
              b.body.auth_token = token;
              rq.put(userlistRoute + '/' + ulk, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                ulists = body.value;
                expect(ld.isObject(ulists)).toBeTruthy();
                var ul = ld.values(ulists)[0];
                expect(ul.name).toBe('Good friends');
                expect(ld.isArray(ul.uids)).toBeTruthy();
                expect(ld.size(ul.uids)).toBe(2);
                expect(ld.isArray(ul.users)).toBeTruthy();
                expect(ld.size(ul.users)).toBe(2);
                b = { body: { loginsOrEmails: [] } };
                b.body.auth_token = token;
                rq.put(userlistRoute + '/' + ulk, b,
                  function (err, resp, body) {
                    expect(resp.statusCode).toBe(200);
                    expect(body.success).toBeTruthy();
                    ulists = body.value;
                    var ul = ld.values(ulists)[0];
                    expect(ul.name).toBe('Good friends');
                    expect(ld.isArray(ul.uids)).toBeTruthy();
                    expect(ld.isEmpty(ul.uids)).toBeTruthy();
                    expect(ld.isArray(ul.users)).toBeTruthy();
                    expect(ld.isEmpty(ul.users)).toBeTruthy();
                    done();
                  }
                );
              });
            }
          );

        });

        describe('userlist GET', function () {

          it('should return userlists of the current logged user',
            function (done) {
              var b = { body: { auth_token: token } };
              rq.get(userlistRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(200);
                ulists = body.value;
                expect(ld.isObject(ulists)).toBeTruthy();
                expect(ld.size(ulists)).toBe(1);
                expect(ld.values(ulists)[0].name).toBe('Good friends');
                done();
              });
            }
          );

        });

        describe('userlist DELETE', function () {

          it('should return an error if the userlist is not found',
            function (done) {
              var b = { body: { auth_token: token } };
              rq.del(userlistRoute + '/inexistent', b,
                function (err, resp, body) {
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('NOT_FOUND');
                  done();
                }
              );
            }
          );

          it('should otherwise delete an userlist', function (done) {
            var b = { body: { auth_token: token } };
            var ulkey = ld.keys(ulists)[0];
            rq.del(userlistRoute + '/' + ulkey, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              ulists = body.value;
              expect(ld.isObject(ulists)).toBeTruthy();
              expect(ld.isEmpty(ulists)).toBeTruthy();
              done();
            });
          });


        });

      });

      describe('user.mark POST', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            var b = { body: { auth_token: token } };
            rq.post(userRoute + 'mark', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('TYPE_PADSORGROUPS');
              done();
            });
          }
        );

        it('will return an error if the bookmark id does not exist',
          function (done) {
            var b = { body: { type: 'pads', key:'xxx' } };
            b.body.auth_token = token;
            rq.post(userRoute + 'mark', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('BOOKMARK_NOT_FOUND');
              done();
            });
          }
        );

        it('should mark or unmark successfully otherwise',
          function (done) {
            var b = { body: { auth_token: token } };
            rq.get(userRoute + '/guest', b, function (err, resp, body) {
              b.body.name = 'group1';
              b.body.admin = body.value._id;
              b.body.visibility = 'restricted';
              rq.post(route + 'group', b, function (err, resp, body) {
                b = { body: { type: 'groups', key: body.value._id } };
                b.body.auth_token = token;
                rq.post(userRoute + 'mark', b, function (err, resp, body) {
                  expect(resp.statusCode).toBe(200);
                  expect(body.success).toBeTruthy();
                  done();
                });
              });
            });
          }
        );

      });

      describe('user password recovery POST', function () {

        it('should complain about missing email', function (done) {
          rq.post(route + 'passrecover', function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(400);
            expect(body.error).toMatch('TYPE');
            done();
          });
        });

        it('should complain about invalid email', function (done) {
          var b = { body: { email: 'inexistent' } };
          rq.post(route + 'passrecover', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(400);
            expect(body.error).toMatch('TYPE');
            done();
          });
        });

        it('should complain about not found user', function (done) {
          var b = { body: { email: 'inexistent@example.org' } };
          rq.post(route + 'passrecover', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(404);
            expect(body.error).toMatch('USER.NOT_FOUND');
            done();
          });
        });

        it('should complain about not configured rootUrl setting',
          function (done) {
            var b = { body: { email: 'guest@phantomatic.weird' } };
            rq.post(route + 'passrecover', b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(501);
              expect(body.error).toMatch('ROOTURL_NOT_CONFIGURED');
              done();
            });
          }
        );

        it('should complain about not configured mail settings',
          function (done) {
            conf.cache.rootUrl = 'http://localhost:8042';
            var b = { body: { email: 'guest@phantomatic.weird' } };
            rq.post(route + 'passrecover', b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(501);
              expect(body.error).toMatch('MAIL_NOT_CONFIGURED');
              done();
            });
          }
        );

      });

      describe('user password recovery PUT', function () {

        afterAll(function () {
          mail.tokens = {};
          mail.ends = {};
        });

        it('should return an error if the token value is incorrect',
          function (done) {
            rq.put(route + 'passrecover/invalid', function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('TOKEN.INCORRECT');
              var token = mail.genToken({ login: 'guest', action: 'another' });
              rq.put(route + 'passrecover/' + token,
                function (err, resp, body) {
                  expect(err).toBeNull();
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('TOKEN.INCORRECT');
                  token = mail.genToken({ action: 'passrecover' });
                  rq.put(route + 'passrecover/' + token,
                    function (err, resp, body) {
                      expect(err).toBeNull();
                      expect(resp.statusCode).toBe(400);
                      expect(body.error).toMatch('TOKEN.INCORRECT');
                      done();
                    }
                  );
                }
              );
            });
          }
        );

        it('should return an error if the token is no more valid',
          function (done) {
            conf.cache.tokenDuration = -1;
            var tk = mail.genToken({ login: 'guest', action: 'passrecover' });
            rq.put(route + 'passrecover/' + tk, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('TOKEN.EXPIRED');
              conf.cache.tokenDuration = 60;
              done();
            });
          }
        );

        it('should return an error if the passwords are not given or mismatch',
          function (done) {
            var tk = mail.genToken({ login: 'guest', action: 'passrecover' });
            rq.put(route + 'passrecover/' + tk, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PASSWORD_MISMATCH');
              var b = { body: { password: 'aPass', passwordConfirm: '2' } };
              rq.put(route + 'passrecover/' + tk, b,
                function (err, resp, body) {
                  expect(err).toBeNull();
                  expect(resp.statusCode).toBe(400);
                  expect(body.error).toMatch('PASSWORD_MISMATCH');
                  conf.cache.tokenDuration = 60;
                  done();
                }
              );
            });
          }
        );

        it('should forbid bad password', function (done) {
          var tk = mail.genToken({ login: 'guest', action: 'passrecover' });
          var b = { body: { password: 'short', passwordConfirm: 'short' } };
          rq.put(route + 'passrecover/' + tk, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(400);
            expect(body.error).toMatch('TYPE.PASSWORD_SIZE');
            done();
          });
        });

        it('should change password otherwise', function (done) {
          var tk = mail.genToken({ login: 'guest', action: 'passrecover' });
          var b = { body: {
            password: 'aBetterPassword',
            passwordConfirm: 'aBetterPassword'
          } };
          rq.put(route + 'passrecover/' + tk, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.login).toBe('guest');
            expect(body.success).toBeTruthy();
            done();
          });
        });

      });

      describe('user account confirmation POST', function () {

        afterAll(function () {
          mail.tokens = {};
          mail.ends = {};
        });

        it('should return an error if the token value is incorrect',
          function (done) {
            rq.post(route + 'accountconfirm', function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('TOKEN.INCORRECT');
              var tk = mail.genToken({ login: 'guest', action: 'another' });
              var b = { body: { token: tk } };
              rq.post(route + 'accountconfirm', b, function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('TOKEN.INCORRECT');
                done();
              });
            });
          }
        );

        it('should return an error if the token is no more valid',
          function (done) {
            conf.cache.tokenDuration = -1;
            var tk = mail.genToken({ login: 'xxx', action: 'accountconfirm' });
            var b = { body: { token: tk } };
            rq.post(route + 'accountconfirm/', b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('TOKEN.EXPIRED');
              conf.cache.tokenDuration = 60;
              done();
            });
          }
        );

        it('should activate account otherwise', function (done) {
          var tk = mail.genToken({ login: 'guest', action: 'accountconfirm' });
          var b = { body: { token: tk } };
          rq.post(route + 'accountconfirm', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.login).toBe('guest');
            expect(body.success).toBeTruthy();
            done();
          });
        });

      });


      describe('user.del DELETE and key/login', function () {

        it('will return an error if the user does not exist',
          function (done) {
            withAdmin(function (after) {
              rq.del(userRoute + '/inexistent', function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('USER.NOT_FOUND');
                after();
              });
            }, done);
          }
        );

        it('should delete the record and returns the key and success' +
         ' otherwise', function (done) {
            var b = { body: { auth_token: token } };
            rq.del(userRoute + '/guest', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe('guest');
              withAdmin(function (after) {
                rq.get(userRoute + '/guest', function (err, resp, body) {
                  expect(resp.statusCode).toBe(404);
                  expect(body.error).toMatch('USER.NOT_FOUND');
                  after();
                });
              }, done);
            });
          }
        );

      });

    });

    describe('group API', function () {
      var groupRoute = route + 'group';
      var uid;
      var gid;
      var uotherid;
      var gotherid;
      var gprivateid;
      var token;

      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          var params = guest;
          var oparams = {
            login: 'other',
            password: 'willnotlivelong',
            email: 'other@phantomatic.net'
          };
          user.set(params, function (err, u) {
            if (err) { console.log(err); }
            uid = u._id;
            user.set(oparams, function (err, u) {
              if (err) { console.log(err); }
              uotherid = u._id;
              group.set({ name: 'g1', admin: uid, visibility: 'public' },
                function (err, res) {
                  if (err) { console.log(err); }
                  gid = res._id;
                  group.set({ name: 'gother1', admin: uotherid },
                    function (err, res) {
                    if (err) { console.log(err); }
                    gotherid = res._id;
                    var gparams = {
                      name: 'gprivate1',
                      admin: uotherid,
                      visibility: 'private',
                      password: 'secret'
                    };
                    group.set(gparams, function (err, res) {
                      if (err) { console.log(err); }
                      gprivateid = res._id;
                      rq.post(route + 'auth/login', { body: params },
                        function (err, resp, body) {
                          if (!err && resp.statusCode === 200) {
                            token = body.token;
                            done();
                          }
                        }
                      );
                    });
                  });
                }
              );
            });
          });
        });
      });

      afterAll(function (done) {
        var b = { body: { auth_token: token } };
        rq.get(route + 'auth/logout', b, function () {
          specCommon.reInitDatabase(done);
        });
      });

      describe('group.inviteOrShare POST', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.post(groupRoute + '/invite', function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PARAMS_REQUIRED');
              done();
            });
          }
        );

        it('will return an error if the group id does not exist',
          function (done) {
            var b = {
              body: {
                invite: true,
                gid:'xxx',
                loginsOrEmails: ['one', 'two'] 
              }
            };
            rq.post(groupRoute + '/invite', b, function (err, resp) {
              expect(resp.statusCode).toBe(401);
              done();
            });
          }
        );

        it('forbid invitation if the user is not group admin', function (done) {
          var b = {
            body: {
              invite: true,
              gid: gotherid,
              loginsOrEmails: ['one', 'two']
            }
          };
          rq.post(groupRoute + '/invite', b, function (err, resp) {
            expect(resp.statusCode).toBe(401);
            done();
          });
        });

        it('allow invitation if the user is global admin', function (done) {
          var b = {
            body: {
              invite: true,
              gid: gotherid,
              loginsOrEmails: ['one', 'two']
            }
          };
          withAdmin(function (after) {
            rq.post(groupRoute + '/invite', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(ld.isObject(body.value)).toBeTruthy();
              expect(body.value._id).toBe(gotherid);
              after();
            });
          }, done);
        });

        it('should invite successfully otherwise', function (done) {
          var params = {
            login: 'franky',
            password: 'willnotlivelong',
            email: 'franky@keller.me'
          };
          user.set(params, function (err, u) {
            expect(err).toBeNull();
            var b = {
              body: {
                invite: true,
                gid: gid,
                loginsOrEmails: [u.login, 'inexistent'],
                auth_token: token
              }
            };
              rq.post(groupRoute + '/invite', b, function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                expect(ld.isObject(body.value)).toBeTruthy();
                expect(ld.first(body.value.users)).toBe(u._id);
                expect(ld.isObject(body.present)).toBeTruthy();
                expect(ld.isObject(body.absent)).toBeTruthy();
                expect(ld.size(body.present)).toBe(1);
                expect(ld.first(body.present)).toBe(u.login);
                expect(ld.size(body.absent)).toBe(1);
                expect(ld.first(body.absent)).toBe('inexistent');
                done();
              });
            });
          }
        );

      });

      describe('group.resign POST', function () {

        it('should return error when arguments are not as expected',
          function (done) {
            rq.post(groupRoute + '/resign', function (err, resp) {
              expect(resp.statusCode).toBe(401);
              done();
            });
          }
        );

        it('will return an error if the group or user id does not exist',
          function (done) {
            var b = { body: { gid:'xxx', uid: 'xxx' } };
            rq.post(groupRoute + '/resign', b, function (err, resp) {
              expect(resp.statusCode).toBe(401);
              done();
            });
          }
        );

        it('should forbid resignation if the user is not part of the group',
          function (done) {
            var b = { body: { gid: gotherid } };
            rq.post(groupRoute + '/resign', b, function (err, resp) {
              expect(resp.statusCode).toBe(401);
              done();
            });
          }
        );

        it('should forbid resignation if the user is the unique admin',
          function (done) {
            var b = { body: { gid: gid } };
            rq.post(groupRoute + '/resign', b, function (err, resp) {
              expect(resp.statusCode).toBe(401);
              done();
            });
          }
        );

        it('should allow resignation otherwise', function (done) {
          group.set({ name: 'newg', admin: uid, admins: [ uotherid ] },
            function (err, g) {
              expect(err).toBeNull();
              var b = { body: { gid: g._id } };
              b.body.auth_token = token;
              rq.post(groupRoute + '/resign', b, function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                expect(ld.isObject(body.value)).toBeTruthy();
                var users = ld.union(body.value.users, body.value.admins);
                expect(ld.includes(users, uid)).toBeFalsy();
                done();
                group.del(g._id, function (err) {
                  expect(err).toBeNull();
                  done();
                });
              });
            }
          );
        });

      });

      describe('group.getByUser GET', function () {

        it('should return groups, pads and users', function (done) {
          var b = { body: { auth_token: token } };
          rq.get(groupRoute, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(ld.isObject(body.value)).toBeTruthy();
            expect(ld.isObject(body.value.groups)).toBeTruthy();
            expect(ld.isObject(body.value.pads)).toBeTruthy();
            expect(ld.isObject(body.value.users)).toBeTruthy();
            var groups = body.value.groups;
            var key = ld.first(ld.keys(groups));
            expect(groups[key].name).toBe('g1');
            expect(groups[key].visibility).toBe('public');
            expect(groups[key].password).toBeUndefined();
            var admin = ld.first(ld.values(body.value.users));
            expect(admin.login).toBe('guest');
            expect(admin._id).toBeDefined();
            expect(admin.firstname).toBeDefined();
            expect(admin.lastname).toBeDefined();
            expect(admin.email).toBeDefined();
            expect(admin.password).toBeUndefined();
            done(); 
          });
        });
      });

      describe('group.get GET and id', function () {

        it('should return an error if the id does not exist',
          function (done) {
            rq.get(groupRoute + '/ginexistent', function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('KEY_NOT_FOUND');
              expect(body.key).toBe('ginexistent');
              done();
            });
          }
        );

        it('should forbid access to others groups for regular users',
          function (done) {
            rq.get(groupRoute + '/' + gotherid, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(401);
              expect(body.error).toMatch('DENIED_RECORD');
              done();
            });
          }
        );

        it('should allow access to public groups for unauth users',
          function (done) {
            var b = {
              body: {
                name: 'groupPublic',
                admin: uid,
                visibility: 'public',
                auth_token: token
              }
            };
            rq.post(groupRoute, b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              var key = body.key;
              rq.get(route + 'auth/logout', b, function () {
                rq.get(groupRoute + '/' + key, function (err, resp, body) {
                  expect(err).toBeNull();
                  expect(resp.statusCode).toBe(200);
                  expect(body.key).toBeDefined();
                  var g = body.value;
                  var pads = body.pads;
                  expect(g.name).toBe('groupPublic');
                  expect(ld.size(pads)).toBe(0);
                  var params = { login: 'guest', password: 'willnotlivelong' };
                  rq.post(route + 'auth/login', { body: params },
                    function (err, resp, body) {
                      if (!err && resp.statusCode === 200) {
                        token = body.token;
                        done();
                      }
                    }
                  );
                });
              });
            });
          }
        );

        it('should return filtered pads for public access groups',
          function (done) {
            var b = { body: { name: 'public', group: gid } };
            b.body.auth_token = token;
            rq.post(route + 'pad', b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              b.body.visibility = 'private';
              b.body.password = 'password';
              rq.post(route + 'pad', b, function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                b = { body: { auth_token: token } };
                rq.get(route + 'auth/logout', b, function () {
                  rq.get(groupRoute + '/' + gid, function (err, resp, body) {
                    expect(err).toBeNull();
                    expect(resp.statusCode).toBe(200);
                    expect(body.key).toBe(gid);
                    var pads = body.pads;
                    expect(ld.size(pads)).toBe(1);
                    expect(ld.values(pads)[0].name).toBe('public');
                    var pms = { login: 'guest', password: 'willnotlivelong' };
                    rq.post(route + 'auth/login', { body: pms },
                      function (err, resp, body) {
                        if (!err && resp.statusCode === 200) {
                          token = body.token;
                          done();
                        }
                      }
                    );
                  });
                });
              });
            });
          }
        );

        it('should return a subset for unauth or non-admin for private group',
          function (done) {
            rq.get(groupRoute + '/' + gprivateid, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(gprivateid);
              expect(body.pads).toBeUndefined();
              var diff = ld.difference(ld.keys(body.value),
                ['name', 'visibility']);
              expect(diff.length).toBe(0);
              expect(body.value.name).toBe('gprivate1');
              expect(body.value.visibility).toBe('private');
              done();
            });
          }
        );

        it('should return an error in case of private unauth or non-admin ' +
          'if password is bad', function (done) {
            var route = groupRoute + '/' + gprivateid + '?password=badOne';
            rq.get(route, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(401);
              expect(body.key).toBe(gprivateid);
              expect(body.error).toMatch('PERMISSION.UNAUTHORIZED');
              done();
            });
          }
        );

        it('should return the group in case of private unauth or non-admin ' +
          'if password is correct', function (done) {
            var route = groupRoute + '/' + gprivateid + '?password=secret';
            rq.get(route, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(gprivateid);
              expect(body.value.name).toBe('gprivate1');
              expect(body.value.visibility).toBe('private');
              expect(body.value.readonly).toBeFalsy();
              expect(ld.isArray(body.value.tags)).toBeTruthy();
              expect(ld.isObject(body.pads)).toBeTruthy();
              expect(ld.isEmpty(body.pads)).toBeTruthy();
              done();
            });
          }
        );

        it('should allow access to regular user if group is public',
          function (done) {
            rq.get(groupRoute + '/' + gid, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(gid);
              expect(body.value.name).toBe('g1');
              expect(ld.size(body.pads)).toBe(1);
              done();
            });
          }
        );

        it('should allow access to all groups for admin', function (done) {
          withAdmin(function (after) {
            rq.get(groupRoute + '/' + gotherid, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(gotherid);
              expect(body.value.name).toBe('gother1');
              after();
            });
          }, done);
        });

        it('should give the key and the group attributes otherwise',
          function (done) {
            rq.get(groupRoute + '/' + gid, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(gid);
              expect(body.value._id).toBe(gid);
              expect(body.value.name).toBe('g1');
              expect(body.value.visibility).toBe('public');
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
            rq.post(groupRoute, function (err, resp) {
              expect(resp.statusCode).toBe(401);
              var b = { body: { visibility: 'public' } };
              rq.post(groupRoute, b, function (err, resp) {
                expect(resp.statusCode).toBe(401);
                done();
              });
            });
          }
        );

        it('should return an error if admin user does not exist',
          function (done) {
            var b = { body: { name: 'group1', admin: 'inexistentId' } };
            withAdmin(function (after) {
              rq.post(groupRoute, b, function (err, resp) {
                expect(resp.statusCode).toBe(401);
                after();
              });
            }, done);
          }
        );

        it('should return an error if visibility is private with invalid ' +
          'password', function (done) {
            var b = {
              body: {
                name: 'groupOk',
                admin: uid,
                visibility: 'private'
              }
            };
            rq.post(groupRoute, b, function (err, resp) {
              expect(resp.statusCode).toBe(401);
              done();
            });
          }
        );

        it('should force admin id to be the current user, unless ether admin',
          function (done) {
            var b = { body: { name: 'groupOk', admin: uotherid } };
            b.body.auth_token = token;
            rq.post(groupRoute, b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBeDefined();
              expect(body.value.name).toBe('groupOk');
              expect(body.value.admins[0]).not.toBe(uotherid);
              expect(body.value.admins[0]).toBe(uid);
              withAdmin(function (after) {
                rq.post(groupRoute, b, function (err, resp, body) {
                  expect(err).toBeNull();
                  expect(resp.statusCode).toBe(200);
                  expect(body.value.admins[0]).toBe(uotherid);
                  after();
                });
              }, done);
            });
          }
        );

        it('should create a new group otherwise', function (done) {
          var b = {
            body: {
              name: 'groupOk',
              description: 'a cool new group',
              admin: uid,
              visibility: 'private',
              password: 'secret',
              auth_token: token
            }
          };
          rq.post(groupRoute, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBeDefined();
            var key = body.key;
            expect(body.value.name).toBe('groupOk');
            expect(body.value.description).toBe('a cool new group');
            rq.get(groupRoute + '/' + key + '?auth_token=' + token,
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
            rq.put(groupRoute + '/' + gid, function (err, resp) {
              expect(resp.statusCode).toBe(401);
              var b = { body: { name: 'group1' } };
              rq.put(groupRoute + '/' + gid, b, function (err, resp) {
                expect(resp.statusCode).toBe(401);
                b = { body: { name: 'group1', admin: 'inexistentId' } };
                rq.put(groupRoute + '/' + gid, b, function (err, resp) {
                  expect(resp.statusCode).toBe(401);
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
              description: 'an updated one',
              admin: uid,
              visibility: 'public',
              readonly: true,
              auth_token: token
            }
          };
          rq.put(groupRoute + '/' + gid, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe(gid);
            expect(body.value.name).toBe('gUpdated');
            expect(body.value.description).toBe('an updated one');
            rq.get(groupRoute + '/' + gid, b,
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

        it('should not create a non existent group', function (done) {
          var b = {
            body: {
              name: 'gCreated',
              admin: uid,
              visibility: 'public',
              readonly: true,
              auth_token: token
            }
          };
          rq.put(groupRoute + '/newgid', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(400);
            expect(body.error).toMatch('NOT_FOUND');
            done();
          });
        });

        it('shouldn\'t allow update of a group when the user is not admin',
          function (done) {
            var b = {
              body: {
                _id: gotherid,
                name: 'gOtherUpdated',
                admin: uotherid,
                visibility: 'public',
                auth_token: token
              }
            };
            rq.put(groupRoute + '/' + gotherid, b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(401);
              expect(body.error).toMatch('DENIED_RECORD_EDIT');
              done();
            });
          }
        );

        it('should allow update all groups when the user is global admin',
          function (done) {
            var goid = gotherid;
            var b = {
              body: {
                _id: goid,
                name: 'gOtherUpdated',
                admin: uotherid,
                visibility: 'public'
              }
            };
            withAdmin(function (after) {
              rq.put(groupRoute + '/' + goid, b, function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(body.key).toBe(goid);
                expect(body.value._id).toBe(goid);
                expect(body.value.name).toBe('gOtherUpdated');
                expect(body.value.visibility).toBe('public');
                after();
              });
            }, done);
          }
        );

      });

      describe('group.del DELETE and id', function () {
        it('will return an error if the group does not exist',
          function (done) {
            var b = { body: { auth_token: token } };
            rq.del(groupRoute + '/inexistentId', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('KEY_NOT_FOUND');
              done();
            });
          }
        );

        it('should deletes the record and returns the key and success' +
         ' otherwise', function (done) {
            var b = { body: { auth_token: token } };
            rq.del(groupRoute + '/' + gid, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe(gid);
              rq.get(groupRoute + '/' + gid, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('KEY_NOT_FOUND');
                done();
              });
            });
          }
        );

        it('should forbid deleting a record when the user is not an admin of' +
          ' the group', function (done) {
            var b = { body: { auth_token: token } };
            rq.del(groupRoute + '/' + gotherid, b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(401);
              expect(body.error).toMatch('DENIED_RECORD_EDIT');
              done();
            });
          }
        );

        it('should allow deleting a record if the user is a global admin',
          function (done) {
            withAdmin(function (after) {
              rq.del(groupRoute + '/' + gotherid, function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                expect(body.key).toBe(gotherid);
                after();
              });
            }, done);
          }
        );

      });

    });

    describe('pad API', function () {
      var padRoute = route + 'pad';
      var uid;
      var uotherid;
      var gid;
      var gotherid;
      var pid;
      var potherid;
      var ppublicid;
      var token;

      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          var params = guest;
          user.set(params, function (err, u) {
            if (err) { console.log(err); }
            uid = u._id;
            group.set({ name: 'g1', admin: u._id }, function (err, g) {
              if (err) { console.log(err); }
              gid = g._id;
              pad.set({ name: 'p1', group: g._id }, function (err, p) {
                if (err) { console.log(err); }
                pid = p._id;
                var oparams = {
                  login: 'other',
                  password: 'willnotlivelong',
                  email: 'other@phantomatic.net'
                };
                user.set(oparams, function (err, u) {
                  if (err) { console.log(err); }
                  uotherid = u._id;
                  group.set({ name: 'gother1', admin: u._id },
                    function (err, g) {
                      if (err) { console.log(err); }
                      gotherid = g._id;
                      pad.set({ name: 'pother1', group: g._id },
                        function (err, p) {
                          if (err) { console.log(err); }
                          potherid = p._id;
                          pad.set({
                            name: 'ppublic1',
                            group: g._id,
                            visibility: 'public'
                          }, function (err, p) {
                            ppublicid = p._id;
                            rq.post(route + 'auth/login', { body: params },
                              function (err, resp, b) {
                                if (!err && resp.statusCode === 200) {
                                  token = b.token;
                                  done();
                                }
                              }
                            );
                          });
                        }
                      );
                    }
                  );
                });
              });
            });
          });
        });
      });

      afterAll(function (done) {
        var b = { body: { auth_token: token } };
        rq.get(route + 'auth/logout', b, function () {
          specCommon.reInitDatabase(done);
        });
      });

      describe('pad.get GET and id', function () {

        it('should return an error if the id does not exist',
          function (done) {
            var b = { body: { auth_token: token } };
            rq.get(padRoute + '/pinexistent', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('KEY_NOT_FOUND');
              done();
            });
          }
        );

        it('should forbid access to other pads', function (done) {
          var b = { body: { auth_token: token } };
          rq.get(padRoute + '/' + potherid, b, function (err, resp, body) {
            expect(resp.statusCode).toBe(401);
            expect(body.error).toMatch('DENIED_RECORD');
            done();
          });
        });

        it('should allow access to other pads if admin', function (done) {
          withAdmin(function (after) {
            rq.get(padRoute + '/' + potherid, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.key).toBe(potherid);
              expect(body.value._id).toBe(potherid);
              expect(body.value.name).toBe('pother1');
              after();
            });
          }, done);
        });

        it('should allow access to public pads', function (done) {
          rq.get(padRoute + '/' + ppublicid, function (err, resp, body) {
            expect(resp.statusCode).toBe(200);
            expect(body.key).toBe(ppublicid);
            expect(body.value._id).toBe(ppublicid);
            expect(body.value.name).toBe('ppublic1');
            done();
          });
        });

        it('should give the key and the pad attributes otherwise',
          function (done) {
            var b = { body: { auth_token: token } };
            rq.get(padRoute + '/' + pid, b, function (err, resp, body) {
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
            var b = { body: { auth_token: token } };
            rq.post(padRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PARAM_STR');
              var b = { body: { name: 'pad1' } };
              b.body.auth_token = token;
              rq.post(padRoute, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('PARAM_STR');
                done();
              });
            });
          }
        );

        it('should return an error if pad does not exist',
          function (done) {
            var b = { body: { name: 'pad1', group: gid, _id: 'inexistent' } };
            b.body.auth_token = token;
            rq.post(padRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PAD.INEXISTENT');
              done();
            });
          }
        );

        it('should return an error if group does not exist',
          function (done) {
            var b = { body: { name: 'pad1', group: 'inexistentId' } };
            b.body.auth_token = token;
            rq.post(padRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PAD.ITEMS_NOT_FOUND');
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
                users: ['inexistentId'],
                auth_token: token
              }
            };
            rq.post(padRoute, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(400);
              expect(body.error).toMatch('PAD.ITEMS_NOT_FOUND');
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
              password: 'secret',
              auth_token: token
            }
          };
          rq.post(padRoute, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBeDefined();
            var key = body.key;
            expect(body.value.name).toBe('padOk');
            rq.get(padRoute + '/' + key + '?password=secret',
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
            var b = { body: { auth_token: token } };
            rq.put(padRoute, b, function (err, resp) {
              expect(resp.statusCode).toBe(404);
              var b = { body: { name: 'pad1' } };
              b.body.auth_token = token;
              rq.put(padRoute + '/' + pid, b, function (err, resp, body) {
                expect(resp.statusCode).toBe(400);
                expect(body.error).toMatch('PARAM_STR');
                done();
              });
            });
          }
        );

        it('should forbid update of existing other pad', function (done) {
          var b = {
            body: {
              name: 'pother1',
              group: gotherid,
              visibility: 'public',
              readonly: true,
              auth_token: token
            }
          };
          rq.put(padRoute + '/' + potherid, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(401);
            expect(body.error).toMatch('DENIED_RECORD_EDIT');
            done();
          });
        });

        it('should allow update of all pads for global admin', function (done) {
          var b = {
            body: {
              _id: potherid,
              name: 'pother1',
              group: gotherid,
              visibility: 'public',
              readonly: true
            }
          };
          withAdmin(function (after) {
            rq.put(padRoute + '/' + potherid, b, function (err, resp, body) {
              expect(err).toBeNull();
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe(potherid);
              expect(body.value._id).toBe(potherid);
              expect(body.value.visibility).toBe('public');
              expect(body.value.readonly).toBeTruthy();
              after();
            });
          }, done);
        });

        it('should also not create a non existent pad', function (done) {
          var b = {
            body: {
              name: 'pCreated',
              group: gid,
              visibility: 'public',
              readonly: true,
              auth_token: token
            }
          };
          rq.put(padRoute + '/newpid', b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(404);
            expect(body.error).toMatch('KEY_NOT_FOUND');
            done();
          });
        });

        it('should update an existing pad otherwise', function (done) {
          var b = {
            body: {
              _id: pid,
              name: 'pUpdated',
              group: gid,
              visibility: 'public',
              readonly: true,
              auth_token: token
            }
          };
          rq.put(padRoute + '/' + pid, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(200);
            expect(body.success).toBeTruthy();
            expect(body.key).toBe(pid);
            expect(body.value.name).toBe('pUpdated');
            b = { body: { auth_token: token } };
            rq.get(padRoute + '/' + pid, b,
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
            var b = { body: { auth_token: token } };
            rq.del(padRoute + '/inexistentId', b, function (err, resp, body) {
              expect(resp.statusCode).toBe(404);
              expect(body.error).toMatch('KEY_NOT_FOUND');
              done();
            });
          }
        );

        it('should forbid removal for other pads', function (done) {
          var b = { body: { auth_token: token } };
          rq.del(padRoute + '/' + potherid, b, function (err, resp, body) {
            expect(err).toBeNull();
            expect(resp.statusCode).toBe(401);
            expect(body.error).toMatch('DENIED_RECORD_EDIT');
            done();
          });
        });

        it('should allow removal of all pads if the user is global admin',
          function (done) {
            withAdmin(function (after) {
              rq.del(padRoute + '/' + potherid, function (err, resp, body) {
                expect(err).toBeNull();
                expect(resp.statusCode).toBe(200);
                expect(body.success).toBeTruthy();
                expect(body.key).toBe(potherid);
                after();
              });
            }, done);
          }
        );

        it('should deletes the record and returns the key and success' +
         ' otherwise', function (done) {
            var b = { body: { auth_token: token } };
            rq.del(padRoute + '/' + pid, b, function (err, resp, body) {
              expect(resp.statusCode).toBe(200);
              expect(body.success).toBeTruthy();
              expect(body.key).toBe(pid);
              rq.get(padRoute + '/' + pid, function (err, resp, body) {
                expect(resp.statusCode).toBe(404);
                expect(body.error).toMatch('KEY_NOT_FOUND');
                done();
              });
            });
          }
        );
      });
    });
  });

}).call(this);
