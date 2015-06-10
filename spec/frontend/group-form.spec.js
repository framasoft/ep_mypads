/**
*  # Group form functional testing
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

  var form = {};

  // Shared variables
  var $el;
  var first;

  form.run = function (app) {

    first = function (sel) { return app.document.querySelector(sel); };

    describe('group form module testing', function () {

      beforeAll(function (done) {
        // Login and go to form add page
        app.document.querySelector('header nav a:first-child').click();
        window.setTimeout(function () {
          fill(app.document.querySelector('input[name=login]'), 'parker');
          fill(app.document.querySelector('input[name=password]'),
            'lovesKubiak');
          app.document.querySelector('input[type=submit]').click();
          window.setTimeout(function () {
            app.document.querySelector('a[href$=\'mypads/group/add\']').click();
            window.setTimeout(function () {
              $el = { 
                form: first('form'),
                name: first('input[name=name]'),
                visibility: first('select[name=visibility]'),
                readonly: first('input[name=readonly]'),
                submit: first('input[type=submit]')
              };
              first('body > section > div p').click();
              window.setTimeout(done, 100);
            }, 200);
          }, 200);
        }, 200);
      });

      afterAll(function (done) {
        first('.icon-logout').parentNode.click();
        window.setTimeout(function () {
          first('body > section p').click();
          done();
        }, 100);
      });

      describe('group creation', function () {

        it('should forbid creation of a group with no fill', function (done) {
          $el.submit.click();
          expect($el.form.checkValidity()).toBeFalsy();
          expect($el.name.checkValidity()).toBeFalsy();
          expect($el.visibility.checkValidity()).toBeTruthy();
          expect($el.visibility.value).toBe('restricted');
          expect($el.readonly.checkValidity()).toBeTruthy();
          done();
        });

        it('should forbid creation of a private group with no password',
          function (done) {
            fill($el.name, 'High School Memories');
            $el.visibility.value = 'private';
            $el.visibility.onchange($el.visibility);
            window.setTimeout(function () {
              expect($el.name.checkValidity()).toBeTruthy();
              expect($el.visibility.value).toBe('private');
              $el.password = first('input[type=password]');
              $el.password.value = '';
              $el.submit.click();
              expect($el.form.checkValidity()).toBeFalsy();
              expect($el.password.checkValidity()).toBeFalsy();
              done();
            }, 100);
          }
        );

        it('should create otherwise', function (done) {
          fill($el.password, 'WatchSyncing');
          $el.readonly.checked = false;
          $el.readonly.onchange($el.readonly);
          window.setTimeout(function () {
            $el.submit.click();
            window.setTimeout(function () {
              var $notif = first('body > section p');
              expect($notif.innerHTML)
                .toMatch('Group has been successfully created');
              $notif.click();
              window.setTimeout(done, 100);
            }, 200);
          }, 200);
        });

      });

      describe('group edition', function () {

        beforeEach(function (done) {
          app.document.querySelector('a[title=Edit]').click();
          window.setTimeout(function () {
            $el = { 
              form: first('form'),
              name: first('input[name=name]'),
              visibility: first('select[name=visibility]'),
              password: first('input[type=password]'),
              readonly: first('input[name=readonly]'),
              submit: first('input[type=submit]')
            };
            window.setTimeout(done, 200);
          }, 200);
        });

        it('should accept changes and letting password empty', function (done) {
          expect($el.name.value).toBe('High School Memories');
          expect($el.visibility.value).toBe('private');
          expect($el.readonly.checked).toBeFalsy();
          expect($el.password.value).toBe('');
          fill($el.name, 'High School Memories, again');
          window.setTimeout(function () {
            $el.submit.click();
            window.setTimeout(function () {
              var $notif = first('body > section p');
              expect($notif.innerHTML)
                .toMatch('Group has been successfully updated');
              $notif.click();
              window.setTimeout(done, 100);
            }, 200);
          }, 200);
        });

        it('should accept changes and setting a new password', function (done) {
          expect($el.name.value).toBe('High School Memories, again');
          $el.password.value = 'aNewPassWord';
          $el.submit.click();
          window.setTimeout(function () {
            var $notif = first('body > section p');
            expect($notif.innerHTML)
              .toMatch('Group has been successfully updated');
            $notif.click();
            window.setTimeout(done, 100);
          }, 200);
        });

      });

    });
  };

  return form;
}).call(this);
