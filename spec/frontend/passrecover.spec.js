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
        qfirst('p.passlost a').click();
        window.setTimeout(function () {
          $el = {
            form: qfirst('form#passrec-form'),
            login: qfirst('input[name=login]'),
            submit: qfirst('input[type=submit]')
          };
          window.setTimeout(done, 100);
        }, 200);
      });

      afterAll(function (done) {
        qfirst('header nav a:first-child').click();
        window.setTimeout(done, 200);
      });

      it('should forbid submision whith no login fill', function () {
        $el.submit.click();
        expect($el.login.checkValidity()).toBeFalsy();
        expect($el.form.checkValidity()).toBeFalsy();
      });

      it('should return an error if inexistent login is filled',
        function (done) {
          fill($el.login, 'inexistent');
          $el.submit.click();
          window.setTimeout(function () {
            var $err = qfirst('body > section.notification div.error p');
            expect($err.innerHTML).toMatch('User not found');
            $err.click();
            window.setTimeout(done, 100);
          }, 100);
        }
      );

      it('should return an error if mail management has not been configured',
        function (done) {
          fill($el.login, 'parker');
          $el.submit.click();
          window.setTimeout(function () {
            var $err = qfirst('body > section.notification div.error p');
            expect($err.innerHTML).toMatch('Mail settings have not been');
            $err.click();
            window.setTimeout(done, 100);
          }, 100);
        }
      );
    });
  };

  return passrecover;

}).call(this);
