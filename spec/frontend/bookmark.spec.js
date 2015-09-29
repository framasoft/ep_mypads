/**
*  # Bookmark list functional testing
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

  var bookmark = {};

  // Shared variables
  var qfirst;
  var qall;
  var $el;

  bookmark.run = function (app) {
    qfirst = function (sel) { return app.document.querySelector(sel); };
    qall = function (sel) { return app.document.querySelectorAll(sel); };

    describe('bookmark module testing', function () {

      beforeAll(function (done) {
        // Login and go to bookmarks page
        window.setTimeout(function () {
          fill(app.document.querySelector('input[name=login]'), 'parker');
          fill(app.document.querySelector('input[name=password]'),
            'lovesKubiak');
          app.document.querySelector('input[type=submit]').click();
          window.setTimeout(function () {
            qfirst('body > section > div p').click();
            window.setTimeout(function () {
              qfirst('table tr th a[title$=mark]').click();
              window.setTimeout(function () {
                qfirst('body > section > div p').click();
                window.setTimeout(function () {
                  qall('table tr th a[href$=view]')[1].click();
                  window.setTimeout(function () {
                    qfirst('section.pads button[title$=mark]').click();
                    window.setTimeout(function () {
                      qfirst('body > section > div p').click();
                      window.setTimeout(function () {
                        qfirst('a[href$=mybookmarks]').click();
                        window.setTimeout(function () {
                          $el = {
                            groups: qall('.panel-primary div.panel-body ul li'),
                            pads: qall('.panel-info div.panel-body ul li')
                          };
                          done();
                        }, 100);
                      }, 100);
                    }, 100);
                  }, 100);
                }, 100);
              }, 100);
            }, 100);
          }, 200);
        }, 200);
      });

      afterAll(function (done) {
        qfirst('body > section p').click();
        window.setTimeout(function () {
          qfirst('.glyphicon-off').parentNode.click();
          window.setTimeout(function () {
            qfirst('body > section p').click();
            done();
          }, 100);
        }, 100);
      });

      it('should have elements as expected', function () {
        expect($el.groups.length).toBe(1);
        expect($el.groups[0].textContent).toBe('Santa Fe');
        expect($el.pads.length).toBe(1);
        expect($el.pads[0].textContent).toBe('Loving Annie');
      });

      it('should allow unmarking', function (done) {
        $el.groups[0].querySelector('button').click();
        $el.pads[0].querySelector('button').click();
        window.setTimeout(function () {
          qfirst('body > section > div p').click();
          var groups = qfirst('.panel-primary p');
          var pads = qfirst('.panel-info p');
          expect(groups.textContent).toMatch('No group');
          expect(pads.textContent).toMatch('No pad');
          done();
        }, 200);
      });
    });
  };

  return bookmark;

}).call(this);
