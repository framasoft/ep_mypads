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
  var specCommon = require('./common.js');
  var perm = require('../../perm.js');
  var user = require('../../model/user.js');
  var group = require('../../model/group.js');
  var pad = require('../../model/pad.js');

  describe('perm', function () {
    var users = {
      parker: { login: 'parker', password: 'lovesKubiak' },
      jerry: { login: 'jerry', password: 'lovesKubiakToo' }
    };
    var groups = {};
    var pads = {};

    beforeAll(function (done) {
      specCommon.reInitDatabase(function () {
        user.set(users.parker, function (err, u) {
          if (!err) { users.parker = u; }
          user.set(users.jerry, function (err, u) {
            if (!err) { users.jerry = u; }
            groups.college = {
              name: 'College',
              visibility: 'public',
              admin: users.parker._id,
              users: [users.jerry._id]
            };
            groups.memories = {
              name: 'Memories',
              visibility: 'restricted',
              admin: users.parker._id
            };
            groups.annie = {
              name: 'Annie',
              visibility: 'private',
              password: 'myLovelyGirl',
              admin: users.parker._id
            };
            group.set(groups.college, function (err, g) {
              if (!err) { groups.college = g; }
              group.set(groups.memories, function (err, g) {
                if (!err) { groups.memories = g; }
                group.set(groups.annie, function (err, g) {
                  if (!err) { groups.annie = g; }
                  pads.college = {
                    name: 'Lesson 1',
                    group: groups.college._id
                  };
                  pads.memories = {
                    name: 'Our first meet',
                    group: groups.memories._id
                  };
                  pads.annie = {
                    name: 'Falling in love',
                    group: groups.annie._id
                  };
                  pad.set(pads.college, function (err, p) {
                    if (!err) { pads.college = p; }
                    pad.set(pads.memories, function (err, p) {
                      if (!err) { pads.memories = p; }
                      pad.set(pads.annie, function (err, p) {
                        if (!err) { pads.annie = p; }
                        done();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

    afterAll(specCommon.reInitDatabase);

    describe('local function check', function () {
      var next = function () { return true; };
      var req = { params: {}, session: {}, query: {} };
      var res = {
        status: function (code) { this.code = code; return this; },
        send: function (msg) { this.msg = msg; return this; }
      };

      it('should pass if pad has not been created by mypads', function (done) {
        req.params.pid = 'inexistentOne';
        perm.fn.check(req, res, function () {
          expect(true).toBeTruthy();
          done();
        });
      });

      it('should allow access for admin user', function () {
        req.session.mypadsUid = users.parker._id;
        req.params.pid = pads.college._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBeUndefined();
        expect(res.msg).toBeUndefined();

        req.params.pid = pads.memories._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBeUndefined();
        expect(res.msg).toBeUndefined();

        req.params.pid = pads.annie._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBeUndefined();
        expect(res.msg).toBeUndefined();
      });

      it('should allow access to all for public group', function () {
        delete req.session.mypadsUid;
        req.params.pid = pads.college._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBeUndefined();
        expect(res.msg).toBeUndefined();
      });

      it('should forbid access for user not invited', function () {
        req.params.pid = pads.memories._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBe(403);
        expect(res.msg.error).toMatch('UNAUTHORIZED');

        req.session.mypadsUid = users.jerry._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBe(403);
        expect(res.msg.error).toMatch('UNAUTHORIZED');
      });

      it('should allow access for user invited', function (done) {
        delete res.code;
        delete res.msg;
        groups.memories.admin = users.parker._id;
        groups.memories.users = [users.jerry._id];

        group.set(groups.memories, function (err, g) {
          expect(err).toBeNull();
          groups.memories = g;
          req.session.mypadsUid = users.jerry._id;
          perm.fn.check(req, res, next);
          expect(res.code).toBeUndefined();
          expect(res.msg).toBeUndefined();
          done();
        });
      });

      it('should forbid access for private without password', function () {
        req.session.mypadsUid = users.jerry._id;
        req.params.pid = pads.annie._id;

        perm.fn.check(req, res, next);
        expect(res.code).toBe(403);
        expect(res.msg.error).toMatch('UNAUTHORIZED');
      });

      it('should forbid access for private with bad password', function (done) {
        delete res.code;
        delete res.msg;
        req.session.mypadsUid = users.jerry._id;
        req.params.pid = pads.annie._id;
        req.query.mypadspassword = 'badOne';

        perm.fn.check(req, res, next);
        setTimeout(function () {
          expect(res.code).toBe(403);
          expect(res.msg.error).toMatch('UNAUTHORIZED');
          done();
        }, 200);
      });

      it('should allow access for private with good password', function (done) {
        delete res.code;
        delete res.msg;
        req.session.mypadsUid = users.jerry._id;
        req.params.pid = pads.annie._id;
        req.query.mypadspassword = 'myLovelyGirl';

        perm.fn.check(req, res, function () {
          expect(res.code).toBeUndefined();
          expect(res.msg).toBeUndefined();
          done();
        });
      });

    });

    describe('local function readonly', function () {
      var next = function () { return true; };
      var req = { params: {}, session: {} };
      var res = {
        status: function (code) { this.code = code; return this; },
        send: function (msg) { this.msg = msg; return this; }
      };

      it('should pass if pad has not been created by mypads', function (done) {
        req.params.pid = 'inexistentOne';
        perm.fn.readonly(req, res, function () {
          expect(true).toBeTruthy();
          done();
        });
      });

      it('should pass if pad is not readonly', function (done) {
        req.params.pid = pads.college._id;
        perm.fn.readonly(req, res, function () {
          expect(true).toBeTruthy();
          done();
        });
      });

      it('should return HTML if pad is readonly', function (done) {
        groups.college.readonly = true;
        groups.college.admin = users.parker._id;
        group.set(groups.college, function (err, g) {
          expect(err).toBeNull();
          expect(g.readonly).toBeTruthy();
          groups.college = g;

          req.params.pid = pads.college._id;
          perm.fn.readonly(req, res, next);
          expect(res.code).toBe(200);
          expect(res.msg).toMatch('Testing only');
          done();
        });
      });

    });

    describe('local function set name and color', function () {
      var req = { params: {}, session: {} };
      var res = {};

      beforeEach(function () {
        perm.padAndAuthor = {};
      });

      it('should do nothing if user does not want to use its params',
        function (done) {
          expect(ld.isObject(perm.padAndAuthor)).toBeTruthy();
          expect(ld.isEmpty(perm.padAndAuthor)).toBeTruthy();
          req.session.mypadsUseLoginAndColorInPads = false;
          perm.fn.setNameAndColor(req, res, function () {
            expect(ld.isObject(perm.padAndAuthor)).toBeTruthy();
            expect(ld.isEmpty(perm.padAndAuthor)).toBeTruthy();
            done();
          });
        }
      );

      it('should use login but not color if no color is defined',
        function (done) {
          expect(ld.isObject(perm.padAndAuthor)).toBeTruthy();
          expect(ld.isEmpty(perm.padAndAuthor)).toBeTruthy();
          req.params.pid = 'azerty';
          req.session = {
            mypadsUseLoginAndColorInPads: true,
            mypadsLogin: 'parker',
            mypadsColor: null
          };
          perm.fn.setNameAndColor(req, res, function () {
            expect(ld.size(ld.keys(perm.padAndAuthor))).toBe(1);
            expect(ld.first(ld.keys(perm.padAndAuthor))).toBe('azerty');
            var opts = perm.padAndAuthor.azerty;
            expect(opts.userName).toBe('parker');
            expect(opts.userColor).toBeUndefined();
            done();
          });
        }
      );

      it('should use login and color if all are defined', function (done) {
        expect(ld.isObject(perm.padAndAuthor)).toBeTruthy();
        expect(ld.isEmpty(perm.padAndAuthor)).toBeTruthy();
        req.params.pid = 'azerty';
        req.session = {
          mypadsUseLoginAndColorInPads: true,
          mypadsLogin: 'parker',
          mypadsColor: '#00ff00'
        };
        perm.fn.setNameAndColor(req, res, function () {
          expect(ld.size(ld.keys(perm.padAndAuthor))).toBe(1);
          expect(ld.first(ld.keys(perm.padAndAuthor))).toBe('azerty');
          var opts = perm.padAndAuthor.azerty;
          expect(opts.userName).toBe('parker');
          expect(opts.userColor).toBe('#00ff00');
          done();
        });
      });

      it('should remember only the last options for a given pad',
        function (done) {
          req.params.pid = 'azerty';
          req.session = {
            mypadsUseLoginAndColorInPads: true,
            mypadsLogin: 'parker',
            mypadsColor: '#00ff00'
          };
          perm.fn.setNameAndColor(req, res, function () {
            expect(ld.size(ld.keys(perm.padAndAuthor))).toBe(1);
            expect(ld.first(ld.keys(perm.padAndAuthor))).toBe('azerty');
            var opts = perm.padAndAuthor.azerty;
            expect(opts.userName).toBe('parker');
            expect(opts.userColor).toBe('#00ff00');
            req.session.mypadsLogin = 'jerry';
            perm.fn.setNameAndColor(req, res, function () {
              expect(ld.size(ld.keys(perm.padAndAuthor))).toBe(1);
              expect(ld.first(ld.keys(perm.padAndAuthor))).toBe('azerty');
              expect(perm.padAndAuthor.azerty.userName).toBe('jerry');
              done();
            });
          });
        }
      );

    });

  });

}).call(this);
