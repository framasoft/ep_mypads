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
  var storage = require('../../../storage.js');
  var user = require('../../../model/user.js');
  var group = require('../../../model/group.js');

  var gparams;
  var gadm;
  var gusers;
  var gpads;


  var initGroupUsersAndPads = function (done) {
    gadm = {
      _id: user.DBPREFIX + 'parkerId',
      login: 'parker',
      password: 'lovesKubiak',
      firstname: 'Parker',
      lastname: 'Lewis'
    };
    gusers = ld.map(['frank', 'grace','shelly', 'mikey', 'jerry'],
      function (v) { return 'mypads:user:' + v; });
    gpads = ['mypads:pad:pad1', 'mypads:pad:pad2', 'mypads:pad:pad3'];
    gparams = {
      name: 'college',
      admin: gadm._id,
      admins: ld.takeRight(gusers, 2),
      users: ld.take(gusers, 3),
      pads: [ 'mypads:pad:pad1' ],
      visibility: 'private',
      password: 'aGoodOne',
      readonly: true
    };
    specCommon.reInitDatabase(function () {
      var kv = ld.reduce(ld.union(gusers, gpads),
      function (memo, val) {
        memo[val] = true; 
        return memo;
        }, { 'mypads:user:parkerId': gadm });
      storage.fn.setKeys(kv, function (err) {
        if (err) { console.log(err); }
        group.add(gparams, function (err, res) {
          if (!err) { gparams = res; }
          done();
        });
      });
    });
  };

  describe('group', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('add', function () {
      beforeAll(initGroupUsersAndPads);
      afterAll(specCommon.reInitDatabase);

      it('should throws errors if params.name or params.admin, callback or ' +
        'edit aren`t correct', function () {
          expect(group.add).toThrow();
          expect(ld.partial(group.add, [])).toThrow();
          var params = { name: 123, noadmin: true };
          expect(ld.partial(group.add, params, ld.noop)).toThrow();
          params = { name: 'ok', admin: false };
          expect(ld.partial(group.add, params, ld.noop)).toThrow();
          params.name = [];
          expect(ld.partial(group.add, params, ld.noop)).toThrow();
          params.name = 'ok';
          params.admin = 'ok';
          expect(ld.partial(group.add, params, false)).toThrow();
        }
      );

      it('should return an error if admin user is not found', function (done) {
        group.add({ name: 'g', admin: 'mypads:user:inexistent' },
          function (err, g) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('Some users, admins');
            expect(g).toBeUndefined();
            done();
          }
        );
      });

      it('should assign defaults if other params are not properly typed nor' +
        'defined', function (done) {
          var params = { name: 'group', admin: gadm._id };
          group.add(params, function (err, g) {
            expect(err).toBeNull();
            expect(g.name).toBe('group');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.isArray(g.users) && ld.isEmpty(g.users)).toBeTruthy();
            expect(ld.isArray(g.pads) && ld.isEmpty(g.pads)).toBeTruthy();
            expect(ld.first(g.admins)).toBe(gadm._id);
            expect(g.visibility).toBe('restricted');
            expect(g.password).toBeNull();
            expect(ld.readonly).toBeFalsy();

            params = {
              name: 'college',
              admin: gadm._id,
              admins: [123],
              users: {},
              pads: false,
              visibility: 'inexistentOption',
              password: [],
              readonly: 'needABoolean'
            };
            group.add(params, function (err, g) {
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
              done();
            });
          });
        }
      );

      it('should otherwise accept well defined parameters', function (done) {
        var params = {
          name: 'college2',
          admin: gadm._id,
          admins: [ 'mypads:user:mikey', 'mypads:user:jerry' ],
          users: [ 'mypads:user:grace', 'mypads:user:frank',
            'mypads:user:shelly' ],
          pads: [ 'mypads:pad:pad2' ],
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.add(params, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college2');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe(gadm._id);
          expect(ld.includes(g.admins, 'mypads:user:mikey')).toBeTruthy();
          expect(ld.includes(g.admins, 'mypads:user:jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'mypads:pad:pad2')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          done();
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
            expect(err).toMatch('Some users, admins'); 
            expect(g).toBeUndefined();
            done();
          }
        );
      });

      it('should return an error if group _id is not found', function (done) {
        group.set({ _id: 'i', name: 'g', admin: gadm._id }, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('group does not exist');
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should otherwise accept well defined parameters', function (done) {
        var params = {
          name: 'college2',
          admin: gadm._id,
          admins: ld.takeRight(gusers, 2),
          users: ld.take(gusers, 3),
          pads: [ 'mypads:pad:pad1' ],
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.add(params, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college2');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe(gadm._id);
          expect(ld.includes(g.admins, user.DBPREFIX + 'mikey')).toBeTruthy();
          expect(ld.includes(g.admins, user.DBPREFIX + 'jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'mypads:pad:pad1')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          group.get(g._id, function (err, g) {
            expect(err).toBeNull();
            expect(ld.isString(g._id)).toBeTruthy();
            expect(g.name).toBe('college2');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.first(g.admins)).toBe(gadm._id);
            expect(ld.includes(g.admins, user.DBPREFIX + 'mikey')).toBeTruthy();
            expect(ld.includes(g.admins, user.DBPREFIX + 'jerry')).toBeTruthy();
            expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
            expect(ld.includes(g.pads, 'mypads:pad:pad1')).toBeTruthy();
            expect(g.visibility).toBe('private');
            expect(g.password).toBeDefined();
            expect(ld.isEmpty(g.password)).toBeFalsy();
            expect(g.readonly).toBeTruthy();
            done();
          });
        });
      });
    });

    describe('group get and del', function () {

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
          expect(ld.includes(g.admins, user.DBPREFIX + 'mikey')).toBeTruthy();
          expect(ld.includes(g.admins, user.DBPREFIX + 'jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, gparams.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'mypads:pad:pad1')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          done();
        });
      });

    });

  });

}).call(this);
