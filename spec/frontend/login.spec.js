/**
*  # Login functional testing
*
*  ## License
*
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
*
*  ## Description
*
*  This module is the entry point for front JavaScript programming. It requires
*  global dependencies and main client-side file.
*/

module.exports = (function () {
  var login = {};
  login.run = function (app) {

    describe('login module testing', function () {
      var $elements;
      beforeAll(function () {
        // Go to login page
        app.document.querySelector('header > nav a:first-child').click();
        var first = function (sel) { return app.document.querySelector(sel); };
        $elements = {
          form: first('form'),
          login: first('input[name=login]'),
          password: first('input[name=password]'),
          submit: first('input[type=submit]')
        };
      });

      it('should not reroute whith no login/pass fill', function (done) {
        var hash = app.location.search;
        $elements.submit.click();
        expect(app.location.search).toBe(hash);
        done();
      });
    });
  };
  return login;
}).call(this);
