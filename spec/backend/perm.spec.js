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
  var encode = require('js-base64').Base64.encode;
  var jwt = require('jsonwebtoken');

  var specCommon = require('./common.js');
  var perm = require('../../perm.js');
  var auth = require('../../auth.js');
  var user = require('../../model/user.js');
  var group = require('../../model/group.js');
  var pad = require('../../model/pad.js');

  describe('perm', function () {
    var users = {
      parker: {
        login: 'parker',
        password: 'lovesKubiak',
        email: 'parker@lewis.me'
      },
      jerry: {
        login: 'jerry',
        password: 'lovesKubiakToo',
        email: 'jerry@steiner.me'
      }
    };
    var groups = {};
    var pads = {};
    var getJwt = function (login) {
      return jwt.sign({
        login: login,
        key: auth.tokens[login].key
      }, auth.secret);
    };

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
                  pads.collegePrivate = {
                    name: 'Private lesson',
                    group: groups.college._id,
                    visibility: 'private',
                    password: 'somePass'
                  };
                  pads.memories = {
                    name: 'Our first meet',
                    group: groups.memories._id
                  };
                  pads.memoriesPublic = {
                    name: 'Public meeting',
                    group: groups.memories._id,
                    visibility: 'public',
                    readonly: true
                  };
                  pads.memoriesPrivate = {
                    name: 'Private meeting',
                    group: groups.memories._id,
                    visibility: 'private',
                    password: 'm3et1nG'
                  };
                  pads.annie = {
                    name: 'Falling in love',
                    group: groups.annie._id
                  };
                  pads.annieOwnPass = {
                    name: 'Falling in love',
                    group: groups.annie._id,
                    visibility: 'private',
                    password: 'v3rYS3cre7'
                  };
                  pad.set(pads.college, function (err, p) {
                    if (!err) { pads.college = p; }
                    pad.set(pads.collegePrivate, function (err, p) {
                      if (!err) { pads.collegePrivate = p; }
                      pad.set(pads.memories, function (err, p) {
                        if (!err) { pads.memories = p; }
                        pad.set(pads.memoriesPublic, function (err, p) {
                          if (!err) { pads.memoriesPublic = p; }
                          pad.set(pads.memoriesPrivate, function (err, p) {
                            if (!err) { pads.memoriesPrivate = p; }
                            pad.set(pads.annie, function (err, p) {
                              if (!err) { pads.annie = p; }
                              pad.set(pads.annieOwnPass, function (err, p) {
                                if (!err) { pads.annieOwnPass = p; }
                                auth.tokens.parker = users.parker;
                                auth.tokens.jerry = users.jerry;
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
          });
        });
      });
    });

    afterAll(specCommon.reInitDatabase);

    describe('local function check', function () {
      var next = function () { return true; };
      var req = { params: {}, query: {} };
      var res = {
        status: function (code) { this.code = code; return this; },
        send: function (msg) { this.msg = msg; return this; },
        redirect: function (route) { this.route = route; return this; }
      };

      it('should pass if pad has not been created by mypads', function (done) {
        req.params.pid = 'inexistentOne';
        perm.check(req, res, function () {
          expect(true).toBeTruthy();
          done();
        });
      });

      it('should allow access for admin user', function (done) {
        req.query.auth_token = getJwt('parker');
        req.params.pid = pads.college._id;
        perm.check(req, res, function () {
          expect(res.code).toBeUndefined();
          expect(res.msg).toBeUndefined();
          req.params.pid = pads.memories._id;
          perm.check(req, res, function () {
            expect(res.code).toBeUndefined();
            expect(res.msg).toBeUndefined();
            req.params.pid = pads.annie._id;
            perm.check(req, res, function () {
              expect(res.code).toBeUndefined();
              expect(res.msg).toBeUndefined();
              done();
            });
          });
        });
      });

      it('should allow access to all for public group', function (done) {
        delete req.query.auth_token;
        req.params.pid = pads.college._id;
        perm.check(req, res, function () {
          expect(res.code).toBeUndefined();
          expect(res.msg).toBeUndefined();
          done();
        });
      });

      it('should forbid access for user not invited', function (done) {
        req.params.pid = pads.memories._id;
        perm.check(req, res, next);
        setTimeout(function () {
          expect(res.route).toMatch(req.params.pid);
          delete res.route;
          req.query.auth_token = getJwt('jerry');
          perm.check(req, res, next);
          setTimeout(function () {
            expect(res.route).toMatch(req.params.pid);
            done();
          }, 100);
        }, 100);

      });

      it('should allow access for user invited', function (done) {
        delete res.code;
        delete res.msg;
        groups.memories.admin = users.parker._id;
        groups.memories.users = [users.jerry._id];

        group.set(groups.memories, function (err, g) {
          expect(err).toBeNull();
          groups.memories = g;
          req.query.auth_token = getJwt('jerry');
          perm.check(req, res, function () {
            expect(res.code).toBeUndefined();
            expect(res.msg).toBeUndefined();
            done();
          });
        });
      });

      it('should forbid access for private without password', function (done) {
        delete res.route;
        req.query.auth_token = getJwt('jerry');
        req.params.pid = pads.annie._id;

        perm.check(req, res, next);
        setTimeout(function () {
          expect(res.route).toMatch(req.params.pid);
          done();
        }, 100);
      });

      it('should forbid access for private with bad password', function (done) {
        delete res.route;
        req.query.auth_token = getJwt('jerry');
        req.params.pid = pads.annie._id;
        req.query.mypadspassword = 'badOne';

        perm.check(req, res, next);
        setTimeout(function () {
          expect(res.route).toMatch(req.params.pid);
          done();
        }, 100);
      });

      it('should allow access for private with good password', function (done) {
        delete res.route;
        req.query.auth_token = getJwt('jerry');
        req.params.pid = pads.annie._id;
        req.query.mypadspassword = encode('myLovelyGirl');

        perm.check(req, res, function () {
          expect(res.route).toBeUndefined();
          done();
        });
      });

      it('should forbid access to private pad in public group',
        function (done) {
          delete res.route;
          delete req.query.auth_token;
          delete req.query.mypadspassword;
          req.params.pid = pads.collegePrivate._id;

          perm.check(req, res, next);
          setTimeout(function () {
            expect(res.route).toMatch(req.params.pid);
            done();
          }, 100);
        }
      );

      it('should allow access to private pad in public group with password',
        function (done) {
          delete res.route;
          delete req.query.auth_token;
          req.params.pid = pads.collegePrivate._id;
          req.query.mypadspassword = encode('somePass');

          perm.check(req, res, function () {
            expect(res.route).toBeUndefined();
            done();
          });
        }
      );

      it('should allow access to private pad with its own password in ' +
        'private group', function (done) {
          delete res.route;
          delete req.query.auth_token;
          req.params.pid = pads.annieOwnPass._id;
          req.query.mypadspassword = encode('badPass');
          perm.check(req, res, next);
          setTimeout(function () {
            expect(res.route).toMatch(req.params.pid);
            delete res.route;
            req.query.mypadspassword = encode('myLovelyGirl');
            perm.check(req, res, next);
            setTimeout(function () {
              expect(res.route).toMatch(req.params.pid);
              delete res.route;
              req.query.mypadspassword = encode('v3rYS3cre7');
              perm.check(req, res, function () {
                expect(res.route).toBeUndefined();
                done();
              });
            }, 100);
          }, 100);

        }
      );

      it('should allow access to public pad in restricted group',
        function (done) {
          delete res.code;
          delete res.msg;
          delete req.query.auth_token;
          req.params.pid = pads.memoriesPublic._id;
          perm.check(req, res, next);
          setTimeout(function () {
            expect(res.code).toBe(200);
            expect(res.msg).toMatch('Testing only');
            done();
          }, 100);
        }
      );

      it('should allow access to private pad in restricted group with password',
        function (done) {
          delete res.route;
          req.query.auth_token = getJwt('jerry');
          req.params.pid = pads.memoriesPrivate._id;
          req.query.mypadspassword = encode('m3et1nG');

          perm.check(req, res, function () {
            expect(res.route).toBeUndefined();
            done();
          });
        }
      );

    });

    describe('local function readonly', function () {
      var next = function () { return true; };
      var req = { params: {}, query: {} };
      var res = {
        status: function (code) { this.code = code; return this; },
        send: function (msg) { this.msg = msg; return this; }
      };

      it('should pass if pad has not been created by mypads', function (done) {
        req.params.pid = 'inexistentOne';
        perm.check(req, res, function () {
          expect(true).toBeTruthy();
          done();
        });
      });

      it('should pass if pad is not readonly', function (done) {
        req.params.pid = pads.college._id;
        perm.check(req, res, function () {
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
          perm.check(req, res, next);
          setTimeout(function () {
            expect(res.code).toBe(200);
            expect(res.msg).toMatch('Testing only');
            delete res.code;
            delete res.msg;
            req.params.pid = pads.memoriesPublic._id;
            perm.check(req, res, next);
            setTimeout(function () {
              expect(res.code).toBe(200);
              expect(res.msg).toMatch('Testing only');
              done();
            }, 100);
          }, 100);
        });
      });

    });

    describe('local function set name and color', function () {
      var req = { params: {}, query: {} };
      var res = {};

      beforeEach(function () {
        perm.padAndAuthor = {};
      });

      it('should do nothing if user does not want to use its params',
        function (done) {
          expect(ld.isObject(perm.padAndAuthor)).toBeTruthy();
          expect(ld.isEmpty(perm.padAndAuthor)).toBeTruthy();
          auth.tokens.jerry.useLoginAndColorInPads = false;
          perm.setNameAndColor(req, res, function () {
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
          req.query.auth_token = getJwt('parker');
          ld.assign(auth.tokens.parker, {
            useLoginAndColorInPads: true,
            color: null
          });
          perm.setNameAndColor(req, res, function () {
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
        req.query.auth_token = getJwt('parker');
        ld.assign(auth.tokens.parker, {
          useLoginAndColorInPads: true,
          color: '#00ff00'
        });
        perm.setNameAndColor(req, res, function () {
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
          req.query.auth_token = getJwt('parker');
          ld.assign(auth.tokens.parker, {
            useLoginAndColorInPads: true,
            color: '#00ff00'
          });
          perm.setNameAndColor(req, res, function () {
            expect(ld.size(ld.keys(perm.padAndAuthor))).toBe(1);
            expect(ld.first(ld.keys(perm.padAndAuthor))).toBe('azerty');
            var opts = perm.padAndAuthor.azerty;
            expect(opts.userName).toBe('parker');
            expect(opts.userColor).toBe('#00ff00');
            req.query.auth_token = getJwt('jerry');
            perm.setNameAndColor(req, res, function () {
              expect(ld.isObject(perm.padAndAuthor)).toBeTruthy();
              expect(ld.isEmpty(perm.padAndAuthor)).toBeTruthy();
              done();
            });
          });
        }
      );

    });

  });

}).call(this);
