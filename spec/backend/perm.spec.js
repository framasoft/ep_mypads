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
        req.session.uid = users.parker._id;
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
        delete req.session.uid;
        req.params.pid = pads.college._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBeUndefined();
        expect(res.msg).toBeUndefined();
      });

      it('should forbid access for user not invited', function () {
        req.params.pid = pads.memories._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBe(403);
        expect(res.msg).toMatch('You are not allowed');

        req.session.uid = users.jerry._id;
        perm.fn.check(req, res, next);
        expect(res.code).toBe(403);
        expect(res.msg).toMatch('You are not allowed');
      });

      it('should allow access for user invited', function (done) {
        delete res.code;
        delete res.msg;
        groups.memories.admin = users.parker._id;
        groups.memories.users = [users.jerry._id];

        group.set(groups.memories, function (err, g) {
          expect(err).toBeNull();
          groups.memories = g;
          req.session.uid = users.jerry._id;
          perm.fn.check(req, res, next);
          expect(res.code).toBeUndefined();
          expect(res.msg).toBeUndefined();
          done();
        });
      });

      it('should forbid access for private without password', function () {
        req.session.uid = users.jerry._id;
        req.params.pid = pads.annie._id;

        perm.fn.check(req, res, next);
        expect(res.code).toBe(403);
        expect(res.msg).toMatch('You are not allowed');
      });

      it('should forbid access for private with bad password', function (done) {
        delete res.code;
        delete res.msg;
        req.session.uid = users.jerry._id;
        req.params.pid = pads.annie._id;
        req.query.mypadspassword = 'badOne';

        perm.fn.check(req, res, next);
        setTimeout(function () {
          expect(res.code).toBe(403);
          expect(res.msg).toMatch('You are not allowed');
          done();
        }, 200);
      });

      it('should allow access for private with good password', function (done) {
        delete res.code;
        delete res.msg;
        req.session.uid = users.jerry._id;
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

  });

}).call(this);
