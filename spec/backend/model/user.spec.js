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
  var cuid = require('cuid');
  var specCommon = require('../common.js');
  var storage = require('../../../storage.js');
  var conf = require('../../../configuration.js');
  var group = require('../../../model/group.js');
  var user = require('../../../model/user.js');
  var UPREFIX = storage.DBPREFIX.USER;
  var CPREFIX = storage.DBPREFIX.CONF;

  describe('user', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('init', function () {

      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          var genId = function () { return UPREFIX + cuid(); };
          var kv = {};
          kv[genId()] = { login: 'parker' };
          kv[genId()] = { login: 'kubiak' };
          storage.fn.setKeys(kv, done);
        });
      });
      afterAll(specCommon.reInitDatabase);

      it('should populate the user.logins field', function (done) {
        user.init(function (err) {
          expect(err).toBeNull();
          expect(ld.isObject(user.logins)).toBeTruthy();
          expect(ld.size(user.logins)).toBe(2);
          expect(ld.includes(ld.keys(user.logins), 'parker')).toBeTruthy();
          expect(ld.includes(ld.keys(user.logins), 'kubiak')).toBeTruthy();
          done();
        });
      });

    });

    describe('creation', function () {
      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          conf.init(done);
        });
      });
      afterAll(specCommon.reInitDatabase);

      it('should return a TypeError and a message if either login or password' +
        ' aren\'t given; nor callback function', function () {
        expect(user.set).toThrow();
        expect(ld.partial(user.set, { another: 'object' })).toThrow();
        expect(ld.partial(user.set, { login: 'Johnny' })).toThrow();
        expect(ld.partial(user.set, { password: 'secret' })).toThrow();
        expect(ld.partial(user.set, { login: 'john', password: 'secret' }))
          .toThrow();
      });

      it('should return an Error to the callback if password size is not' +
        ' appropriate', function (done) {
        user.set({ login: 'bob', password: '1'}, function (err) {
          expect(ld.isError(err)).toBeTruthy();
          done();
        });
      });

      it('should accept any creation if login & password are fixed',
        function (done) {
          user.set({
            login: 'parker',
            password: 'lovesKubiak',
            firstname: 'Parker',
            lastname: 'Lewis'
          }, function (err, u) {
            expect(err).toBeNull();
            expect(u._id).toBeDefined();
            expect(ld.startsWith(u._id, 'parker-')).toBeTruthy();
            expect(u.active).toBeTruthy();
            expect(u.active).not.toBe(conf.get('checkMails'));
            expect(u.login).toBe('parker');
            expect(ld.isObject(u.password)).toBeTruthy();
            expect(u.firstname).toBe('Parker');
            expect(u.lastname).toBe('Lewis');
            expect(ld.isString(u.organization)).toBeTruthy();
            expect((ld.isArray(u.groups) && ld.isEmpty(u.groups))).toBeTruthy();
            expect(ld.isObject(u.bookmarks)).toBeTruthy();
            expect(ld.isArray(u.bookmarks.groups)).toBeTruthy();
            expect(ld.isArray(u.bookmarks.pads)).toBeTruthy();
            var okUls = (ld.isObject(u.userlists) && ld.isEmpty(u.userlists));
            expect(okUls).toBeTruthy();
            expect(ld.includes(ld.values(user.logins), u._id)).toBeTruthy();
            expect((user.logins[u.login])).toBe(u._id);
            done();
          });
        }
      );

      it('should ignore fixing groups and userlists for a valid creation',
        function (done) {
          user.set({
            login: 'grace',
            password: 'isTheDirector',
            groups: ['one', 'two'],
            userlists: { uidxxxx: { name: 'u1', users: [] } }
          }, function (err, u) {
            expect(err).toBeNull();
            expect(u._id).toBeDefined();
            expect(u.login).toBe('grace');
            expect(ld.isObject(u.password)).toBeTruthy();
            expect((ld.isArray(u.groups) && ld.isEmpty(u.groups))).toBeTruthy();
            var okUls = (ld.isObject(u.userlists) && ld.isEmpty(u.userlists));
            expect(okUls).toBeTruthy();
            expect(ld.includes(ld.values(user.logins), u._id)).toBeTruthy();
            expect((user.logins[u.login])).toBe(u._id);
            done();
          });
        }
      );

      it('should deny usage of an existing login', function (done) {
        user.set({ login: 'parker', password: 'lovesKubiak' },
          function (err, u) {
            expect(ld.isError(err)).toBeTruthy();
            expect(u).toBeUndefined();
            done();
          }
        );
      });
    });

    describe('edition', function () {
      var mikey;
      beforeAll(function (done) {
        conf.init(function () {
          user.set({ login: 'mikey', password: 'principalMusso' },
            function (err, u) {
              if (err) { console.log(err); }
              mikey = u;
              done();
            }
          );
        });
      });

      it('should return a TypeError and a message if _id is not given, ' +
       'nor callback function', function () {
        expect(user.set).toThrow();
        expect(ld.partial(user.set, { another: 'object' })).toThrow();
        expect(ld.partial(user.set, { _id: 'Johnny' })).toThrow();
        expect(ld.partial(user.set, { another: 'object' }, ld.noop)).toThrow();
      });

      it('should return an Error if the user does not already exist',
        function (done) {
          user.set({ _id: 'inexistent', login: 'i', password: 'p' },
            function (err, u) {
              expect(ld.isError(err)).toBeTruthy();
              expect(u).toBeUndefined();
              done();
            }
          );
        }
      );

      it('should return an Error to the callback if password size is not' +
        ' appropriate', function (done) {
        user.set({ login: 'bob', password: '1'}, function (err, res) {
          expect(ld.isError(err)).toBeTruthy();
          expect(res).toBeUndefined();
          done();
        });
      });

      it('should allow setting of an existing user, and gets back its groups,' +
        ' bookmarks, userlists and active', function (done) {
          group.set({ name: 'g1', admin: mikey._id }, function (err) {
            expect(err).toBeNull();
            var opts = { crud: 'add', login: 'mikey', name: 'u1' };
            user.userlist(opts, function (err) {
              expect(err).toBeNull();
              user.set({
                _id: mikey._id,
                login: 'mikey',
                password: 'principalMusso',
                email: 'mik@randall.com',
                firstname: 'Michael',
                lastname: 'Randall'
              },
                function (err, u) {
                  expect(err).toBeNull();
                  expect(ld.startsWith(u._id, 'mikey-')).toBeTruthy();
                  expect(u.login).toBe('mikey');
                  expect(u.email).toBe('mik@randall.com');
                  expect(u.firstname).toBe('Michael');
                  expect(u.lastname).toBe('Randall');
                  expect(ld.isArray(u.groups)).toBeTruthy();
                  expect(u.groups.length).toBe(1);
                  expect(ld.isObject(u.bookmarks)).toBeTruthy();
                  expect(ld.isObject(u.userlists)).toBeTruthy();
                  expect(ld.size(u.userlists)).toBe(1);
                  expect(u.active).toBeTruthy();
                  expect(u.active).not.toBe(conf.get('checkMails'));
                  done();
                }
              );
            });
          });
        }
      );

    });
  });

  describe('user get', function () {
    beforeAll(function (done) {
      specCommon.reInitDatabase(function () {
        user.set({
          login: 'parker',
          password: 'lovesKubiak',
          firstname: 'Parker',
          lastname: 'Lewis'
        }, done);
      });
    });
    afterAll(specCommon.reInitDatabase);

    it('should throw errors if arguments are not provided as expected',
      function () {
        expect(user.get).toThrow();
        expect(ld.partial(user.get, 123)).toThrow();
      }
    );

    it('should return an Error if the user is not found', function (done) {
      user.get('inexistent', function (err, u) {
        expect(ld.isError(err)).toBeTruthy();
        expect(u).toBeUndefined();
        done();
      });
    });

    it('should return the user otherwise', function (done) {
      user.get('parker', function (err, u) {
        expect(err).toBeNull();
        expect(u._id).toBeDefined();
        expect(ld.startsWith(u._id, 'parker-')).toBeTruthy();
        expect(u.login).toBe('parker');
        expect(ld.isObject(u.password)).toBeTruthy();
        expect(u.firstname).toBe('Parker');
        expect(u.lastname).toBe('Lewis');
        expect(ld.isString(u.email)).toBeTruthy();
        done();
      });
    });
  });

  describe('user del', function () {
    beforeAll(function (done) {
      specCommon.reInitDatabase(function () {
        user.set({
          login: 'parker',
          password: 'lovesKubiak',
          firstname: 'Parker',
          lastname: 'Lewis'
        }, function (err, parker) {
          if (err) { console.log(err); }
          user.set({
            login: 'frank',
            password: 'frankfrank'
          }, function (err, frank) {
            if (err) { console.log(err); }
            group.set({
              name: 'withFrank',
              admin: parker._id,
              admins: [frank._id]
            }, function (err) {
                if (err) { console.log(err); }
                group.set({ name: 'college', admin: parker._id }, done);
              }
            );
          });
        });
      });
    });
    afterAll(specCommon.reInitDatabase);

    it('should throw errors if arguments are not provided as expected',
      function () {
        expect(user.del).toThrow();
        expect(ld.partial(user.del, 123)).toThrow();
        expect(ld.partial(user.del, 'key')).toThrow();
        expect(ld.partial(user.del, 'key', 'notAFunc')).toThrow();
      }
    );

    it('should return an Error if the user is not found', function (done) {
      user.del('inexistent', function (err, u) {
        expect(ld.isError(err)).toBeTruthy();
        expect(u).toBeUndefined();
        done();
      });
    });

    it('should delete the user otherwise and pops it from shared groups, ' +
      'and removes from unique owner groups',
      function (done) {
        user.del('parker', function (err, _u) {
          expect(err).toBeNull();
          expect(_u).toBeDefined();
          expect(_u.login).toBe('parker');
          expect(user.logins.parker).toBeUndefined();
          user.get('parker', function (err, u) {
            expect(ld.isError(err)).toBeTruthy();
            expect(u).toBeUndefined();
            group.get(_u.groups[0], function (err, g) {
              expect(err).toBeNull();
              expect(ld.includes(g.admins, _u._id)).toBeFalsy();
              group.get(_u.groups[1], function (err, g) {
                expect(err).toMatch('KEY_NOT_FOUND');
                expect(g).toBeUndefined();
                done();
              });
            });
          });
        });
      }
    );
  });

  describe('user mark', function () {

    var parker;

    beforeAll(function (done) {
      specCommon.reInitDatabase(function () {
        user.set({
          login: 'parker',
          password: 'lovesKubiak',
          firstname: 'Parker',
          lastname: 'Lewis'
        }, function (err, u) {
          if (err) { console.log(err); }
          parker = u;
          done();
        });
      });
    });

    afterAll(specCommon.reInitDatabase);

    it('should throw errors if arguments are not provided as expected',
      function () {
        expect(user.mark).toThrow();
        expect(ld.partial(user.mark, 123)).toThrow();
        expect(ld.partial(user.mark, 'key')).toThrow();
        expect(ld.partial(user.mark, 'key', 'badType')).toThrow();
        expect(ld.partial(user.mark, 'login', 'pads')).toThrow();
        expect(ld.partial(user.mark, 'login', 'pads', 'id')).toThrow();
        expect(ld.partial(user.mark, 'login', 'pads', 'id', 'notAFn'))
          .toThrow();
      }
    );

    it('should return an Error if the user is not found', function (done) {
      user.mark('inexistent', 'pads', 'pid', function (err) {
        expect(ld.isError(err)).toBeTruthy();
        expect(err).toMatch('USER.NOT_FOUND');
        done();
      });
    });

    it('should return an Error if the bookmark id is not found',
      function (done) {
        user.mark('parker', 'pads', 'pid', function (err) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('BOOKMARK_NOT_FOUND');
          done();
        });
      }
    );

    it('should accept bookmarking and unmarking otherwise', function (done) {
      group.set({ name: 'g1', admin: parker._id }, function (err, g) {
        user.mark('parker', 'groups', g._id, function (err) {
          expect(err).toBeNull();
          user.get('parker', function (err, u) {
            expect(err).toBeNull();
            expect(ld.size(u.bookmarks.groups)).toBe(1);
            expect(ld.first(u.bookmarks.groups)).toBe(g._id);
            expect(ld.isEmpty(u.bookmarks.pads)).toBeTruthy();
            user.mark('parker', 'groups', g._id, function (err) {
              expect(err).toBeNull();
              user.get('parker', function (err, u) {
                expect(err).toBeNull();
                expect(ld.isEmpty(u.bookmarks.groups)).toBeTruthy();
                done();
              });
            });
          });
        });
      });
    });

  });

  describe('user userlists', function () {

    var parker;

    beforeAll(function (done) {
      specCommon.reInitDatabase(function () {
        user.set({
          login: 'parker',
          password: 'lovesKubiak',
          firstname: 'Parker',
          lastname: 'Lewis'
        }, function (err, u) {
          if (err) { console.log(err); }
          parker = u;
          user.set({ login: 'jerry', password: 'likesParker' },
            function (err) {
              if (err) { console.log(err); }
              user.set({ login: 'mikey', password: 'likesParker' },
                function (err) {
                  if (err) { console.log(err); }
                  done();
                }
              );
            }
          );
        });
      });
    });

    afterAll(specCommon.reInitDatabase);

    it('should throw errors if params are incorrect', function () {
      expect(user.userlist).toThrow();
      expect(ld.partial(user.userlist, {})).toThrowError(/CALLBACK/);
      expect(ld.partial(user.userlist, { crud: 'aloa' }, ld.noop))
        .toThrowError(/USERLIST_CRUD/);
      expect(ld.partial(user.userlist, { crud: 'set' }, ld.noop))
        .toThrowError(/USERLIST_ID/);
    });

    it('should throw an error for add if the name is not given', function () {
      var opts = { crud: 'add', login: 'parker', name: undefined };
      expect(ld.partial(user.userlist, opts, ld.noop))
        .toThrowError(/USERLIST_NAME/);
    });

    it('should return an error if the login is not found', function (done) {
      var opts = { crud: 'add', name: 'friends', login: 'inexistent' };
      user.userlist(opts, function (err) {
        expect(ld.isError(err)).toBeTruthy();
        expect(err).toMatch('NOT_FOUND');
        done();
      });
    });

    it('should return an error for set and del if the ulistid doesnt exist',
      function (done) {
        var opts = { crud: 'del', login: 'parker', ulistid: 'inexistent' };
        user.userlist(opts, function (err) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('NOT_FOUND');
          done();
        });
      }
    );

    it('should return an error for set if no uids or no name are given',
      function (done) {
        var opts = {
          crud: 'set',
          login: 'parker',
          ulistid: 'shouldBeRealUid',
          uids: undefined,
          name: undefined
        };
        user.userlist(opts, function (err) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('USERLIST_SET_PARAMS');
          done();
        });
      }
    );

    it('should create a new userlist', function (done) {
      var opts = { crud: 'add', login: 'parker', name: 'friends' };
      user.userlist(opts, function (err, u) {
        expect(err).toBeNull();
        var ulists = ld.values(u.userlists);
        expect(ld.size(ulists)).toBe(1);
        var ul = ld.first(ulists);
        expect(ul.name).toBe('friends');
        expect(ld.isArray(ul.uids)).toBeTruthy();
        expect(ld.size(ul.uids)).toBe(0);
        parker = u;
        done();
      });
    });

    it('should update a list name', function (done) {
      var ulistid = ld.first(ld.keys(parker.userlists));
      var opts = {
        crud: 'set',
        login: 'parker',
        ulistid: ulistid,
        name: 'Good friends'
      };
      user.userlist(opts, function (err, u) {
        expect(err).toBeNull();
        var ulists = ld.values(u.userlists);
        expect(ld.size(ulists)).toBe(1);
        var ul = ld.first(ulists);
        expect(ul.name).toBe('Good friends');
        expect(ld.isArray(ul.uids)).toBeTruthy();
        expect(ld.size(ul.uids)).toBe(0);
        expect(ld.isArray(ul.users)).toBeTruthy();
        expect(ld.size(ul.users)).toBe(0);
        parker = u;
        done();
      });
    });

    it('should update a list with filtered uids', function (done) {
      var ulistid = ld.first(ld.keys(parker.userlists));
      var opts = {
        crud: 'set',
        login: 'parker',
        ulistid: ulistid,
        uids: [ user.logins.mikey, user.logins.jerry, 'fakeOne' ]
      };
      user.userlist(opts, function (err, u) {
        expect(err).toBeNull();
        var ulists = ld.values(u.userlists);
        expect(ld.size(ulists)).toBe(1);
        var ul = ld.first(ulists);
        expect(ul.name).toBe('Good friends');
        expect(ld.isArray(ul.uids)).toBeTruthy();
        expect(ld.size(ul.uids)).toBe(2);
        expect(ul.uids[0]).toBe(user.logins.mikey);
        expect(ul.uids[1]).toBe(user.logins.jerry);
        expect(ld.size(ul.users)).toBe(2);
        expect(ul.users[0].login).toBe('mikey');
        parker = u;
        done();
      });
    });

    it('should return detailed lists for a given login', function (done) {
      user.userlist({ crud: 'get', login: 'jerry' }, function (err, u) {
        expect(err).toBeNull();
        expect(ld.size(u.userlists)).toBe(0);
        user.userlist({ crud: 'get', login: 'parker' }, function (err, u) {
          expect(ld.size(u.userlists)).toBe(1);
          var ul = ld.first(ld.values(u.userlists));
          expect(ul.name).toBe('Good friends');
          expect(ld.size(ul.uids)).toBe(2);
          expect(ld.isArray(ul.users)).toBeTruthy();
          expect(ld.size(ul.users)).toBe(2);
          expect(ul.users[0].login).toBe('mikey');
          expect(ul.users[0].email).toBeDefined();
          expect(ul.users[0].firstname).toBeDefined();
          expect(ul.users[0].lastname).toBeDefined();
          expect(ul.users[0].password).toBeUndefined();
          expect(ul.users[1].login).toBe('jerry');
          done();
        });
      });
    });

    it('should delete a list', function (done) {
      var ulistid = ld.first(ld.keys(parker.userlists));
      var opts = { crud: 'del', login: 'parker', ulistid: ulistid };
      user.userlist(opts, function (err, u) {
        expect(err).toBeNull();
        expect(ld.size(u.userlists)).toBe(0);
        parker = u;
        done();
      });
    });

  });

  describe('user functions', function() {

    describe('getPasswordConf', function () {

      it('should retrieve min and max length for password', function (done) {
        user.fn.getPasswordConf(function (err, results) {
          expect(err).toBeNull();
          var rkeys = ld.keys(results);
          expect(ld.contains(rkeys, CPREFIX + 'passwordMin'))
            .toBeTruthy();
          expect(ld.contains(rkeys, CPREFIX + 'passwordMax'))
            .toBeTruthy();
          done();
        });
      });

    });

    describe('checkPasswordLength', function () {
      var params = {};

      beforeAll(function () {
        params[CPREFIX + 'passwordMin'] = 4;
        params[CPREFIX + 'passwordMax'] = 8;
      });

      it('should return an Error if password size is not appropriate',
        function () {
          var cPL = user.fn.checkPasswordLength;
          expect(ld.isError(cPL('a', params))).toBeTruthy();
      });

      it('should return nothing if password size is good', function () {
        expect(user.fn.checkPasswordLength('123456', params)).toBeUndefined();
      });
    });

    describe('hashPassword', function () {

      it('should hash any given string password', function (done) {
        user.fn.hashPassword(null, 'pass', function (err, pass) {
          expect(err).toBeNull();
          expect(ld.isObject(pass)).toBeTruthy();
          expect(ld.isString(pass.hash)).toBeTruthy();
          expect(ld.isEmpty(pass.hash)).toBeFalsy();
          expect(ld.isString(pass.salt)).toBeTruthy();
          expect(ld.isEmpty(pass.salt)).toBeFalsy();
          done();
        });
      });
      it('should hash any given string password with given salt',
        function (done) {
          user.fn.hashPassword('salt', 'pass', function (err, pass) {
            expect(err).toBeNull();
            expect(ld.isObject(pass)).toBeTruthy();
            expect(ld.isString(pass.hash)).toBeTruthy();
            expect(ld.isEmpty(pass.hash)).toBeFalsy();
            expect(ld.isString(pass.salt)).toBeTruthy();
            expect(ld.isEmpty(pass.salt)).toBeFalsy();
            var _pass = pass;
            user.fn.hashPassword('salt', 'pass', function (err, pass) {
              expect(err).toBeNull();
              expect(ld.isObject(pass)).toBeTruthy();
              expect(pass.salt).toBe(_pass.salt);
              expect(pass.hash).toBe(_pass.hash);
              done();
            });
          });
        }
      );
    });

    describe('genPassword', function () {

      it('should check and returns an updated user object for user creation',
        function (done) {
          var params = {
            login: 'brian',
            password: 'verySecret',
            organization: 'etherInc'
          };
          user.fn.genPassword(null, params, function (err, u) {
            expect(err).toBeNull();
            expect(ld.isObject(u)).toBeTruthy();
            expect(u.login).toBe('brian');
            expect(ld.isObject(u.password)).toBeTruthy();
            expect(ld.isString(u.password.hash)).toBeTruthy();
            expect(ld.isEmpty(u.password.hash)).toBeFalsy();
            expect(ld.isString(u.password.salt)).toBeTruthy();
            expect(ld.isEmpty(u.password.salt)).toBeFalsy();
            done();
          });
        }
      );

      it('should keep the password object for update with the same pass',
        function (done) {
          user.fn.hashPassword(null, 'verySecret', function (err, pass) {
            var old = {
              login: 'brian',
              password: pass,
              organization: 'etherInc'
            };
            var params = ld.clone(old);
            params.password = 'verySecret';
            user.fn.genPassword(old, params, function (err, u) {
              expect(err).toBeNull();
              expect(ld.isObject(u)).toBeTruthy();
              expect(u.login).toBe('brian');
              expect(ld.isObject(u.password)).toBeTruthy();
              expect(ld.isString(u.password.hash)).toBeTruthy();
              expect(u.password.hash).toBe(pass.hash);
              expect(ld.isString(u.password.salt)).toBeTruthy();
              expect(u.password.salt).toBe(pass.salt);
              done();
            });
          });
        }
      );

      it('should check and update the password object for update with new pass',
        function (done) {
          user.fn.hashPassword(null, 'verySecret', function (err, pass) {
            var old = {
              login: 'brian',
              password: pass,
              organization: 'etherInc'
            };
            var params = ld.clone(old);
            params.password = 'newSecret';
            user.fn.genPassword(old, params, function (err, u) {
              expect(err).toBeNull();
              expect(ld.isObject(u)).toBeTruthy();
              expect(u.login).toBe('brian');
              expect(ld.isObject(u.password)).toBeTruthy();
              expect(ld.isString(u.password.hash)).toBeTruthy();
              expect(u.password.hash).not.toBe(pass.hash);
              expect(ld.isString(u.password.salt)).toBeTruthy();
              expect(u.password.salt).not.toBe(pass.salt);
              done();
            });
          });
        }
      );
    });

    describe('assignProps', function () {

      it ('should respect given properties if strings and relevant',
        function () {
          var params = {
            _id: 'aMadeID',
            login: 'brian',
            password: 'secret',
            organization: 'etherInc',
            firstname: true,
            irrelevant: 123,
            email: 'brian@sample.net',
            lang: 'fr',
            useLoginAndColorInPads: false
          };
          var u = user.fn.assignProps(params);
          expect(u._id).toBe('aMadeID');
          expect(u.login).toBe('brian');
          expect(u.password).toBe('secret');
          expect(u.organization).toBe('etherInc');
          expect(u.email).toBe('brian@sample.net');
          expect(u.lang).toBe('fr');
          var uf = u.firstname;
          var ul = u.lastname;
          expect(ld.isString(uf) && ld.isEmpty(uf)).toBeTruthy();
          expect(ld.isString(ul) && ld.isEmpty(ul)).toBeTruthy();
          expect(ld.isArray(u.groups)).toBeTruthy();
          expect(ld.isEmpty(u.groups)).toBeTruthy();
          expect(ld.isEmpty(u.color)).toBeTruthy();
          expect(u.useLoginAndColorInPads).toBeFalsy();
          expect(u.irrelevant).toBeUndefined();
          params.email = 'notenamail@@@@';
          params.lang = 'notAValidOne';
          u = user.fn.assignProps(params);
          var ue = u.email;
          expect(u.lang).toBe('en');
          expect(ld.isString(ue) && ld.isEmpty(ue)).toBeTruthy();
        }
      );
    });

    describe('checkLogin', function () {
      beforeAll(function () {
        user.logins = {
          'parker': '087654321',
          'jerry': 'azertyuiop'
        };
      });
      afterAll(function (done) { user.init(done); });

      it('should return an error if add and existing login or id',
        function (done) {
          var u = { login: 'l', _id: '087654321' };
          user.fn.checkLogin(undefined, u, function (err) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('USER.ALREADY_EXISTS');
            u = { login: 'jerry', _id: 'anotherone' };
            user.fn.checkLogin(undefined, u, function (err) {
              expect(ld.isError(err)).toBeTruthy();
              expect(err).toMatch('USER.ALREADY_EXISTS');
              done();
            });
          });
        }
      );

      it('should pay attention to login when edit, returns null',
        function (done) {
          var u = { login: 'parker', _id: '087654321', email: 'p@l.org' };
          user.fn.checkLogin('087654321', u, function (err) {
            expect(err).toBeNull();
            u = { login: 'park', _id: '087654321' };
            user.fn.checkLogin('087654321', u, function (err) {
              expect(err).toBeNull();
              expect(user.logins.parker).toBeUndefined();
              done();
            });
          });
        }
      );

    });

    describe('checkEmail', function () {
      beforeAll(function () {
        user.emails = {
          'parker@lewis.me': '087654321',
          'jerry@tremolo.lol': 'azertyuiop'
        };
      });
      afterAll(function (done) { user.init(done); });

      it('should return an error if add and existing email', function (done) {
        var u = { _id: 'azertyuiop', email: 'jerry@tremolo.lol' };
        user.fn.checkEmail(undefined, u, function (err) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('USER.EMAIL_ALREADY_EXISTS');
          u = { _id: 'anotherone', email: 'jerry@tremolo.lol' };
          user.fn.checkEmail(undefined, u, function (err) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('USER.EMAIL_ALREADY_EXISTS');
            done();
          });
        });
      });

      it('should pay attention to email when edit, returns null',
        function (done) {
          var u = { _id: '087654321', email: 'parker@lewis.me' };
          user.fn.checkEmail('087654321', u, function (err) {
            expect(err).toBeNull();
            expect(user.emails['parker@lewis.me']).toBeDefined();
            u.email = 'parker@lewis.biz';
            user.fn.checkEmail('087654321', u, function (err) {
              expect(err).toBeNull();
              expect(user.emails['parker@lewis.me']).toBeUndefined();
              expect(user.emails['parker@lewis.biz']).toBeDefined();
              done();
            });
          });
        }
      );

    });

    describe('user getIdsFromLogins', function () {

      it('should throw errors if arguments are not provided as expected',
        function () {
          expect(user.fn.getIdsFromLogins).toThrow();
          expect(ld.partial(user.fn.getIdsFromLogins, 'notArray')).toThrow();
          expect(ld.partial(user.fn.getIdsFromLogins, [], 'notFn')).toThrow();
          expect(ld.partial(user.fn.getIdsFromLogins, false, function () {}))
            .toThrow();
        }
      );

      it('should return an array of uid otherwise, filtering not found users',
        function (done) {
          var u = { login: 'shelly', password: 'aGoodOneAndStrong' };
          user.set(u, function (err, u) {
            expect(err).toBeNull();
            var users = ['shelly', 'inexistent'];
            user.fn.getIdsFromLogins(users, function (err, res) {
              expect(err).toBeNull();
              expect(ld.isArray(res)).toBeTruthy();
              expect(ld.size(res)).toBe(1);
              expect(ld.first(res)).toBe(u._id);
              done();
            });
          });
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
