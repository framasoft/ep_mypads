/**
*  # Password recovery functional testing
*
*  ## License
*
*x  Licensed to the Apache Software Foundation (ASF) under one
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

  var passrecover = {};

  passrecover.run = function (app) {
    // Shared variables
    var $el;
    var qfirst = function (sel) { return app.document.querySelector(sel); };

    describe('password recovery module testing', function () {

      beforeAll(function (done) {
        qfirst('ul.lang li:first-child').click();
        // Go to password recovery
        qfirst('a[href$=passrecover]').click();
        window.setTimeout(function () {
          $el = {
            form: qfirst('form#passrec-form'),
            email: qfirst('input[name=email]'),
            submit: qfirst('input[type=submit]')
          };
          window.setTimeout(done, 100);
        }, 200);
      });

      afterAll(function (done) {
        qfirst('header nav a:first-child').click();
        window.setTimeout(done, 200);
      });

      describe('password recovery from email', function () {

        it('should forbid submision whith no email fill', function () {
          $el.submit.click();
          expect($el.email.checkValidity()).toBeFalsy();
          expect($el.form.checkValidity()).toBeFalsy();
        });

        it('should return an error if inexistent email is filled',
          function (done) {
            fill($el.email, 'inexistent@example.org');
            $el.submit.click();
            window.setTimeout(function () {
              var $err = qfirst('section.notification div.alert-danger p');
              expect($err.innerHTML).toMatch('User not found');
              $err.click();
              window.setTimeout(done, 100);
            }, 100);
          }
        );

        it('should return an error if mail management has not been configured',
          function (done) {
            fill($el.email, 'parker@lewis.me');
            $el.submit.click();
            window.setTimeout(function () {
              var $err = qfirst('section.notification div.alert-danger p');
              expect($err.innerHTML).toMatch('Root Url setting has not');
              $err.click();
              window.setTimeout(done, 100);
            }, 100);
          }
        );
      });

      describe('password change', function () {

        beforeAll(function (done) {
          app.window.location.search = '?/passrecover/invalidtoken';
          window.setTimeout(function () {
            qfirst('ul.lang li:first-child').click();
            $el = {
              password: qfirst('input[name=password]'),
              passwordConfirm: qfirst('input[name=passwordConfirm]'),
              submit: qfirst('input[type=submit]')
            };
            window.setTimeout(done, 100);
          }, 400);
        });

        it('should return an error if the token is invalid', function (done) {
            fill($el.password, 'aGoodSizePassword');
            fill($el.passwordConfirm, 'aGoodSizePassword');
            $el.submit.click();
            window.setTimeout(function () {
              var $err = qfirst('section.notification div.alert-danger p');
              expect($err.innerHTML).toMatch('Used token contains incorrect');
              $err.click();
              window.setTimeout(done, 100);
            }, 200);
        });
      });

    });
  };

  return passrecover;

}).call(this);
