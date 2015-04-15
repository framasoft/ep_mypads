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
  // To use mithril oninput...
  var fill = function (el, val) {
    el.value = val;
    el.dispatchEvent(new window.KeyboardEvent('input'));
  };
  var login = {};

  var first;
  var $el;
  login.beforeAll = function (app) {
    // Go to login page
    app.document.querySelector('header > nav a:first-child').click();
    first = function (sel) { return app.document.querySelector(sel); };
    $el = {
      form: first('form'),
      login: first('input[name=login]'),
      password: first('input[name=password]'),
      submit: first('input[type=submit]')
    };
  };

  login.run = function (app) {

    describe('login module testing', function () {

      beforeAll(login.beforeAll.bind(null, app));

      afterEach(function (done) {
        $el.login.value = '';
        $el.password.value = '';
        done();
      });

      it('should forbid submision whith no login/pass fill', function (done) {
        $el.submit.click();
        expect($el.form.checkValidity()).toBeFalsy();
        done();
      });

      it('should forbid submission whith incorrect log/pass', function (done) {
        $el.login.value = 'a login';
        expect($el.form.checkValidity()).toBeFalsy();
        expect($el.login.checkValidity()).toBeTruthy();
        expect($el.password.checkValidity()).toBeFalsy();
        $el.password.value = 'short';
        expect($el.form.checkValidity()).toBeFalsy();
        expect($el.login.checkValidity()).toBeTruthy();
        expect($el.password.checkValidity()).toBeFalsy();
        done();
      });

      it('should allow submission with conform login and password',
        function (done) {
          $el.login.value = 'mikey';
          $el.password.value = 'goodSizeForPass';
          expect($el.form.checkValidity()).toBeTruthy();
          done();
        }
      );

      it('should return an error if user does not exist or password is bad',
        function (done) {
          fill($el.login, 'fakeMikey');
          fill($el.password, 'goodSizeForPass');
          expect($el.form.checkValidity()).toBeTruthy();
          $el.submit.click();
          window.setTimeout(function () {
            var $err = first('body > section p');
            expect($err.innerHTML).toMatch('not found');
            $err.click();
            done();
          }, 100); // Too low ?
        }
      );

      it('should login if user and pass are ok', function (done) {
        fill($el.login, 'parker');
        fill($el.password, 'lovesKubiak');
        expect($el.form.checkValidity()).toBeTruthy();
        $el.submit.click();
        window.setTimeout(function () {
          var $success = first('body > section p');
          expect($success.innerHTML).toMatch('Success');
          $success.click();
          window.setTimeout(function () {
            expect(app.location.search).toBe('?/');
            first('.icon-logout').parentNode.click();
            window.setTimeout(done, 100);
          }, 100);
        }, 100); // Too low ?
      });

    describe('logout module testing', function () {

      beforeAll(login.beforeAll.bind(null, app));

      it('should logout after login', function (done) {
        fill($el.login, 'parker');
        fill($el.password, 'lovesKubiak');
        $el.submit.click();
        window.setTimeout(function () {
          first('body > section p').click();
          first('.icon-logout').parentNode.click();
          window.setTimeout(function () {
            expect(first('.icon-login')).toBeTruthy();
            done();
          }, 100);
        }, 100);
      });
    });

    });
  };
  return login;
}).call(this);
