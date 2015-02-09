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
  var group = require('../../../model/group.js');


  describe('group', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('add', function () {

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
          expect(ld.partial(group.add, params, ld.noop, 'notABool')).toThrow();
        }
      );

      it('should assign defaults if other params are not properly typed nor' +
        'defined', function (done) {
          var params = { name: 'group', admin: 'login' };
          group.add(params, function (err, g) {
            expect(err).toBeNull();
            expect(g.name).toBe('group');
            expect(ld.isArray(g.admins)).toBeTruthy();
            expect(ld.isArray(g.users) && ld.isEmpty(g.users)).toBeTruthy();
            expect(ld.isArray(g.pads) && ld.isEmpty(g.pads)).toBeTruthy();
            expect(ld.first(g.admins)).toBe('login');
            expect(g.visibility).toBe('restricted');
            expect(ld.isString(g.password) && ld.isEmpty(g.password))
              .toBeTruthy();
            expect(ld.readonly).toBeFalsy();

            params = {
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
          name: 'college',
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
  });

}).call(this);
