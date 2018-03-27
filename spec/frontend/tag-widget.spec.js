/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Tag widget functional testing
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
* ## Description
*
* From group form
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var common = require('./common.js');
  var fill = common.helper.fill;

  var tag = {};

  // Shared variables
  var $el;
  var first;

  tag.run = function (app) {

    first = function (sel) { return app.document.querySelector(sel); };

    describe('tag widget module testing', function () {

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
                tags: first('input[name=tags]'),
                ok: first('button.ok'),
                datalist: first('datalist'),
                ul: first('div.tag ul')
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

      it('should add new tags by several maners', function (done) {
        fill($el.tags, 'a tag #1');
        $el.ok.click();
        window.setTimeout(function () {
          expect($el.tags.value).toBe('');
          expect($el.ul.textContent).toBe('a tag #1');
          fill($el.tags, 'a tag #2');
          $el.ok.click();
          window.setTimeout(function () {
            expect($el.tags.value).toBe('');
            $el.liFirst = $el.ul.querySelector('li');
            expect($el.liFirst.textContent).toBe('a tag #1');
            $el.liLast = $el.ul.querySelector('li:last-child');
            expect($el.liLast.textContent).toBe('a tag #2');
            done();
          }, 200);
        }, 200);
      });

      it('should remove tags with close icons and ensure datalist coherence',
        function (done) {
          $el.liFirst.querySelector('i').click();
          window.setTimeout(function () {
            var opt = $el.datalist.querySelector('option:last-child');
            expect(opt.value).toBe('a tag #1');
            expect($el.ul.textContent).toBe('a tag #2');
            done();
          }, 200);
      }
    );

    });
  };

  return tag;
}).call(this);
