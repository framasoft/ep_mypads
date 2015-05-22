/**
*  # Group removal functional testing
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

  var remove = {};

  remove.run = function (app) {

    describe('group remove module testing', function () {

      var $li;
      var removeAction;

      beforeAll(function (done) {
        // Login
        app.document.querySelector('header > nav a:first-child').click();
        window.setTimeout(function () {
          fill(app.document.querySelector('input[name=login]'), 'parker');
          fill(app.document.querySelector('input[name=password]'),
            'lovesKubiak');
          app.document.querySelector('input[type=submit]').click();
          window.setTimeout(function () {
            app.document.querySelector('body > section p').click();
            done();
          }, 200);
        }, 100);
      });

      afterAll(function (done) {
        app.document.querySelector('.icon-logout').parentNode.click();
        window.setTimeout(function () {
          app.document.querySelector('body > section p').click();
          done();
        }, 100);
      });

      beforeEach(function (done) {
        $li = app.document.querySelector('h3.group').parentNode;
        $li = $li.querySelector('ul li');
        removeAction = $li.querySelector('a[title=Remove]');
        window.setTimeout(done, 100);
      });

      it('should not remove if not confirmed', function (done) {
        app.window.confirm = function () { return false; };
        removeAction.click();
        window.setTimeout(function () {
          expect($li).toBeDefined();
          expect($li.querySelector('h4').textContent)
            .toBe('High School Memories, again');
          done();
        }, 100);
      });

      it('should remove if confirmed', function (done) {
        app.window.confirm = function () { return true; };
        removeAction.click();
        window.setTimeout(function () {
          $li = app.document.querySelector('h3.group').parentNode;
          $li = $li.querySelector('ul li');
          expect($li.querySelector('h4').textContent).toBe('Santa Fe');
          var $n = app.document.querySelector('body > section p');
          expect($n.innerHTML).toMatch('Group has been successfully removed');
          $n.click();
          done();
        }, 100);
      });

    });

  };

  return remove;
}).call(this);
