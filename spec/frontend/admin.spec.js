/**
*  # Admin functional testing
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
  'use strict';
  // Dependencies
  var common = require('./common.js');
  var fill = common.helper.fill;

  var admin = {};

  admin.run = function (app) {
    // Shared variables
    var $el;
    var qfirst = function (sel) { return app.document.querySelector(sel); };

    describe('admin module testing', function () {

      beforeAll(function (done) {
        // Go to admin page
        app.document.querySelector('footer a[href$=admin]').click();
        window.setTimeout(done, 200);
      });

      describe('login testing', function () {

        beforeEach(function (done) {
          $el = {
            form: qfirst('form'),
            login: qfirst('input[name=login]'),
            password: qfirst('input[name=password]'),
            submit: qfirst('input[type=submit]')
          };
          window.setTimeout(done, 100);
        });

        it('should forbid submision whith no login/pass fill', function (done) {
          $el.submit.click();
          expect($el.login.checkValidity()).toBeFalsy();
          expect($el.password.checkValidity()).toBeFalsy();
          expect($el.form.checkValidity()).toBeFalsy();
          fill($el.login,'a login');
          expect($el.login.checkValidity()).toBeTruthy();
          expect($el.form.checkValidity()).toBeFalsy();
          $el.submit.click();
          done();
        });


        it('should allow submission with conform login and password',
          function (done) {
            fill($el.login,'mikey');
            fill($el.password,'goodSizePass');
            expect($el.form.checkValidity()).toBeTruthy();
            done();
          }
        );

        it('should login if user and pass are ok', function (done) {
          fill($el.login, 'parker');
          fill($el.password, 'parkerEtherAdmin');
          expect($el.form.checkValidity()).toBeTruthy();
          $el.submit.click();
          window.setTimeout(function () {
            var $success = qfirst('body > section p');
            expect($success.parentNode.className).toMatch('success');
            $success.click();
            window.setTimeout(done, 100);
          }, 200);
        });

      });

      describe('settings testing', function () {

        beforeAll(function (done) {
          $el = {
            form: qfirst('form'),
            title: qfirst('input[name=title]'),
            rootUrl: qfirst('input[name=rootUrl]'),
            lang: qfirst('select[name=defaultLanguage]'),
            passwordMin: qfirst('input[name=passwordMin]'),
            passwordMax: qfirst('input[name=passwordMax]'),
            checkMails: qfirst('input[name=checkMails]'),
            tokenDuration: qfirst('input[name=tokenDuration]'),
            SMTPHost: qfirst('input[name=SMTPHost]'),
            SMTPPort: qfirst('input[name=SMTPPort]'),
            SMTPSecure: qfirst('input[name=SMTPSecure]'),
            SMTPUser: qfirst('input[name=SMTPUser]'),
            SMTPPass: qfirst('input[name=SMTPPass]'),
            SMTPEmailFrom: qfirst('input[name=SMTPEmailFrom]'),
            submit: qfirst('input[type=submit]')
          };
          window.setTimeout(done, 100);
        });

        it('should display default values and be valid', function () {
          expect($el.title.value).toBe('MyPads');
          expect($el.title.checkValidity()).toBeTruthy();
          expect($el.rootUrl.value).toBe('http://localhost:8042');
          expect($el.title.checkValidity()).toBeTruthy();
          expect($el.lang.value).toBe('en');
          expect($el.lang.checkValidity()).toBeTruthy();
          expect($el.passwordMin.value).toBe('8');
          expect($el.passwordMin.checkValidity()).toBeTruthy();
          expect($el.passwordMax.value).toBe('30');
          expect($el.passwordMax.checkValidity()).toBeTruthy();
          expect($el.checkMails.value.length).toBe(0);
          expect($el.tokenDuration.value).toBe('60');
          expect($el.SMTPHost.value.length).toBe(0);
          expect($el.SMTPPort.value.length).toBe(0);
          expect($el.SMTPSecure.value.length).toBe(0);
          expect($el.SMTPUser.value.length).toBe(0);
          expect($el.SMTPPass.value.length).toBe(0);
          expect($el.SMTPEmailFrom.value.length).toBe(0);
          expect($el.form.checkValidity()).toBeTruthy();
        });

        it('should forbid submission whith bad input', function (done) {
          fill($el.title, '');
          expect($el.title.checkValidity()).toBeFalsy();
          fill($el.passwordMin, '');
          expect($el.passwordMin.checkValidity()).toBeFalsy();
          fill($el.passwordMax, '0');
          expect($el.passwordMax.checkValidity()).toBeFalsy();
          fill($el.SMTPEmailFrom, 'notanemail');
          expect($el.SMTPEmailFrom.checkValidity()).toBeFalsy();
          fill($el.SMTPEmailFrom, '');
          $el.submit.click();
          expect($el.form.checkValidity()).toBeFalsy();
          window.setTimeout(done, 100);
        });

        it('should warn if password sizes are incorrect', function (done) {
          fill($el.title, 'Title');
          expect($el.title.checkValidity()).toBeTruthy();
          $el.lang.value = 'fr';
          $el.lang.onchange($el.lang);
          expect($el.lang.checkValidity()).toBeTruthy();
          fill($el.passwordMin, '12');
          expect($el.passwordMin.checkValidity()).toBeTruthy();
          fill($el.passwordMax, '8');
          expect($el.passwordMax.checkValidity()).toBeTruthy();
          $el.submit.click();
          expect($el.form.checkValidity()).toBeTruthy();
          window.setTimeout(function () {
            var $warn = qfirst('body > section p');
            expect($warn.parentNode.className).toMatch('warning');
            $warn.click();
            window.setTimeout(done, 100);
          }, 200);
        });

        it('should update configuration otherwise', function (done) {
          fill($el.passwordMin, '6');
          fill($el.passwordMax, '32');
          $el.submit.click();
          window.setTimeout(function () {
            var $success = qfirst('body > section p');
            expect($success.parentNode.className).toMatch('success');
            $success.click();
            expect(qfirst('header div h1').textContent).toBe($el.title.value);
            window.setTimeout(done, 100);
          }, 300);
        });

      });

      describe('admin logout testing', function () {

        it('should logout if already admin', function (done) {
          qfirst('header nav a[href$="admin/logout"]').click();
          window.setTimeout(function () {
            var $success = qfirst('body > section p');
            expect($success.parentNode.className).toMatch('success');
            $success.click();
            window.setTimeout(done, 100);
          }, 200);
        });

      });

    });

  };

  return admin;

}).call(this);
