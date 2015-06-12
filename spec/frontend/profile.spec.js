/**
*  # Profile functional testing
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

  var profile = {};

  // Shared variables
  var first;
  var $el;
  var hash;

  profile.run = function (app) {

    describe('profile module testing', function () {

      beforeAll(function (done) {
        // Go to login page
        app.document.querySelector('header nav a:first-child').click();
        window.setTimeout(function () {
          fill(app.document.querySelector('input[name=login]'), 'parker');
          fill(app.document.querySelector('input[name=password]'),
            'lovesKubiak');
          app.document.querySelector('input[type=submit]').click();
          window.setTimeout(function () {
            common.user.beforeAll(app, 'a[href$=myprofile]',
              function (res) {
                $el = res.$el; first = res.first; hash = res.hash;
                ld.assign(
                  $el,
                  { passwordCurrent: first('input[name=passwordCurrent]') }
                );
                app.document.querySelector('body > section p').click();
                done();
              }
            );
          }, 200);
        }, 200);
      });

      it('should displays login name into the page title', function () {
        expect(first('section.user h2').textContent).toMatch('parker');
      });

      it('should forbid profile update with empty current password',
        function (done) {
          $el.submit.click();
          expect($el.email.checkValidity()).toBeTruthy();
          expect($el.form.checkValidity()).toBeFalsy();
          expect($el.passwordCurrent.checkValidity()).toBeFalsy();
          done();
        }
      );

      it('should return an error if password is bad', function (done) {
        fill($el.passwordCurrent, 'badPassW0rd');
        expect($el.form.checkValidity()).toBeTruthy();
        $el.submit.click();
        window.setTimeout(function () {
          var $err = first('body > section p');
          expect($err.innerHTML).toMatch('password is not correct');
          $err.click();
          done();
        }, 100);
      });

      it('should accept updates otherwise, for password only if two new match',
        function (done) {
          fill($el.passwordCurrent, 'lovesKubiak');
          fill($el.password, 'lovesKubiaka');
          fill($el.passwordConfirm, 'badOne!!!!');
          fill($el.organization, 'Santo Domingo High');
          expect($el.form.checkValidity()).toBeTruthy();
          $el.submit.click();
          window.setTimeout(function () {
            expect($el.organization.value).toBe('Santo Domingo High');
            var $notif = first('body > section p');
            expect($notif.innerHTML).toMatch('Profile successfully updated');
            $notif.click();
            first('a[href$=logout]').click();
            window.setTimeout(function () {
              first('body > section p').click();
              done();
            }, 100);
          }, 200);
        }
      );

    });

  };

  return profile;
}).call(this);
