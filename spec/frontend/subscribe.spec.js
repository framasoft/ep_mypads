/**
*  # Subcription functional testing
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
*/

module.exports = (function () {
  // Dependencies
  var ld = require('lodash');
  var common = require('./common.js');
  var fill = common.helper.fill;

  var subscribe = {};

  // Shared variables
  var first;
  var $el;
  var hash;

  subscribe.beforeAll = function (app, done) {
    // Go to subscription page
    common.user.beforeAll(app, 'header > nav > ul > li:last-child > a',
      function (el) {
        $el = el;
        first = function (sel) { return app.document.querySelector(sel); };
        hash = app.location.search;
        ld.assign($el, { login: first('input[name=login]') });
        done();
      }
    );
  };

  subscribe.run = function (app) {

    describe('subscription module testing', function () {
      beforeAll(function (done) { subscribe.beforeAll(app, done); });

      it('should forbid subscription with no fill', function (done) {
        $el.submit.click();
        expect($el.form.checkValidity()).toBeFalsy();
        expect($el.login.checkValidity()).toBeFalsy();
        expect($el.password.checkValidity()).toBeFalsy();
        expect($el.passwordConfirm.checkValidity()).toBeFalsy();
        expect($el.email.checkValidity()).toBeFalsy();
        expect($el.firstname.checkValidity()).toBeTruthy();
        expect($el.lastname.checkValidity()).toBeTruthy();
        expect($el.organization.checkValidity()).toBeTruthy();
        done();
      });

      it('should forbid subscription with incorrect fill', function (done) {
        fill($el.login, 'mikey');
        fill($el.password, 'short');
        fill($el.email, 'notamail');
        expect($el.form.checkValidity()).toBeFalsy();
        expect($el.login.checkValidity()).toBeTruthy();
        expect($el.password.checkValidity()).toBeFalsy();
        expect($el.email.checkValidity()).toBeFalsy();
        done();
      });

      it('should forbid subscription with unmatched passwords',
        function (done) {
          fill($el.login, 'mikey');
          fill($el.password, 'betterPassword');
          fill($el.passwordConfirm, 'betterPassword123');
          fill($el.email, 'mikey@randall.me');
          expect($el.form.checkValidity()).toBeTruthy();
          expect($el.login.checkValidity()).toBeTruthy();
          expect($el.password.checkValidity()).toBeTruthy();
          expect($el.email.checkValidity()).toBeTruthy();
          $el.submit.click();
          window.setTimeout(function () {
            expect(app.location.search).toBe(hash);
            var $ialert = first('.icon-alert');
            expect($ialert.getAttribute('data-msg'))
              .toMatch('For verification');
            var $warning = app.document.querySelectorAll('body > section p');
            $warning = $warning[$warning.length - 1];
            expect($warning.textContent)
              .toMatch('The entered passwords do not match');
            $warning.click();
            done();
          }, 100);
        }
      );

      it('should disallow subscription for existing user', function (done) {
        fill($el.login, 'parker');
        fill($el.password, 'betterPassword123');
        fill($el.passwordConfirm, 'betterPassword123');
        fill($el.email, 'parker@lewis.me');
        expect($el.form.checkValidity()).toBeTruthy();
        expect($el.login.checkValidity()).toBeTruthy();
        expect($el.password.checkValidity()).toBeTruthy();
        expect($el.email.checkValidity()).toBeTruthy();
        $el.submit.click();
        window.setTimeout(function () {
          expect(app.location.search).toBe(hash);
          var $error = app.document.querySelectorAll('body > section p');
          $error = $error[$error.length - 1];
          expect($error.textContent).toMatch('user already exist');
          $error.click();
          done();
        }, 100);
      });

      it('should allow subscription with good filling', function (done) {
        var login = 'mikey-' + new Date().getTime();
        fill($el.login, login);
        fill($el.password, 'betterPassword123');
        fill($el.passwordConfirm, 'betterPassword123');
        fill($el.email, 'mikey@randall.me');
        expect($el.form.checkValidity()).toBeTruthy();
        expect($el.login.checkValidity()).toBeTruthy();
        expect($el.password.checkValidity()).toBeTruthy();
        expect($el.email.checkValidity()).toBeTruthy();
        $el.submit.click();
        window.setTimeout(function () {
          expect(app.location.search).not.toBe(hash);
          var $success = app.document.querySelectorAll('body > section p');
          $success = $success[$success.length - 1];
          expect($success.textContent).toMatch('Successfull subscription');
          $success.click();
          first('.icon-logout').parentNode.click();
          window.setTimeout(function () {
            expect(first('.icon-login')).toBeTruthy();
            first('body > section p').click();
            done();
          }, 100);
        }, 100);
      });
    });
  };

  return subscribe;
  
}).call(this);
