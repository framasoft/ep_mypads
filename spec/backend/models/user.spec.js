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
  var user = require('../../../models/user.js');

  describe('user', function () {
    beforeAll(function (done) {
      var init = require('../../../configuration.js').init;
      init(done);
    });

    describe('creation', function () {

      it('should return a TypeError and a message if either login or password' +
        ' aren\'t given; nor callback function', function () {
        expect(user.add).toThrow();
        expect(ld.partial(user.add, { another: 'object' })).toThrow();
        expect(ld.partial(user.add, { login: 'Johnny' })).toThrow();
        expect(ld.partial(user.add, { password: 'secret' })).toThrow();
        expect(ld.partial(user.add, { login: 'john', password: 'secret' })).toThrow();
      });
      it('should return an Error to the callback if password size is not' +
        ' appropriate', function (done) {
        user.add({ login: 'bob', password: '1'}, function (err, res) {
          expect(ld.isError(err)).toBeTruthy();
          done();
        });
      });
      it('should accept any creation if login & password are fixed', function () {
        var u;
        expect(function () {
          u = user.add({ login: 'parker', password: 'lovesKubiak' });
        }).not.toThrow();
        expect(u.login).toBe('parker');
        expect(u.password).toBeDefined();
      });
    });
  });

  describe('helpers', function() {});
}).call(this);
