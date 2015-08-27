/**
*  # Group view functional testing
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

  var view = {};

  // Shared variables
  var $el;
  var first;
  var qall;

  view.run = function (app) {

    var login = function (login, password, done) {
      // Login and go to group view page
      app.document.querySelector('header nav a:first-child').click();
      window.setTimeout(function () {
        fill(app.document.querySelector('input[name=login]'), login);
        fill(app.document.querySelector('input[name=password]'), password);
        app.document.querySelector('input[type=submit]').click();
        window.setTimeout(function () {
          app.document.querySelectorAll('a[href$=view]')[2].click();
          window.setTimeout(function () {
            $el = {
              group: first('dl.group'),
              groupQuit: first('button.cancel'),
              padAdd: first('section.pad a'),
              pads: first('section.pad ul'),
              users: first('section.users ul')
            };
            first('body > section > div p').click();
            window.setTimeout(done, 100);
          }, 200);
        }, 200);
      }, 200);
    };

    var logout = function (done) {
      app.document.querySelector('.icon-logout').parentNode.click();
      window.setTimeout(function () {
        app.document.querySelector('body > section p').click();
        done();
      }, 100);
    };

    first = function (sel) { return app.document.querySelector(sel); };
    qall = function (sel) { return app.document.querySelectorAll(sel); };

    describe('group view module testing', function () {

      beforeAll(login.bind(null, 'parker', 'lovesKubiak'));
      afterAll(logout);

      describe('group properties', function () {

        it('should have correct properties', function () {
          var defs = $el.group.querySelectorAll('dt');
          var values = $el.group.querySelectorAll('dd');
          expect(defs[0].textContent).toBe('Pads');
          expect(values[0].textContent).toBe('4');
          expect(defs[1].textContent).toBe('Admins');
          expect(values[1].textContent).toBe('1');
          expect(defs[2].textContent).toBe('Users');
          expect(values[2].textContent).toBe('0');
          expect(defs[3].textContent).toBe('Visibility');
          expect(values[3].textContent).toBe('Public');
          expect(defs[4].textContent).toBe('Readonly');
          expect(values[4].textContent).toBe('no');
          expect(defs[5].textContent).toBe('Tags');
          expect(values[5].textContent).toBe('cool, funky');
        });

      });

      describe('group public guest navigation', function () {
        var url;

        beforeAll(function (done) {
          url = app.window.location.href;
          logout(done);
        });
        afterAll(login.bind(null, 'parker', 'lovesKubiak'));

        it('should allow access to this public group without login',
          function (done) {
            app.window.location.href = url;
            window.setTimeout(function () {
              app.document.querySelector('ul.lang li').click();
              window.setTimeout(function () {
                $el = {
                  group: first('dl.group'),
                  pads: first('section.pad ul'),
                  users: first('section.users p')
                };
                var defs = $el.group.querySelectorAll('dt');
                var values = $el.group.querySelectorAll('dd');
                expect(defs[0].textContent).toBe('Pads');
                expect(values[0].textContent).toBe('4');
                expect(defs[1].textContent).toBe('Admins');
                expect(values[1].textContent).toBe('1');
                expect(defs[2].textContent).toBe('Users');
                expect(values[2].textContent).toBe('0');
                expect(defs[3].textContent).toBe('Visibility');
                expect(values[3].textContent).toBe('Public');
                expect(defs[4].textContent).toBe('Readonly');
                expect(values[4].textContent).toBe('no');
                expect(defs[5].textContent).toBe('Tags');
                expect(values[5].textContent).toBe('cool, funky');
                expect($el.users.textContent).toMatch('you are not allowed');
                done();
              }, 100);
            }, 400);
          }
        );

      });

      describe('group admins and users', function () {

        it('should display expected values', function () {
          var admins = $el.users.querySelectorAll('li');
          expect(admins.length).toBe(1);
          expect(admins[0].textContent).toMatch(/Parker/);
          expect(admins[0].textContent).toMatch(/@lewis.me/);
        });

      });

      describe('group pad management', function () {

        it('should display expected values', function () {
          var pads = $el.pads.querySelectorAll('li span.name');
          expect(pads.length).toBe(4);
          expect(pads[0].textContent).toBe('Loving Annie');
          expect(pads[1].textContent).toBe('Watch sync');
          expect(pads[2].textContent).toBe('Another one');
          expect(pads[3].textContent).toBe('Enhanced one');
        });

        it('should allow pad sorting by creation and name', function (done) {
          var padSortBtns = qall('section.pad p.sort button');
          var creationSort = padSortBtns[0];
          var nameSort = padSortBtns[1];
          window.setTimeout(function () {
            var names = qall('section.pads ul li span.name');
            expect(names[0].textContent).toBe('Loving Annie');
            expect(names[1].textContent).toBe('Watch sync');
            expect(names[2].textContent).toBe('Another one');
            expect(names[3].textContent).toBe('Enhanced one');
            creationSort.click();
            window.setTimeout(function () {
              names = qall('section.pads ul li span.name');
              expect(names[0].textContent).toBe('Enhanced one');
              expect(names[1].textContent).toBe('Another one');
              expect(names[2].textContent).toBe('Watch sync');
              expect(names[3].textContent).toBe('Loving Annie');
              nameSort.click();
              window.setTimeout(function () {
                names = qall('section.pads ul li span.name');
                expect(names[0].textContent).toBe('Watch sync');
                expect(names[1].textContent).toBe('Loving Annie');
                expect(names[2].textContent).toBe('Enhanced one');
                expect(names[3].textContent).toBe('Another one');
                nameSort.click();
                window.setTimeout(function () {
                  names = qall('section.pads ul li span.name');
                  expect(names[0].textContent).toBe('Another one');
                  expect(names[1].textContent).toBe('Enhanced one');
                  expect(names[2].textContent).toBe('Loving Annie');
                  expect(names[3].textContent).toBe('Watch sync');
                  creationSort.click();
                  window.setTimeout(done, 100);
                }, 100);
              }, 100);
            }, 100);
          }, 100);
        });

        it('should propose pad sharing', function (done) {
          var link;
          app.window.prompt = function (title, val) { link = val; };
          var padShare = app.document
            .querySelectorAll('button[title=Share]');
          padShare[1].click();
          window.setTimeout(function () {
            expect(link).toMatch('/pad/view/loving-annie-[a-z0-9]+$');
            done();
          }, 100);
        });

        it('should allow pad removal', function (done) {
          app.window.confirm = function () { return false; };
          var padRemove = app.document
            .querySelectorAll('a[href*=\'/pad/remove\']');
          padRemove[3].click();
          window.setTimeout(function () {
            var pads = app.document
              .querySelectorAll('section.pad ul li span.name');
            expect(pads.length).toBe(4);
            expect(pads[3].textContent).toBe('Enhanced one');
            app.window.confirm = function () { return true; };
            padRemove = app.document
              .querySelectorAll('a[href*=\'/pad/remove\']');
            padRemove[3].click();
            window.setTimeout(function () {
              pads = app.document
                .querySelectorAll('section.pad ul li span.name');
              expect(pads.length).toBe(3);
              var groupVals = app.document.querySelectorAll('dl.group dd');
              expect(groupVals[0].textContent).toBe('3');
              first('body > section > div p').click();
              window.setTimeout(done, 100);
            }, 100);
          }, 100);
        });

        it('should allow pad marking', function (done) {
          var padMark = first('button[title$=mark]');
          expect(padMark.getAttribute('title')).toBe('Bookmark');
          expect(padMark.querySelector('i').className).toBe('icon-star-empty');
          padMark.click();
          window.setTimeout(function () {
            first('body > section > div p').click();
            padMark = first('button[title$=mark]');
            expect(padMark.getAttribute('title')).toBe('Unmark');
            expect(padMark.querySelector('i').className).toBe('icon-star');
            padMark.click();
            window.setTimeout(function () {
              first('body > section > div p').click();
              padMark = first('button[title$=mark]');
              expect(padMark.getAttribute('title')).toBe('Bookmark');
              expect(padMark.querySelector('i').className)
                .toBe('icon-star-empty');
              window.setTimeout(done, 100);
            }, 100);
          }, 100);
        });

      });

      describe('group sharing', function () {

        it('should allow to share public group MyPads URL', function () {
          var $share = first('section.group h2 button[title=Share]');
          var link;
          app.window.prompt = function (title, val) { link = val; };
          $share.click();
          expect(link).toBeDefined();
          expect(link).toMatch('mypads/group/');
          expect(link).toMatch(/\/view$/);
        });

      });

      describe('group leaving', function () {

        beforeAll(function (done) {
          app.document.querySelector('a[href$=mypads]').click();
          window.setTimeout(function () {
            app.document.querySelectorAll('a[href$=view]')[4].click();
            window.setTimeout(function () {
              $el = { groupQuit: first('button.cancel') };
              window.setTimeout(done, 100);
            }, 200);
          }, 100);
        });

        it('should allow pad quitting', function (done) {
          app.window.confirm = function () { return true; };
          $el.groupQuit.click();
          window.setTimeout(function () {
            app.document.querySelector('body > section p').click();
            var g = app.document.querySelectorAll('ul.group > li');
            expect(g.length).toBe(2);
            done();
          }, 200);
        });

      });

    });

  };

  return view;

}).call(this);
