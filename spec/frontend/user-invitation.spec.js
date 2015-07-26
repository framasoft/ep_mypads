/**
*  # Group user invitation and admin sharing functional testing
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

  var invite = {};

  // Shared variables
  var qfirst;
  var qall;

  invite.run = function (app) {

    qfirst = function (sel) { return app.document.querySelector(sel); };
    qall = function (sel) { return app.document.querySelectorAll(sel); };

    describe('group user invitation and admin sharing testing', function () {

      beforeAll(function (done) {
        // Login and go to group view page of a restricted group
        app.document.querySelector('header nav a:first-child').click();
        window.setTimeout(function () {
          fill(app.document.querySelector('input[name=login]'), 'parker');
          fill(app.document.querySelector('input[name=password]'),
            'lovesKubiak');
          app.document.querySelector('input[type=submit]').click();
          window.setTimeout(function () {
            app.document.querySelectorAll('a[href$=view]')[0].click();
            window.setTimeout(function () {
              qfirst('body > section > div p').click();
              window.setTimeout(done, 100);
            }, 200);
          }, 200);
        }, 200);
      });

      afterAll(function (done) {
        app.document.querySelector('.icon-logout').parentNode.click();
        window.setTimeout(function () {
          app.document.querySelector('body > section p').click();
          done();
        }, 100);
      });

      describe('group properties', function () {

        it('should list users properties correctly', function (done) {
          var admins = qall('section.users ul li');
          window.setTimeout(function () {
            expect(admins.length).toBe(1);
            expect(admins[0].textContent).toMatch('Parker');
            done();
          }, 100);
        });

      });

      describe('userlist invitation', function () {

        beforeAll(function (done) {
          qfirst('a[href$=invite]').click();
            window.setTimeout(done, 100);
        });

        afterAll(function (done) {
          app.window.history.go(-1);
          window.setTimeout(done, 100);
        });

        it('should have no userlist selected per default', function () {
          expect(qfirst('select').value).toBe('');
          expect(qall('select option').length).toBe(2);
          expect(qfirst('fieldset ul').children.length).toBe(0);
        });

        it('should allow userlist choice and adds its users on selection',
          function (done) {
            var $ulist = qfirst('select');
            $ulist.value = qfirst('select option').value;
            $ulist.onchange($ulist);
            window.setTimeout(function () {
              expect(qall('fieldset ul li').length).toBe(2);
              window.setTimeout(done, 100);
            }, 100);
          }
        );

      });

      describe('user invitation', function () {
        var $el;
        var fillElements = function () {
          return {
            ipt: qfirst('input'),
            ok: qfirst('button.ok'),
            datalist: qfirst('datalist'),
            list: qfirst('fieldset ul'),
            submit: qfirst('input[type=submit]')
          };
        };

        beforeAll(function (done) {
          qfirst('a[href$=invite]').click();
          window.setTimeout(function () {
            $el = fillElements();
            window.setTimeout(done, 100);
          });
        });

        it('should display properties correcly', function (done) {
          var title = qfirst('section h2');
          var users = $el.list.querySelectorAll('li');
          window.setTimeout(function () {
            expect(title.textContent).toBe('Group Santa Fe');
            expect($el.datalist.children.length).toBe(0);
            expect(users.length).toBe(0);
            window.setTimeout(done, 100);
          }, 100);
        });

        it('should allow entering new users by login and removing some ' +
          'of them', function (done) {
            fill($el.ipt, 'jerry');
            $el.ok.click();
            fill($el.ipt, 'frank');
            $el.ok.click();
            fill($el.ipt, 'johnny');
            $el.ok.click();
            fill($el.ipt, 'parker');
            $el.ok.click();
            window.setTimeout(function () {
              var users = $el.list.querySelectorAll('li');
              window.setTimeout(function () {
                expect(users.length).toBe(4);
                expect(users[0].textContent).toBe('jerry');
                expect(users[1].textContent).toBe('frank');
                expect(users[2].textContent).toBe('johnny');
                expect(users[3].textContent).toBe('parker');
                users[2].querySelector('i.icon-cancel').click();
                window.setTimeout(function () {
                  users = $el.list.querySelectorAll('li');
                  window.setTimeout(function () {
                    expect(users.length).toBe(3);
                    expect(users[0].textContent).toBe('jerry');
                    expect(users[1].textContent).toBe('frank');
                    expect(users[2].textContent).toBe('parker');
                    expect($el.datalist.children.length).toBe(1);
                    expect($el.datalist.children[0].value).toBe('johnny');
                    window.setTimeout(done, 100);
                  }, 100);
                }, 100);
              }, 100);
            }, 200);
          }
        );

        it('should update groups with existing users only', function (done) {
          $el.submit.click();
          window.setTimeout(function () {
            qfirst('body > section > div p').click();
            var users = qall('section.users ul')[1].querySelectorAll('li');
            window.setTimeout(function () {
              expect(users.length).toBe(1);
              expect(users[0].textContent).toMatch('frank');
              qfirst('a[href$=invite]').click();
              window.setTimeout(function () {
                $el = fillElements();
                window.setTimeout(function () {
                  users = $el.list.querySelectorAll('li');
                  window.setTimeout(function () {
                    expect(users.length).toBe(1);
                    expect(users[0].textContent).toBe('frank');
                    done();
                  }, 100);
                }, 100);
              }, 200);
            });
          }, 200);
        });

        it('should allow removing all users', function (done) {
          var submit = qfirst('input[type=submit]');
          qfirst('fieldset ul li i.icon-cancel').click();
          window.setTimeout(function () {
            submit.click();
            window.setTimeout(function () {
              qfirst('body > section > div p').click();
              var users = qfirst('section.users p');
              window.setTimeout(function () {
                expect(users.textContent).toMatch('No user');
                qfirst('a[href$=invite]').click();
                window.setTimeout(function () {
                  $el = fillElements();
                  window.setTimeout(function () {
                    expect($el.list.children.length).toBe(0);
                    done();
                  }, 100);
                }, 100);
              }, 100);
            }, 200);
          }, 100);
        });

      });

    });

  };

  return invite;

}).call(this);
