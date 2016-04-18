/**
*  # Pad view functional testing
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


  view.run = function (app) {
    // Shared variables
    var qfirst = function (sel) { return app.document.querySelector(sel); };
    var qall = function (sel) { return app.document.querySelectorAll(sel); };

    var login = function (done) {
      // Login and go to group view page
      app.document.querySelector('header nav a:first-child').click();
      window.setTimeout(function () {
        fill(app.document.querySelector('input[name=login]'), 'parker');
        fill(app.document.querySelector('input[name=password]'), 'lovesKubiak');
        app.document.querySelector('input[type=submit]').click();
        window.setTimeout(function () {
          app.document.querySelectorAll('a[href$=view]')[4].click();
          window.setTimeout(function () {
            qfirst('body > section > div p').click();
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

    describe('pad view module testing', function () {

      beforeAll(login);
      afterAll(logout);

      describe('public pad view and properties', function () {

        beforeAll(function (done) {
          qfirst('section.pad li span a').click();
          window.setTimeout(done, 200);
        });

        it('should display properties as expected', function (done) {
          var title = qfirst('section.group h2 span');
          var group = qfirst('span.subtitle');
          var iframe = qfirst('iframe');
          window.setTimeout(function () {
            expect(title.textContent).toBe('Pad Loving Annie');
            expect(group.textContent).toMatch('memories');
            expect(iframe.getAttribute('src')).not.toMatch('mypadspassword');
            done();
          }, 100);
        });

        it('should have links for several things', function (done) {
          var actions = {
            btns: qall('p.actions button'),
            links: qall('p.actions a'),
            tab: qfirst('section.pad a')
          };
          var iframe = qfirst('iframe');
          window.setTimeout(function () {
            expect(actions.btns[0].getAttribute('title')).toBe('Bookmark');
            expect(actions.btns[1].getAttribute('title')).toBe('Share');
            expect(actions.links[0].getAttribute('title'))
              .toBe('Configuration');
            expect(actions.links[0].getAttribute('href')).toMatch('/pad/edit');
            expect(actions.links[1].getAttribute('title')).toBe('Remove');
            expect(actions.links[1].getAttribute('href'))
              .toMatch('/pad/remove');
            expect(actions.tab.getAttribute('href'))
              .toBe(iframe.getAttribute('src'));
            done();
          }, 200);
        });

      });

      describe('public pad view for guest', function () {
        var url;

        beforeAll(function (done) {
          url = app.window.location.href;
          logout(done);
        });
        afterAll(login);

        it('should allow access to this public pad without login',
          function (done) {
            app.window.location.href = url;
            window.setTimeout(function () {
              app.document.querySelector('ul.lang li').click();
              window.setTimeout(function () {
                var title = qfirst('section.group h2 span');
                var group = qfirst('span.subtitle');
                expect(title.textContent).toBe('Pad Loving Annie');
                expect(group.textContent).toMatch('memories');
                done();
              }, 100);
            }, 400);
          }
        );

      });


    });

  };

  return view;

}).call(this);
