/**
*  # Userlists list, form and remove functional testing
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

  var list = {};

  list.run = function (app) {
    // Shared variables
    var $el;
    var qfirst = function (sel) { return app.document.querySelector(sel); };
    var qall = function (sel) { return app.document.querySelectorAll(sel); };

    describe('userlists module testing', function () {

      describe('list', function () {

        beforeAll(function (done) {
          // Login and go to userlists list page
          app.document.querySelector('header nav a:first-child').click();
          window.setTimeout(function () {
            fill(qfirst('input[name=login]'), 'parker');
            fill(qfirst('input[name=password]'), 'lovesKubiak');
            qfirst('input[type=submit]').click();
            window.setTimeout(function () {
              qfirst('nav.menu-main a[href$=myuserlists]').click();
              window.setTimeout(function () {
                $el = qall('ul.group li');
                qfirst('body > section > div p').click();
                window.setTimeout(done, 100);
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

        it('should display properties properly', function (done) {
          $el = qall('ul.group li');
          expect($el.length).toBe(1);
          expect($el[0].querySelector('header h4').textContent).toBe('enemies');
          expect($el[0].querySelector('dl dt').textContent).toBe('Users');
          expect($el[0].querySelector('dl dd').textContent).toBe('2');
          window.setTimeout(done, 100);
        });

      });

      describe('userlists form module testing', function () {

        beforeAll(function (done) {
          // Login and go to userlists add page
          app.document.querySelector('header nav a:first-child').click();
          window.setTimeout(function () {
            fill(qfirst('input[name=login]'), 'parker');
            fill(qfirst('input[name=password]'), 'lovesKubiak');
            qfirst('input[type=submit]').click();
            window.setTimeout(function () {
              qfirst('nav.menu-main a[href$=myuserlists]').click();
              window.setTimeout(function () {
                qfirst('section.group h2 a[href$=add]').click();
                window.setTimeout(function () {
                  $el = {
                    form: qfirst('form#ulist-form'),
                    submit: qfirst('input.send[type=submit]'),
                    name: qfirst('input[name=name]'),
                    users: qfirst('input[name=users]'),
                    ok: qfirst('button.ok'),
                    ulist: qfirst('section.group-form ul')
                  };
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

        describe('userlist creation', function () {

          it('should forbid creation with no name', function () {
            $el.submit.click();
            expect($el.form.checkValidity()).toBeFalsy();
            expect($el.name.checkValidity()).toBeFalsy();
          });

          it('should create otherwise', function (done) {
            fill($el.name, 'secretlist');
            fill($el.users, 'frank');
            $el.ok.click();
            window.setTimeout(function () {
              fill($el.users, 'inexistent');
              $el.ok.click();
              window.setTimeout(function () {
                var $opts = $el.ulist.querySelectorAll('li');
                expect($opts.length).toBe(2);
                expect($opts[0].textContent).toBe('frank');
                expect($opts[1].textContent).toBe('inexistent');
                $el.submit.click();
                window.setTimeout(function () {
                  var $notif = qfirst('body > section p');
                  expect($notif.innerHTML)
                    .toMatch('Userlist has been successfully created');
                  $notif.click();
                  var $ulist = qall('section.group ul.group li')[1];
                  expect($ulist.querySelector('h4').textContent)
                    .toBe('secretlist');
                  expect($ulist.querySelector('dd').textContent).toBe('1');
                  window.setTimeout(done, 100);
                }, 200);
              }, 100);
            }, 100);
          });

        });

        describe('userlist edition', function () {

          beforeAll(function (done) {
            qall('section.group a[href$=edit]')[1].click();
            window.setTimeout(function () {
              $el = {
                form: qfirst('form#ulist-form'),
                submit: qfirst('input.send[type=submit]'),
                name: qfirst('input[name=name]'),
                users: qfirst('input[name=users]'),
                ok: qfirst('button.ok'),
                ulist: qall('section.group-form ul li')
              };
              window.setTimeout(done, 100);
            }, 200);
          });

          it('should allow renaming and user removal', function (done) {
            expect($el.name.value).toBe('secretlist');
            fill($el.name, 'secret');
            expect($el.ulist.length).toBe(1);
            expect($el.ulist[0].textContent).toBe('frank');
            $el.ulist[0].querySelector('i.icon-cancel').click();
            window.setTimeout(function () {
              $el.submit.click();
              window.setTimeout(function () {
                var $notif = qfirst('body > section p');
                expect($notif.innerHTML)
                  .toMatch('Userlist has been successfully updated');
                $notif.click();
                var $ulist = qall('section.group ul.group li')[1];
                expect($ulist.querySelector('h4').textContent).toBe('secret');
                expect($ulist.querySelector('dd').textContent).toBe('0');
                window.setTimeout(done, 100);
              }, 200);
            }, 100);
          });

        });

      });

      describe('userlists remove module testing', function () {
        beforeAll(function (done) {
          // Login and go to userlists list page
          app.document.querySelector('header nav a:first-child').click();
          window.setTimeout(function () {
            fill(qfirst('input[name=login]'), 'parker');
            fill(qfirst('input[name=password]'), 'lovesKubiak');
            qfirst('input[type=submit]').click();
            window.setTimeout(function () {
              qfirst('nav.menu-main a[href$=myuserlists]').click();
              window.setTimeout(function () {
                qfirst('body > section > div p').click();
                window.setTimeout(done, 100);
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

        it('should not remove if canceled', function (done) {
          app.window.confirm = function () { return false; };
          var $ulists = qall('section.group ul.group li');
          expect($ulists.length).toBe(2);
          $ulists[0].querySelector('a[href$=remove]').click();
          window.setTimeout(function () {
            $ulists = qall('section.group ul.group li');
            expect($ulists.length).toBe(2);
            done();
          }, 100);
        });

        it('should remove otherwise', function (done) {
          app.window.confirm = function () { return true; };
          var $ulists = qall('section.group ul.group li');
          expect($ulists.length).toBe(2);
          $ulists[1].querySelector('a[href$=remove]').click();
          window.setTimeout(function () {
            var $n = qfirst('body > section p');
            expect($n.innerHTML)
              .toMatch('Userlist has been successfully removed');
            $n.click();
            $ulists = qall('section.group ul.group li');
            expect($ulists.length).toBe(1);
            done();
          }, 100);
        });

      });

    });
  };

  return list;

}).call(this);
