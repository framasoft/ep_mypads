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

  // Dependencies
  var ld = require('lodash');
  var specCommon = require('../common.js');
  var pad = require('../../../model/pad.js');
  var user = require('../../../model/user.js');
  var group = require('../../../model/group.js');

  // Pre-created user, group and pad
  var guser;
  var ggroup;
  var gpad;

  var initAll = function (done) {
    specCommon.reInitDatabase(function () {
      user.set(
        {
          login: 'parker',
          password: 'lovesKubiak',
          email: 'parker@lewis.me'
        }, function (err, u) {
          if (!err) { guser = u; }
          group.set({ name: 'college', admin: guser._id }, function (err, g) {
            if (!err) { ggroup = g; }
            pad.set({ name: 'exam1', group: ggroup._id }, function (err, p) {
              if (!err) { gpad = p; }
              done();
            });
          });
        }
      );
    });
  };

  describe('Pad', function () {});
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('pad set (and add)', function () {
      beforeAll(initAll);
      afterAll(specCommon.reInitDatabase);

      it('should return errors if arguments are not as expected', function () {
          expect(pad.set).toThrow();
          expect(ld.partial(pad.set, {})).toThrow();
          expect(ld.partial(pad.set, 'str', ld.noop)).toThrow();
          expect(ld.partial(pad.set, {}, ld.noop)).toThrow();
          var props = { name: 'name', group: 'gId'};
          expect(ld.partial(pad.set, props, false)).toThrow();
          props.group = 123;
          expect(ld.partial(pad.set, props, ld.noop)).toThrow();
        }
      );

      it('should return an Error if pad is not found', function (done) {
        var params = { name: 'name', group: 'group1', _id: 'inexistent' };
        pad.set(params, function (err, p) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('PAD.INEXISTENT');
          expect(p).toBeUndefined();
          done();
        });
      });

      it('should return an Error if group is not found', function (done) {
        var params = { name: 'name', group: 'inexistent' };
        pad.set(params, function (err, p) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('PAD.ITEMS_NOT_FOUND');
          expect(p).toBeUndefined();
          done();
        });
      });

      it('should return an Error if there are users and they are not found',
        function (done) {
          var params = {
            name: 'name',
            group: ggroup._id,
            visibility: 'restricted',
            users: ['inexistent']
          };
          pad.set(params, function (err, p) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('PAD.ITEMS_NOT_FOUND');
            expect(p).toBeUndefined();
            done();
          });
        }
      );

      it('should return an Error if the _id field is fixed and the pad is' +
        ' not found', function (done) {
          var params = {
            name: 'name',
            group: ggroup._id,
            _id: 'notAPad'
          };
          pad.set(params, function (err, p) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('PAD.INEXISTENT');
            expect(p).toBeUndefined();
            done();
          });
        }
      );

      it('should assign defaults if other params are not properly typed nor' +
        'defined and updates group.pads array accordingly', function (done) {
          var params = {
            name: 'conqueringTheWorld',
            group: ggroup._id
          };
          pad.set(params, function (err, p) {
            expect(err).toBeNull();
            expect(ld.isObject(p)).toBeTruthy();
            expect(p._id).toBeDefined();
            expect(ld.startsWith(p._id, 'conqueringtheworld-')).toBeTruthy();
            expect(p.name).toBe('conqueringTheWorld');
            expect(p.group).toBe(ggroup._id);
            expect(p.visibility).toBeNull();
            expect(p.password).toBeNull();
            expect(p.readonly).toBeNull();
            expect(ld.isArray(p.users)).toBeTruthy();
            expect(ld.isEmpty(p.users)).toBeTruthy();
            params.users = 'notAnArray';
            params.visibility = 121;
            params.password = true;
            params.readonly = 'shouldBeABoolean';
            pad.set(params, function (err, p) {
              expect(err).toBeNull();
              expect(ld.isObject(p)).toBeTruthy();
              expect(p._id).toBeDefined();
              expect(p.name).toBe('conqueringTheWorld');
              expect(p.group).toBe(ggroup._id);
              expect(p.visibility).toBeNull();
              expect(p.password).toBeNull();
              expect(p.readonly).toBeNull();
              expect(ld.isArray(p.users)).toBeTruthy();
              expect(ld.isEmpty(p.users)).toBeTruthy();
              group.get(p.group, function (err, g) {
                expect(err).toBeNull();
                expect(ld.includes(g.pads, p._id)).toBeTruthy();
                done();
              });
            });
          });
        }
      );

      it('should return an error if visibility is private with invalid ' +
        'password', function (done) {
          var params = {
          name: 'trapFrank',
          group: ggroup._id,
          visibility: 'private'
        };
        pad.set(params, function (err, p) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('PASSWORD_INCORRECT');
          expect(p).toBeUndefined();
          params.password = 123;
          pad.set(params, function (err, p) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('PASSWORD_INCORRECT');
            expect(p).toBeUndefined();
            done();
          });
        });
      });

      it('should otherwise accept well defined parameters and keeps password ' +
        'after first definition', function (done) {
          var params = {
            name: 'trapFrank',
            group: ggroup._id,
            users: [guser._id],
            visibility: 'restricted',
            readonly: false
          };
          pad.set(params, function (err, p) {
            expect(err).toBeNull();
            expect(ld.isObject(p)).toBeTruthy();
            expect(p._id).toBeDefined();
            expect(ld.startsWith(p._id, 'trapfrank-')).toBeTruthy();
            expect(p.name).toBe('trapFrank');
            expect(p.group).toBe(ggroup._id);
            expect(p.visibility).toBe('restricted');
            expect(p.password).toBeNull();
            expect(p.readonly).toBeFalsy();
            expect(ld.isArray(p.users)).toBeTruthy();
            expect(ld.first(p.users)).toBe(guser._id);
            p.visibility = 'private';
            p.password = 'GraceHasFever';
            pad.set(p, function (err, p) {
              expect(err).toBeNull();
              expect(p._id).toBeDefined();
              expect(p.name).toBe('trapFrank');
              expect(p.visibility).toBe('private');
              expect(ld.isObject(p.password)).toBeTruthy();
              var pass = ld.clone(p.password);
              expect(p.password.salt).toBeDefined();
              expect(p.password.hash).toBeDefined();
              p.name = 'TRAPFrank';
              delete p.password;
              pad.set(p, function (err, p) {
                expect(err).toBeNull();
                expect(p._id).toBeDefined();
                expect(ld.startsWith(p._id, 'trapfrank-')).toBeTruthy();
                expect(p.name).toBe('TRAPFrank');
                expect(p.visibility).toBe('private');
                expect(p.password.salt).toBe(pass.salt);
                expect(p.password.hash).toBe(pass.hash);
                done();
              });
            });
          });
        }
      );

      it('should also allow updating existing pad', function (done) {
        gpad.name = 'shellyNator';
        gpad.visibility = 'restricted';
        gpad.users.push(guser._id);
        pad.set(gpad, function (err, p) {
          expect(err).toBeNull();
          expect(ld.isObject(p)).toBeTruthy();
          expect(p._id).toBe(gpad._id);
          expect(ld.startsWith(p._id, 'shellynator-')).toBeFalsy();
          expect(p.name).toBe('shellyNator');
          expect(p.group).toBe(gpad.group);
          expect(p.visibility).toBe('restricted');
          expect(p.password).toBeNull();
          expect(p.readonly).toBeNull();
          expect(ld.isArray(p.users)).toBeTruthy();
          expect(ld.first(p.users)).toBe(guser._id);
          group.get(p.group, function (err, g) {
            expect(err).toBeNull();
            expect(ld.includes(g.pads, p._id)).toBeTruthy();
            done();
          });
        });
      });

      it('should handle gracefully group changing', function (done) {
        group.set({ name: 'memories', admin: guser._id }, function (err, g) {
          expect(err).toBeNull();
          var oldGroup = gpad.group;
          gpad.group = g._id;
          pad.set(gpad, function (err, p) {
            expect(err).toBeNull();
            expect(p._id).toBe(gpad._id);
            expect(p.name).toBe('shellyNator');
            group.get(p.group, function (err, g) {
              expect(err).toBeNull();
              expect(ld.includes(g.pads, p._id)).toBeTruthy();
              group.get(oldGroup, function (err, g) {
                expect(err).toBeNull();
                expect(ld.includes(g.pads, p._id)).toBeFalsy();
                done();
              });
            });
          });
        });
      });

    });

    describe('pad get', function () {

      beforeAll(initAll);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are not provided as expected',
        function () {
          expect(pad.get).toThrow();
          expect(ld.partial(pad.get, 123)).toThrow();
          expect(ld.partial(pad.get, 'key')).toThrow();
          expect(ld.partial(pad.get, 'key', 'notAFunc')).toThrow();
        }
      );

      it('should return an Error if the key is not found', function (done) {
        pad.get('inexistent', function (err, p) {
          expect(ld.isError(err)).toBeTruthy();
          expect(p).toBeUndefined();
          done();
        });
      });

      it('should return the pad otherwise', function (done) {
        pad.get(gpad._id, function (err, p) {
          expect(err).toBeNull();
          expect(ld.isObject(p)).toBeTruthy();
          expect(p._id).toBeDefined();
          expect(p.name).toBe('exam1');
          expect(p.group).toBe(ggroup._id);
          expect(p.visibility).toBeNull();
          expect(p.password).toBeNull();
          expect(p.readonly).toBeNull();
          expect(ld.isArray(p.users)).toBeTruthy();
          expect(ld.isEmpty(p.users)).toBeTruthy();
          done();
        });
      });

    });

    describe('pad del', function () {

      beforeAll(initAll);
      afterAll(specCommon.reInitDatabase);

      it('should throw errors if arguments are not provided as expected',
        function () {
          expect(pad.del).toThrow();
          expect(ld.partial(pad.del, 123)).toThrow();
          expect(ld.partial(pad.del, 'key')).toThrow();
          expect(ld.partial(pad.del, 'key', 'notAFunc')).toThrow();
        }
      );

      it('should return an Error if the key is not found', function (done) {
        pad.del('inexistent', function (err, p) {
          expect(ld.isError(err)).toBeTruthy();
          expect(p).toBeUndefined();
          done();
        });
      });

      it('should removes and returns null otherwise, removes indexes,' +
        ' including bookmarks', function (done) {
          user.mark('parker', 'pads', gpad._id, function (err) {
            expect(err).toBeNull();
            user.get('parker', function (err, u) {
              expect(err).toBeNull();
              expect(ld.includes(u.bookmarks.pads, gpad._id)).toBeTruthy();
              pad.del(gpad._id, function (err, p) {
                expect(err).toBeNull();
                expect(p).toBeUndefined();
                pad.get(gpad._id, function (err, p) {
                  expect(ld.isError(err)).toBeTruthy();
                  expect(p).toBeUndefined();
                  group.get(gpad.group, function (err, g) {
                    expect(err).toBeNull();
                    expect(ld.includes(g.pads, gpad._id)).toBeFalsy();
                    user.get('parker', function (err, u) {
                      expect(err).toBeNull();
                      var isMarked = ld.includes(u.bookmarks.pads, gpad._id);
                      expect(isMarked).toBeFalsy();
                      done();
                    });
                  });
                });
              });
            });
          });
        }
      );

    });

}).call(this);
