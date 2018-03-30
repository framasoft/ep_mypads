/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Pad Moving functional testing
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

  var move = {};

  // Shared variables
  var $el;
  var qfirst;
  var qall;

  move.run = function (app) {

    qfirst = function (sel) { return app.document.querySelector(sel); };
    qall = function (sel) { return app.document.querySelectorAll(sel); };

    describe('group view module testing', function () {

      beforeAll(function (done) {
        // Login and go to group view page
        qfirst('header nav a:first-child').click();
        window.setTimeout(function () {
          fill(qfirst('input[name=login]'), 'parker');
          fill(qfirst('input[name=password]'),
            'lovesKubiak');
          qfirst('input[type=submit]').click();
          window.setTimeout(function () {
            qall('a[href$=view]')[4].click();
            window.setTimeout(function () {
              qfirst('a[href$="pad/move"]').click();
              window.setTimeout(function () {
                $el = {
                  form: qfirst('section.padmove form'),
                  select: qfirst('section.padmove select'),
                  submit: qfirst('section.padmove input[type=submit]')
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

      it('should require selection', function () {
        $el.submit.click();
        expect($el.form.checkValidity()).toBeFalsy();
        expect($el.select.checkValidity()).toBeFalsy();
      });

      it('should move all pads to destination', function (done) {
        $el.select.value = qall('option')[1].value;
        $el.select.onchange($el.select);
        window.setTimeout(function () {
          $el.submit.click();
          window.setTimeout(function () {
            var $notif = qfirst('body > section p');
            expect($notif.innerHTML).toMatch('successfully moved');
            $notif.click();
            window.setTimeout(done, 100);
          }, 200);
        }, 200);
      });

    });

  };

  return move;

}).call(this);
