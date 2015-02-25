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
  var user = require('../../model/user.js');
  var auth = require('../../auth.js');

  describe('auth', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('isPasswordValid', function () {
      var u;
      beforeAll(function (done) {
        user.fn.hashPassword(null, 'password', function (err, res) {
          if (err) { console.log(err); }
          u = { password: res };
          done();
        });
      });

      it('should return null and false if password does not match', 
        function (done) {
          auth.fn.isPasswordValid(u, 'anotherOne', function (err, res) {
            expect(err).toBeNull();
            expect(res).toBeFalsy();
            done();
          });
        }
      );

      it('should return null and true if password does match', function (done) {
        auth.fn.isPasswordValid(u, 'password', function (err, res) {
          expect(err).toBeNull();
          expect(res).toBeTruthy();
          done();
        });
      });
    });
  });


}).call(this);
