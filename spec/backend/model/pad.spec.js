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
  var _u;
  var _g;
  var _p;

  var initAll = function (done) {
    specCommon.reInitDatabase(function () {
      user.set({ login: 'parker', password: 'lovesKubiak' }, function (err, u) {
        if (!err) { _u = u; }
        group.set({ name: 'college', admin: _u._id }, function (err, g) {
          if (!err) { _g = g; }
          pad.set({ name: 'exam1', group: _g._id }, function (err, p) {
            if (!err) { _p = p; }
            done();
          });
        });
      });
    });
  };

  describe('Pad', function () {});
    beforeAll(initAll);
    afterAll(initAll);

    describe('setting a pad', function () {
      beforeAll(specCommon.reInitDatabase);
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

      it('should return an Error if group is not found', function (done) {
        var params = { name: 'name', group: 'group1', _id: 'inexistent' };
        pad.set(params, function (err, p) {
          expect(ld.isError(err)).toBeTruthy();
          expect(err).toMatch('pad does not exist'); 
          expect(p).toBeUndefined();
          done();
        });
      });

      it('should return an Error if there are users and they are not found',
        function (done) {
          var params = {
            name: 'name',
            group: _g._id,
            visibility: 'restricted',
            users: ['inexistent']
          };
          pad.set(params, function (err, p) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('some users not found'); 
            expect(p).toBeUndefined();
            done();
          });
        }
      );

      it('should return an Error if the _id field is fixed and the pad is' +
        ' not found', function (done) {
          var params = {
            name: 'name',
            group: _g._id,
            _id: 'notAPad'
          };
          pad.set(params, function (err, p) {
            expect(ld.isError(err)).toBeTruthy();
            expect(err).toMatch('pad does not exist'); 
            expect(p).toBeUndefined();
            done();
          });
        }
      );

      xit('should assign defaults if other params are not properly typed nor' +
        'defined', function (done) {
          done();
        }
      );

      xit('should otherwise accept well defined parameters', function (done) {
        done();
      });
    });

}).call(this);
