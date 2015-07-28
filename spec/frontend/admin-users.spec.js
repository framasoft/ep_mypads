/**
*  # Admin Users Management functional testing
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
  var ld = require('lodash');
  var common = require('./common.js');
  var fill = common.helper.fill;

  var admin = {};

  admin.run = function (app) {
    // Shared variables
    var $el;
    var qfirst = function (sel) { return app.document.querySelector(sel); };
    var qall = function (sel) { return app.document.querySelectorAll(sel); };

    describe('admin users management module testing', function () {

      beforeAll(function (done) {
        qfirst('ul.lang li:first-child').click();
        window.setTimeout(function () {
          // Go to admin users page
          qfirst('footer a[href$=admin]').click();
          fill(qfirst('input[name=login]'), 'parker');
          fill(qfirst('input[name=password]'), 'parkerEtherAdmin');
          qfirst('input[type=submit]').click();
          window.setTimeout(function () {
            qfirst('body > section p').click();
            window.setTimeout(function () {
              qfirst('header nav a[href$="admin/users"]').click();
              window.setTimeout(done, 200);
            });
          }, 200);
        }, 100);
      });

      afterAll(function (done) {
        qfirst('header nav a[href$="admin/logout"]').click();
        window.setTimeout(function () {
          qfirst('body > section p').click();
          window.setTimeout(done, 100);
        }, 200);
      });

      describe('admin user research', function () {

        beforeAll(function (done) {
          $el = {
            login: qfirst('input[name=login]'),
            box: qfirst('.admin-users'),
            submit: qfirst('input[type=submit]'),
            form: qfirst('form#users-form')
          };
          window.setTimeout(done, 100);
        });

        it('should display default properly', function () {
          expect(ld.isEmpty($el.login.value)).toBeTruthy();
          expect($el.box.textContent).toMatch('No user');
        });

        it('should require login to search', function (done) {
          $el.submit.click();
          window.setTimeout(function () {
            expect($el.login.checkValidity()).toBeFalsy();
            expect($el.form.checkValidity()).toBeFalsy();
            done();
          }, 100);
        });

        it('should not found inexistent user', function (done) {
          fill($el.login, 'inexistent');
          $el.submit.click();
          window.setTimeout(function () {
            $el.box = qfirst('.admin-users');
            expect($el.box.textContent).toMatch('No user');
            var $err = qfirst('body > section p');
            expect($err.textContent).toMatch('User not found');
            $err.click();
            done();
          }, 200);
        });

        it('should found existent user and propose edit and remove',
          function (done) {
            fill($el.login, 'frank');
            $el.submit.click();
            window.setTimeout(function () {
              var box = qfirst('.admin-users li');
              expect(box.textContent).toMatch('frank');
              var actions = box.querySelectorAll('span.actions a');
              expect(actions[0].getAttribute('title')).toBe('Edit');
              expect(actions[1].getAttribute('title')).toBe('Remove');
              var $info = qfirst('body > section p');
              expect($info.textContent).toMatch('User found');
              $info.click();
              done();
            }, 200);
          }
        );

      });

      describe('admin user edit', function () {

        beforeAll(function (done) {
          qfirst('.admin-users span.actions a').click();
          window.setTimeout(function () {
            $el = {
              password: qfirst('input[name=password]'),
              passwordConfirm: qfirst('input[name=passwordConfirm]'),
              email: qfirst('input[name=email]'),
              lang: qfirst('select[name=lang]'),
              firstname: qfirst('input[name=firstname]'),
              lastname: qfirst('input[name=lastname]'),
              organization: qfirst('input[name=organization]'),
              color: qfirst('input[name=color]'),
              submit: qfirst('input[type=submit]'),
              form: qfirst('form#subscribe-form')
            };
            window.setTimeout(done, 100);
          }, 200);
        });

        it('should display user properties correctly', function () {
          expect(ld.isEmpty($el.password.value)).toBeTruthy();
          expect(ld.isEmpty($el.passwordConfirm.value)).toBeTruthy();
          expect($el.email.value).toBe('frank@gracefanclub.org');
          expect($el.lang.value).toBe('en');
          var options = $el.lang.querySelectorAll('option');
          expect(options[0].value).toBe('en');
          expect(options[1].value).toBe('fr');
          expect(ld.isEmpty($el.firstname.value)).toBeTruthy();
          expect(ld.isEmpty($el.lastname.value)).toBeTruthy();
          expect(ld.isEmpty($el.organization.value)).toBeTruthy();
          expect($el.color.value).toBe('#000000');
        });

        it('should require required fields', function (done) {
          fill($el.email, '');
          $el.lang.value = '';
          $el.lang.onchange($el.lang);
          window.setTimeout(function () {
            expect($el.email.checkValidity()).toBeFalsy();
            expect($el.lang.checkValidity()).toBeFalsy();
            fill($el.email, 'frank@gracefanclub.net');
            $el.lang.value = 'fr';
            $el.lang.onchange($el.lang);
            window.setTimeout(function () {
              expect($el.email.checkValidity()).toBeTruthy();
              expect($el.lang.checkValidity()).toBeTruthy();
              done();
            }, 100);
          }, 100);
        });

        it('should handle password correctly', function (done) {
          fill($el.password, '');
          window.setTimeout(function () {
            expect($el.password.checkValidity()).toBeTruthy();
            expect($el.form.checkValidity()).toBeTruthy();
            fill($el.password, 'aNewPass');
            fill($el.passwordConfirm, 'aNewPass2');
            window.setTimeout(function () {
              $el.submit.click();
              window.setTimeout(function () {
                var $warn = qfirst('body > section p');
                expect($warn.textContent).toMatch('passwords do not match');
                $warn.click();
                window.setTimeout(done, 100);
              }, 100);
            }, 100);
          }, 100);
        });

        it('should update all properties', function (done) {
          fill($el.passwordConfirm, 'aNewPass');
          fill($el.firstname, 'Frank');
          fill($el.lastname, 'Lemmer');
          window.setTimeout(function () {
            $el.submit.click();
            window.setTimeout(function () {
              var $success = qfirst('body > section p');
              expect($success.textContent)
                .toMatch('Profile successfully updated');
              $success.click();
              window.setTimeout(done, 100);
            }, 200);
          }, 100);
        });

      });

      describe('admin user remove', function () {

        beforeAll(function (done) {
          qfirst('header nav a[href$="admin/users"]').click();
          window.setTimeout(function () {
            fill(qfirst('input[name=login]'), 'frank');
            window.setTimeout(function () {
              qfirst('input[type=submit]').click();
              window.setTimeout(function () {
                qfirst('body > section p').click();
                window.setTimeout(done, 100);
              }, 200);
            }, 100);
          }, 200);
        });

        it('should remove user', function (done) {
          var remove = qall('.admin-users span.actions a')[1];
          expect(remove.getAttribute('title')).toBe('Remove');
          app.window.confirm = function () { return true; };
          remove.click();
          window.setTimeout(function () {
            var $success = qfirst('body > section p');
            expect($success.textContent)
              .toMatch('Account removed with success');
            $success.click();
            window.setTimeout(done, 100);
          }, 200);
        });

      });

    });

  };

  return admin;

}).call(this);
