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
  var user = require('../../../model/user.js');
  var pad = require('../../../model/pad.js');
  var group = require('../../../model/group.js');
  var storage = require('../../../storage.js');

  var gparams;
  var gadm;
  var gusers;
  var gpads;


  var initGroupUsersAndPads = function (done) {
    gadm = {
      login: 'parker',
      password: 'lovesKubiak',
      firstname: 'Parker',
      lastname: 'Lewis',
      groups: []
    };
    gusers = [];
    gpads = [];
    var users = ld.map(['frank', 'grace','shelly', 'mikey', 'jerry'],
      function (val) { return { login: val, password: 'lovesKubiak' }; });
    specCommon.reInitDatabase(function () {
      user.set(gadm, function (err, u) {
        if (err) { console.log(err); }
        gadm = u;
        var setUsers = function () {
          if (users.length) {
            user.set(users.pop(), function (err, u) {
              if (err) { console.log(err); }
              gusers.push(u._id);
              setUsers();
            });
          } else {
            gusers.push(gadm._id);
            gparams = {
              name: 'college',
              admin: gadm._id,
              visibility: 'private',
              password: 'aGoodOne',
              readonly: true
            };
            group.set(gparams, function (err, g) {
              if (err) { console.log(err); }
              gparams = g;
              gparams.admin = gadm._id;
              gparams.admins = ld.takeRight(gusers, 2);
              gparams.users = ld.take(gusers, 3);
              gparams.password = 'aGoodOne';
              var pads = ld.map(['pad1', 'pad2', 'pad3'], function (val) {
                return { name: val, group: gparams._id };
              });
              var setPads = function () {
                if (pads.length) {
                  pad.set(pads.pop(), function (err, p) {
                    if (err) { console.log(err); }
                    gpads.push(p._id);
                    setPads();
                  });
                } else {
                  group.set(gparams, function (err, g) {
                    if (err) { console.log(err); }
                    gparams = g;
                    done();
                  });
                }
              };
              setPads();
            });
          }
        };
        setUsers();
      });
    });
  };

  describe('group', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('addition using set', function () {
      beforeEach(initGroupUsersAndPads);
      afterEach(specCommon.reInitDatabase);

      it('should throws errors if params.name or params.admin, callback or ' +
        'edit aren`t correct', function () {
          expect(group.set).toThrow();
          expect(ld.partial(group.set, [])).toThrow();
          var params = { name: 123, noadmin: true };
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
          params = { name: 'ok', admin: false };
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
          params.name = [];
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
          params.name = 'ok';
          params.admin = 'ok';
          expect(ld.partial(group.set, params, false)).toThrow();
        }
      );

      it('should return an error if admin user is not found', function (done) {
        group.set({ name: 'g', admin: 'inexistent' },
          function (err, g) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('ITEMS_NOT_FOUND');
            expect(g).toBeUndefined();
            done();
          }
        );
      });

      it('should assign defaults if other params are not properly typed nor' +
        'defined', function (done) {
          var params = { name: 'group', admin: gadm._id };
          group.set(params, function (err, g) {
            expect(err).toBeNull();
            expect(g.name).toBe('group');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.isArray(g.users) && ld.isEmpty(g.users)).toBeTruthy();
            expect(ld.isArray(g.pads) && ld.isEmpty(g.pads)).toBeTruthy();
            expect(ld.first(g.admins)).toBe(gadm._id);
            expect(g.visibility).toBe('restricted');
            expect(g.password).toBeNull();
            expect(g.readonly).toBeFalsy();
            expect(ld.isArray(g.tags)).toBeTruthy();

            params = {
              name: 'college',
              admin: gadm._id,
              admins: [123],
              users: {},
              pads: false,
              visibility: 'inexistentOption',
              password: [],
              readonly: 'needABoolean',
              tags: 123
            };
            group.set(params, function (err, g) {
              expect(err).toBeNull();
              expect(ld.isString(g._id)).toBeTruthy();
              expect(g._id).not.toBe('will not be given');
              expect(g.name).toBe('college');
              expect(ld.isArray(g.admins)).toBeTruthy();
              expect(ld.first(g.admins)).toBe(gadm._id);
              expect(ld.size(g.admins)).toBe(1);
              expect(ld.isArray(g.users) && ld.isEmpty(g.users)).toBeTruthy();
              expect(ld.isArray(g.pads) && ld.isEmpty(g.pads)).toBeTruthy();
              expect(g.visibility).toBe('restricted');
              expect(ld.isEmpty(g.password)).toBeTruthy();
              expect(g.readonly).toBeFalsy();
              expect(ld.isArray(g.tags)).toBeTruthy();
              done();
            });
          });
        }
      );

      it('should otherwise accept well defined parameters', function (done) {
        var params = {
          name: 'college2',
          admin: gadm._id,
          admins: ld.take(gusers, 2),
          users: ld.takeRight(gusers, 3),
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true,
          tags: ['80s', 'coolness']
        };
        group.set(params, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college2');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe(gadm._id);
          var contained = (ld.size(ld.intersection(g.admins, gusers)) ===
            ld.size(g.admins));
          expect(contained).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          expect(ld.isArray(g.tags)).toBeTruthy();
          expect(ld.first(g.tags)).toBe('80s');
          expect(g.tags[1]).toBe('coolness');
          user.get(gadm.login, function (err, u) {
            expect(err).toBeNull();
            expect(u.login).toBe(gadm.login);
            expect(ld.isArray(u.groups)).toBeTruthy();
            expect(ld.size(u.groups)).toBe(2);
            expect(u.groups[1]).toBe(g._id);
            done();
          });
        });
      });
    });

    describe('set', function () {
      beforeAll(initGroupUsersAndPads);
      afterAll(specCommon.reInitDatabase);

      it('should throws errors if params._id|name|admin, callback or edit ' +
        'aren`t correct', function () {
          expect(group.set).toThrow();
          expect(ld.partial(group.set, [])).toThrow();
          var params = { name: 123, noadmin: true };
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
          params = { name: 'ok', admin: false };
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
          params.name = 'ok';
          params.admin = 'ok';
          expect(ld.partial(group.set, params, false)).toThrow();
          params._id = 123;
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
        }
      );

      it('should return an error if admin user is not found', function (done) {
        group.set({ _id: gparams._id, name: 'college', admin: 'inexist' },
          function (err, g) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('ITEMS_NOT_FOUND');
            expect(g).toBeUndefined();
            done();
          }
        );
      });

      it('should return an error if group _id is not found', function (done) {
        group.set({ _id: 'i', name: 'g', admin: gadm._id }, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('GROUP.INEXISTENT');
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should return an error if visibility is private with invalid ' +
        'password', function (done) {
          var params = {
          name: 'college3',
          admin: gadm._id,
          visibility: 'private'
        };
        group.set(params, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('PASSWORD_INCORRECT');
          expect(g).toBeUndefined();
          params.password = 123;
          group.set(params, function (err, g) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('PASSWORD_INCORRECT');
            expect(g).toBeUndefined();
            done();
          });
        });
      });

      it('should otherwise accept well defined parameters', function (done) {
        var params = {
          _id: gparams._id,
          name: 'college2',
          admin: gadm._id,
          admins: ld.takeRight(gusers, 2),
          users: ld.take(gusers, 3),
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.set(params, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college2');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe(gadm._id);
          var contained = (ld.size(ld.intersection(g.admins, gusers)) ===
            ld.size(g.admins));
          expect(contained).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(ld.includes(gpads, ld.first(g.pads))).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(ld.isObject(g.password)).toBeTruthy();
          expect(g.password.salt).toBeDefined();
          expect(g.password.hash).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          group.get(g._id, function (err, g) {
            expect(err).toBeNull();
            expect(ld.isString(g._id)).toBeTruthy();
            expect(g.name).toBe('college2');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.first(g.admins)).toBe(gadm._id);
            contained = (ld.size(ld.intersection(g.admins, gusers)) ===
              ld.size(g.admins));
            expect(contained).toBeTruthy();
            expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
            expect(ld.includes(gpads, ld.first(g.pads))).toBeTruthy();
            expect(g.visibility).toBe('private');
            expect(g.password).toBeDefined();
            expect(ld.isEmpty(g.password)).toBeFalsy();
            expect(g.readonly).toBeTruthy();
            user.get(gadm.login, function (err, u) {
              expect(err).toBeNull();
              expect(u.login).toBe(gadm.login);
              expect(ld.isArray(u.groups)).toBeTruthy();
              expect(ld.size(u.groups)).toBe(1);
              expect(u.groups[0]).toBe(g._id);
              done();
            });
          });
        });
      });

      it('should accept empty password for an already private group',
        function (done) {
          var params = ld.clone(gparams);
          delete params.password;
          params.name = 'collegeRenamed';
          params.admin = gadm._id;
          group.set(params, function (err, g) {
            expect(err).toBeNull();
            expect(ld.isString(g._id)).toBeTruthy();
            expect(g.name).toBe('collegeRenamed');
            expect(ld.isObject(g.password)).toBeTruthy();
            expect(g.password.salt).toBeDefined();
            expect(g.password.hash).toBeDefined();
            done();
          });
        }
      );
    });

    describe('group get', function () {

      beforeAll(initGroupUsersAndPads);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are not provided as expected',
        function () {
          expect(group.get).toThrow();
          expect(ld.partial(group.get, 123)).toThrow();
          expect(ld.partial(group.get, 'key')).toThrow();
          expect(ld.partial(group.get, 'key', 'notAFunc')).toThrow();
        }
      );

      it('should return an Error if the key is not found', function (done) {
        group.get('inexistent', function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should return the group otherwise', function (done) {
        group.get(gparams._id, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe(gadm._id);
          var contained = (ld.size(ld.intersection(g.admins, gusers)) ===
            ld.size(g.admins));
          expect(contained).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, gparams.users))).toBeTruthy();
          expect(ld.includes(gpads, ld.first(g.pads))).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          done();
        });
      });

    });

    describe('group getWithPads', function () {

      beforeAll(initGroupUsersAndPads);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are not as expected',
        function () {
          expect(group.getWithPads).toThrow();
          expect(ld.partial(group.getWithPads, 123)).toThrow();
          expect(ld.partial(group.getWithPads, 'key')).toThrow();
          expect(ld.partial(group.getWithPads, 'key', 'notAFunc')).toThrow();
        }
      );

      it('should return an Error if the key is not found', function (done) {
        group.getWithPads('inexistent', function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should return the group and its pads otherwise', function (done) {
        group.getWithPads(gparams._id, function (err, g, pads) {
          expect(err).toBeNull();
          expect(ld.isObject(g)).toBeTruthy();
          expect(ld.isObject(pads)).toBeTruthy();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college');
          pads = ld.values(pads);
          expect(ld.size(pads)).toBe(ld.size(g.pads));
          expect(pads[0].name).toBe('pad1');
          group.set({ name: 'EmptyGroup', admin: gadm._id }, function (err, g) {
            expect(err).toBeNull();
            group.getWithPads(g._id, function (err, g, pads) {
              expect(err).toBeNull();
              expect(g.name).toBe('EmptyGroup');
              expect(ld.size(pads)).toBe(0);
              done();
            });
          });
        });
      });

    });

    describe('group getByUser', function () {
      beforeAll(initGroupUsersAndPads);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are incorrect', function () {
        expect(group.getByUser).toThrow();
        expect(ld.partial(group.getByUser, 123)).toThrow();
        expect(ld.partial(group.getByUser, gadm)).toThrow();
        expect(ld.partial(group.getByUser, gadm, 'notABool', function () {}))
          .toThrow();
        expect(ld.partial(group.getByUser, gadm, false, 'notAFunc')).toThrow();
        expect(ld.partial(group.getByUser, { login: 'inexistant' }, false,
          function () {})).toThrowError(/USER_INVALID/);
      });

      it('should return groups otherwise', function (done) {
        user.get(gadm.login, function (err, user) {
          if (err) { console.log(err); }
          gadm = user;
          group.getByUser(gadm, false, function (err, groups) {
            expect(err).toBeNull();
            expect(ld.isObject(groups)).toBeTruthy();
            var key = gadm.groups[0];
            expect(groups[key].name).toBe('college');
            expect(groups[key].visibility).toBe('private');
            expect(groups[key].readonly).toBeTruthy();
            done();
          });
        });
      });

      it('should return groups, pads, admins and users if withExtra is set ' +
        'to true', function (done) {
          user.get(gadm.login, function (err, user) {
            if (err) { console.log(err); }
            gadm = user;
            group.getByUser(gadm, true, function (err, groupsFull) {
              expect(err).toBeNull();
              expect(ld.isObject(groupsFull)).toBeTruthy();
              expect(ld.isObject(groupsFull.groups)).toBeTruthy();
              expect(ld.isObject(groupsFull.pads)).toBeTruthy();
              expect(ld.isObject(groupsFull.admins)).toBeTruthy();
              expect(ld.isObject(groupsFull.users)).toBeTruthy();
              var groups = groupsFull.groups;
              var key = gadm.groups[0];
              expect(groups[key].name).toBe('college');
              expect(groups[key].visibility).toBe('private');
              expect(groups[key].readonly).toBeTruthy();
              var pad = ld.first(ld.values(groupsFull.pads));
              expect(pad.name).toBe('pad1');
              var admin = ld.first(ld.values(groupsFull.admins));
              expect(admin.login).toBe('frank');
              done();
            }
          );
        });
      });

    });

    describe('group del', function () {

      beforeAll(initGroupUsersAndPads);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are not provided as expected',
        function () {
          expect(group.del).toThrow();
          expect(ld.partial(group.del, 123)).toThrow();
          expect(ld.partial(group.del, 'key')).toThrow();
          expect(ld.partial(group.del, 'key', 'notAFunc')).toThrow();
        }
      );

      it('should return an Error if the key is not found', function (done) {
        group.del('inexistent', function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should removes the group otherwise, and all the linked pads',
        function (done) {
          group.del(gparams._id, function (err) {
            expect(err).toBeNull();
            user.get(gadm.login, function (err, u) {
              expect(err).toBeNull();
              expect(u.login).toBe(gadm.login);
              expect(ld.isArray(u.groups)).toBeTruthy();
              expect(ld.includes(u.groups, gparams._id)).toBeFalsy();
              var PFX = storage.DBPREFIX.PAD;
              var pads = ld.map(gpads, function (p) { return PFX + p; });
              storage.fn.getKeys(pads, function (err, res) {
                expect(err).toBeNull();
                expect(ld.isObject(res)).toBeTruthy();
                expect(ld.every(res, ld.isUndefined)).toBeTruthy();
                done();
              });
            });
          });
        }
      );

    });

    describe('group inviteOrShare', function () {

      beforeAll(initGroupUsersAndPads);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are not provided as expected',
        function () {
          expect(group.inviteOrShare).toThrow();
          expect(ld.partial(group.inviteOrShare, 'noBool')).toThrow();
          expect(ld.partial(group.inviteOrShare, false, false)).toThrow();
          expect(ld.partial(group.inviteOrShare, false, 'str', 'noArr'))
            .toThrow();
          expect(ld.partial(group.inviteOrShare, false, 'str', [], 'notFn'))
            .toThrow();
          expect(ld.partial(group.inviteOrShare, false, 123, [],
            function () {})).toThrow();
        }
      );

      it('should return an error if there is no admin anymore',
        function (done) {
          group.inviteOrShare(false, gparams._id, [], function (err) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('GROUP.RESIGN_UNIQUE_ADMIN');
            done();
          });
        }
      );

      it('should return an array of uid otherwise, filtering not found users',
        function (done) {
          var users = ['shelly', 'mikey', 'inexist'];
          group.inviteOrShare(true, gparams._id, users, function (err, res) {
            expect(err).toBeNull();
            expect(ld.isObject(res)).toBeTruthy();
            expect(ld.size(res.users)).toBe(ld.size(users) - 1);
            var nbAdmins = res.admins.length;
            var admins = ['guest', 'grace', 'inexist'];
            group.inviteOrShare(false, gparams._id, admins,
              function (err, res) {
                expect(err).toBeNull();
                expect(ld.isObject(res)).toBeTruthy();
                expect(ld.size(res.admins)).toBe(nbAdmins - 1);
                done();
              }
            );
          });
        }
      );

      it('should handle secondary indexed correctly', function (done) {
        group.get(gparams._id, function (err, g) {
          expect(err).toBeNull();
          expect(ld.size(g.users)).toBe(2);
          var uid = g.users[0];
          var UPREFIX = storage.DBPREFIX.USER;
          storage.db.get(UPREFIX + uid, function (err, u) {
            expect(err).toBeNull();
            expect(ld.includes(u.groups, g._id)).toBeTruthy();
            ld.pull(g.users, u._id);
            group.inviteOrShare(true, g._id, ['mikey'], function (err, g) {
              expect(err).toBeNull();
              expect(ld.includes(g.users, u._id)).toBeFalsy();
              expect(ld.size(g.users)).toBe(1);
              done();
            });
          });
        });
      });

    });

    describe('group resign', function () {

      beforeAll(initGroupUsersAndPads);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are not as expected', function () {
        expect(group.resign).toThrow();
        expect(ld.partial(group.resign, false)).toThrow();
        expect(ld.partial(group.resign, false, false, ld.noop)).toThrow();
        expect(ld.partial(group.resign, 'gid')).toThrow();
        expect(ld.partial(group.resign, 'gid', 'uid')).toThrow();
        expect(ld.partial(group.resign, 'gid', false)).toThrow();
        expect(ld.partial(group.resign, 'gid', 'uid', false)).toThrow();
      });

      it('should return an error if group does not exist', function (done) {
        group.resign('fakeGid', gadm._id, function (err) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('KEY_NOT_FOUND');
          done();
        });
      });

      it('should forbid resignation from non user or non admin',
        function (done) {
          group.resign(gparams._id, 'fakeUid', function (err) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('GROUP.NOT_USER');
            done();
          }
        );
      });

      it('should forbid resignation from unique group admin', function (done) {
        group.set({
          name: 'new Group',
          admin: gadm._id
        }, function (err, g) {
          expect(err).toBeNull();
          group.resign(g._id, gadm._id, function (err) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('RESIGN_UNIQUE_ADMIN');
            done();
          });
        });
      });

      it('should allow resignation for user and admin otherwise',
        function (done) {
          var uid = ld.first(gusers);
          var UPREFIX = storage.DBPREFIX.USER;
          storage.db.get(UPREFIX + uid, function (err, u) {
            expect(err).toBeNull();
            expect(ld.includes(u.groups, gparams._id)).toBeTruthy();
            group.resign(gparams._id, uid, function (err, g) {
              expect(err).toBeNull();
              var users = ld.union(g.admins, g.users);
              expect(ld.includes(users, uid)).toBeFalsy();
              storage.db.get(UPREFIX + uid, function (err, u) {
                expect(err).toBeNull();
                expect(ld.includes(u.groups, gparams._id)).toBeFalsy();
                uid = ld.last(gusers);
                group.resign(gparams._id, uid, function (err, g) {
                  expect(err).toBeNull();
                  users = ld.union(g.admins, g.users);
                  expect(ld.includes(users, uid)).toBeFalsy();
                  done();
                });
              });
            });
          });
        }
      );

    });

  });

}).call(this);
