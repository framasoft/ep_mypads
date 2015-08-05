/**
*  # Pad form functional testing
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

  form.run = function (app) {
    // Shared variables
    var $el;
    var populate = function () {
      return {
        form: qfirst('form#pad-form'),
        submit: qfirst('input.send[type=submit]'),
        name: qfirst('input[name=name]'),
        groupParams: qfirst('input[name=groupParams]')
      };
    };
    var qfirst = function (sel) { return app.document.querySelector(sel); };
    var qall = function (sel) { return app.document.querySelectorAll(sel); };

    describe('pad form module testing', function () {

      beforeAll(function (done) {
        // Login and go to pad creation page
        app.document.querySelector('header nav a:first-child').click();
        window.setTimeout(function () {
          fill(qfirst('input[name=login]'), 'parker');
          fill(qfirst('input[name=password]'), 'lovesKubiak');
          qfirst('input[type=submit]').click();
          window.setTimeout(function () {
            qall('a[href$=view]')[2].click();
            window.setTimeout(function () {
              qfirst('section.pad a[href$=add]').click();
              window.setTimeout(function () {
                $el = populate();
                qfirst('body > section > div p').click();
                window.setTimeout(done, 100);
              }, 200);
            }, 200);
          }, 200);
        }, 200);
      });

      afterAll(function (done) {
        qfirst('.icon-logout').parentNode.click();
        window.setTimeout(function () {
          qfirst('body > section p').click();
          done();
        }, 100);
      });

      describe('pad creation', function () {

        it('should display properties as expected', function () {
          expect($el.name.value.length).toBe(0);
          expect($el.name.checkValidity()).toBeFalsy();
          expect($el.form.checkValidity()).toBeFalsy();
          expect($el.groupParams.checked).toBeTruthy();
        });

        it('should allow simple creation otherwise', function (done) {
          fill($el.name, 'Another one');
          expect($el.name.checkValidity()).toBeTruthy();
          expect($el.form.checkValidity()).toBeTruthy();
          $el.submit.click();
          window.setTimeout(function () {
            expect(qfirst('dl.group dd').textContent).toBe('3');
            expect(qall('section.pad ul li span.name')[2].textContent)
              .toBe('Another one');
            var $success = qfirst('body > section p');
            expect($success.parentNode.className).toMatch('success');
            $success.click();
            window.setTimeout(done, 100);
          }, 100);
        });

        it('should allow more complex creation', function (done) {
          qfirst('section.pad a[href$=add]').click();
          window.setTimeout(function () {
            $el = populate();
            $el.groupParams.checked = false;
            $el.groupParams.onchange($el.groupParams);
            window.setTimeout(function () {
              $el.visibility = qfirst('select[name=visibility]');
              $el.options = qall('select[name=visibility] option');
              $el.readonly = qfirst('input[name=readonly]');
              expect($el.visibility.value.length).toBe(0);
              expect($el.options.length).toBe(3);
              expect($el.readonly.checked).toBeFalsy();
              $el.visibility.value = 'private';
              $el.visibility.onchange($el.visibility);
              window.setTimeout(function () {
                $el.password = qfirst('input[type=password]');
                fill($el.name, 'A private one');
                fill($el.password, 'pass');
                window.setTimeout(function () {
                  $el.submit.click();
                  window.setTimeout(function () {
                    expect(qfirst('dl.group dd').textContent).toBe('4');
                    expect(qall('section.pad ul li span.name')[3].textContent)
                      .toBe('A private one (private)');
                    var $success = qfirst('body > section p');
                    expect($success.parentNode.className).toMatch('success');
                    $success.click();
                    window.setTimeout(done, 100);
                  }, 100);
                }, 100);
              }, 100);
            }, 100);
          }, 200);
        });

      });

      describe('pad edition', function () {

        beforeAll(function (done) {
          // Go to last pad edit
          qall('section.pad ul li span.actions a[title=Edit]')[3].click();
          window.setTimeout(function () {
            $el = populate();
            window.setTimeout(done, 100);
          }, 200);
        });

        it('should allow edition of existing pad', function (done) {
          expect($el.name.value).toBe('A private one');
          expect($el.groupParams.checked).toBeFalsy();
          fill($el.name, 'Enhanced one');
          $el.groupParams.checked = true;
          $el.groupParams.onchange($el.groupParams);
          window.setTimeout(function () {
            $el.submit.click();
            window.setTimeout(function () {
              expect(qfirst('dl.group dd').textContent).toBe('4');
              expect(qall('section.pad ul li span.name')[3].textContent)
              .toBe('Enhanced one');
              var $success = qfirst('body > section p');
              expect($success.parentNode.className).toMatch('success');
              $success.click();
              window.setTimeout(done, 100);
            }, 200);
          }, 100);
        });
      });
    });
  };

  return form;
}).call(this);
