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
  var group = require('../../../model/group.js');

  var params;
  var initOneGroup = function (done) {
    specCommon.reInitDatabase(function () {
      user.add({ login: 'parker', password: 'lovesKubiak'}, function () {
        params = {
          name: 'college',
          admin: 'parker',
          admins: [ 'mikey', 'jerry' ],
          users: [ 'grace', 'frank', 'shelly' ],
          pads: [ 'watchSync' ],
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.add(params, function (err, res) {
          if (!err) { params = res; }
          done();
        });
      });
    });
  };

  describe('group', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('add', function () {
      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          user.add({
            login: 'parker',
            password: 'lovesKubiak',
            firstname: 'Parker',
            lastname: 'Lewis'
          }, done);
        });
      });
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
        group.add({ name: 'g', admin: 'inexistent' }, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('admin user does not exist');
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should assign defaults if other params are not properly typed nor' +
        'defined', function (done) {
          var params = { name: 'group', admin: 'parker' };
          group.add(params, function (err, g) {
            expect(err).toBeNull();
            expect(g.name).toBe('group');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.isArray(g.users) && ld.isEmpty(g.users)).toBeTruthy();
            expect(ld.isArray(g.pads) && ld.isEmpty(g.pads)).toBeTruthy();
            expect(ld.first(g.admins)).toBe('parker');
            expect(g.visibility).toBe('restricted');
            expect(ld.isString(g.password) && ld.isEmpty(g.password))
              .toBeTruthy();
            expect(ld.readonly).toBeFalsy();

            params = {
              _id: 'will not be given',
              name: 'college',
              admin: 'parker',
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
              expect(ld.first(g.admins)).toBe('parker');
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
          admin: 'parker',
          admins: [ 'mikey', 'jerry' ],
          users: [ 'grace', 'frank', 'shelly' ],
          pads: [ 'watchSync' ],
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.add(params, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college2');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe('parker');
          expect(ld.includes(g.admins, 'mikey')).toBeTruthy();
          expect(ld.includes(g.admins, 'jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'watchSync')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          done();
        });
      });
    });

    describe('set', function () {
      beforeAll(function (done) {
        specCommon.reInitDatabase(function () {
          user.add({
            login: 'parker',
            password: 'lovesKubiak',
            firstname: 'Parker',
            lastname: 'Lewis'
          }, done);
        });
      });
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
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
          params._id = 123;
          expect(ld.partial(group.set, params, ld.noop)).toThrow();
        }
      );

      it('should return an error if admin user is not found', function (done) {
        group.set({ _id: 'k', name: 'g', admin: 'inexist' }, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('admin user does not exist');
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should return an error if group _id is not found', function (done) {
        group.set({ _id: 'i', name: 'g', admin: 'parker' }, function (err, g) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('group does not exist');
          expect(g).toBeUndefined();
          done();
        });
      });

      it('should otherwise accept well defined parameters', function (done) {
        var params = {
          name: 'college2',
          admin: 'parker',
          admins: [ 'mikey', 'jerry' ],
          users: [ 'grace', 'frank', 'shelly' ],
          pads: [ 'watchSync' ],
          visibility: 'private',
          password: 'aGoodOne',
          readonly: true
        };
        group.add(params, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college2');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe('parker');
          expect(ld.includes(g.admins, 'mikey')).toBeTruthy();
          expect(ld.includes(g.admins, 'jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'watchSync')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          group.get(g._id, function (err, g) {
            expect(err).toBeNull();
            expect(ld.isString(g._id)).toBeTruthy();
            expect(g.name).toBe('college2');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.first(g.admins)).toBe('parker');
            expect(ld.includes(g.admins, 'mikey')).toBeTruthy();
            expect(ld.includes(g.admins, 'jerry')).toBeTruthy();
            expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
            expect(ld.includes(g.pads, 'watchSync')).toBeTruthy();
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

      beforeAll(initOneGroup);
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
        group.get(params._id, function (err, g) {
          expect(err).toBeNull();
          expect(ld.isString(g._id)).toBeTruthy();
          expect(g.name).toBe('college');
          expect(ld.isArray(g.admins)).toBeTruthy();
          expect(ld.first(g.admins)).toBe('parker');
          expect(ld.includes(g.admins, 'mikey')).toBeTruthy();
          expect(ld.includes(g.admins, 'jerry')).toBeTruthy();
          expect(ld.isEmpty(ld.xor(g.users, params.users))).toBeTruthy();
          expect(ld.includes(g.pads, 'watchSync')).toBeTruthy();
          expect(g.visibility).toBe('private');
          expect(g.password).toBeDefined();
          expect(ld.isEmpty(g.password)).toBeFalsy();
          expect(g.readonly).toBeTruthy();
          done();
        });
      });

    });

    describe('group helper functions', function () {
      var ch = common.helper;

      beforeAll(initOneGroup);
      afterAll(specCommon.reInitDatabase);

      describe('linkPads', function () {

        it('should throw TypeError if arguments are not correct',
          function () {
            expect(ch.linkPads).toThrow();
            expect(ld.partial(ch.linkPads, 123)).toThrow();
            expect(ld.partial(ch.linkPads, 'key', false)).toThrow();
            expect(ld.partial(ch.linkPads, false, 'pad')).toThrow();
            expect(ld.partial(ch.linkPads, 'key', [])).toThrow();
          }
        )

        it('should return an error if the group is not found', function (done) {
          ch.linkpads('inexistent', 'pad1', function (err) {
            expect(ld.iserro(err)).tobetruthy();
            expect(err.message).tomatch('key is not found');
            done();
          });
        });

        it('should return an error if one or morre pads are not found',
          function (done) {
            ch.linkpads('college', 'noPad', function (err) {
              expect(ld.iserro(err)).tobetruthy();
              expect(err.message).tomatch('key is not found');
              done();
            });
          }
        );

        xit('should accept updates otherwise', function (done) {
          // FIXME : when pad module will be done
          ch.linkpads('college', 'noPad', function (err) {
            expect(ld.iserro(err)).tobetruthy();
            expect(err.message).tomatch('key is not found');
            done();
          });
        });

      });

    });

  });

}).call(this);
