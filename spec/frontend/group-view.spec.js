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

  view.run = function (app) {

    first = function (sel) { return app.document.querySelector(sel); };

    describe('group view module testing', function () {

      beforeAll(function (done) {
        // Login and go to group view page
        app.document.querySelector('header nav a:first-child').click();
        window.setTimeout(function () {
          fill(app.document.querySelector('input[name=login]'), 'parker');
          fill(app.document.querySelector('input[name=password]'),
            'lovesKubiak');
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
      });

      afterAll(function (done) {
        app.document.querySelector('.icon-logout').parentNode.click();
        window.setTimeout(function () {
          app.document.querySelector('body > section p').click();
          done();
        }, 100);
      });

      describe('group properties', function () {

        it('should have correct properties', function () {
          var defs = $el.group.querySelectorAll('dt');
          var values = $el.group.querySelectorAll('dd');
          expect(defs[0].textContent).toBe('Pads');
          expect(values[0].textContent).toBe('2');
          expect(defs[1].textContent).toBe('Admins');
          expect(values[1].textContent).toBe('1');
          expect(defs[2].textContent).toBe('Users');
          expect(values[2].textContent).toBe('0');
          expect(defs[3].textContent).toBe('Visibility');
          expect(values[3].textContent).toBe('public');
          expect(defs[4].textContent).toBe('Readonly');
          expect(values[4].textContent).toBe('false');
          expect(defs[5].textContent).toBe('Tags');
          expect(values[5].textContent).toBe('cool, funky');
        });

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
          expect(pads.length).toBe(2);
          expect(pads[0].textContent).toBe('Loving Annie');
          expect(pads[1].textContent).toBe('Watch sync');
        });

        it('should allow pad creation', function (done) {
          app.window.prompt = function () { return ''; };
          $el.padAdd.click();
          window.setTimeout(function () {
            var pads = $el.pads.querySelectorAll('li span.name');
            expect(pads.length).toBe(2);
            app.window.prompt = function () { return 'Another one'; };
            $el.padAdd.click();
            window.setTimeout(function () {
              var groupVals = app.document.querySelectorAll('dl.group dd');
              expect(groupVals[0].textContent).toBe('3');
              pads = app.document
                .querySelectorAll('section.pad ul li span.name');
              expect(pads.length).toBe(3);
              expect(pads[2].textContent).toBe('Another one');
              first('body > section > div p').click();
              window.setTimeout(done, 100);
            }, 200);
          }, 100);
        });

        it('should allow pad name update', function (done) {
          app.window.prompt = function () { return ''; };
          var padEdit = app.document.querySelectorAll('a[href*=\'/pad/edit\']');
          padEdit[2].click();
          window.setTimeout(function () {
            var pads = app.document
              .querySelectorAll('section.pad ul li span.name');
            expect(pads[2].textContent).toBe('Another one');
            app.window.prompt = function () { return 'Enhanced one'; };
            padEdit = app.document.querySelectorAll('a[href*=\'/pad/edit\']');
            padEdit[2].click();
            window.setTimeout(function () {
              pads = app.document
                .querySelectorAll('section.pad ul li span.name');
              expect(pads[2].textContent).toBe('Enhanced one');
              first('body > section > div p').click();
              window.setTimeout(done, 100);
            }, 100);
          }, 100);
        });

        it('should propose pad sharing', function (done) {
          var link;
          app.window.prompt = function (title, val) { link = val; };
          var padShare = app.document
            .querySelectorAll('button[title=Share]');
          padShare[2].click();
          window.setTimeout(function () {
            expect(link).toMatch('/p/[a-z0-9]+$');
            done();
          }, 100);
        });

        it('should allow pad removal', function (done) {
          app.window.confirm = function () { return false; };
          var padRemove = app.document
            .querySelectorAll('a[href*=\'/pad/remove\']');
          padRemove[2].click();
          window.setTimeout(function () {
            var pads = app.document
              .querySelectorAll('section.pad ul li span.name');
            expect(pads.length).toBe(3);
            expect(pads[2].textContent).toBe('Enhanced one');
            app.window.confirm = function () { return true; };
            padRemove = app.document
              .querySelectorAll('a[href*=\'/pad/remove\']');
            padRemove[2].click();
            window.setTimeout(function () {
              pads = app.document
                .querySelectorAll('section.pad ul li span.name');
              expect(pads.length).toBe(2);
              var groupVals = app.document.querySelectorAll('dl.group dd');
              expect(groupVals[0].textContent).toBe('2');
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
