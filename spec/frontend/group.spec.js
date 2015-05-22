/**
*  # Group list functional testing
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

  var list = {};

  // Shared variables
  var $el;
  var first;
  var groupsCount;

  list.run = function (app) {
    first = function (sel) { return app.document.querySelector(sel); };
    describe('group list module testing', function () {

      beforeAll(function (done) {
        // Login and go to group list page
        app.document.querySelector('header > nav a:first-child').click();
        window.setTimeout(function () {
          fill(app.document.querySelector('input[name=login]'), 'parker');
          fill(app.document.querySelector('input[name=password]'),
            'lovesKubiak');
          app.document.querySelector('input[type=submit]').click();
          window.setTimeout(function () {
            var groups = app.document.querySelectorAll('ul.group');
            $el = {
              bookmarked: groups[0],
              common: groups[1],
              archived: groups[2],
              searchInput: first('input[type=search]'),
              filter: first('section.filter ul'),
              tagsAside: first('section.tag > ul')
            };
            $el.searchOk = $el.searchInput.parentNode.children[2];
            groupsCount = function () {
              return $el.bookmarked.children.length +
                $el.common.children.length + $el.archived.children.length; 
            };
            first('body > section > div p').click();
            window.setTimeout(done, 100);
          }, 200);
        }, 200);
      });

      afterAll(function (done) {
        $el.bookmarked.querySelector('li footer button').click();
        window.setTimeout(function () {
          first('body > section p').click();
          window.setTimeout(function () {
            first('.icon-logout').parentNode.click();
            window.setTimeout(function () {
              first('body > section p').click();
              done();
            }, 100);
          }, 100);
        }, 100);
      });

      describe('group marking', function () {

        it('should allow marking of existing unmarked groups',
          function (done) {
            expect($el.bookmarked.children.length).toBe(0);
            expect($el.archived.children.length).toBe(0);
            expect($el.common.children.length).toBe(2);
            var g = $el.common.children[0];
            var name = g.querySelector('header h4').textContent;
            var btn = g.querySelector('footer button');
            expect(btn.textContent).toBe('Bookmark');
            expect(name).toBe('Santa Fe');
            g.querySelector('footer button').click();
            window.setTimeout(function () {
              first('body > section > div p').click();
              expect($el.bookmarked.children.length).toBe(1);
              expect($el.common.children.length).toBe(1);
              g = $el.bookmarked.children[0];
              name = g.querySelector('header h4').textContent;
              expect(name).toBe('Santa Fe');
              btn = g.querySelector('footer button');
              expect(btn.textContent).toBe('Unmark');
              g = $el.common.children[0];
              name = g.querySelector('header h4').textContent;
              expect(name).toBe('memories');
              g.querySelector('footer button').click();
              window.setTimeout(function () {
                expect($el.bookmarked.children.length).toBe(2);
                expect($el.common.children.length).toBe(0);
                first('body > section > div p').click();
                window.setTimeout(done, 100); 
              }, 200);
            }, 200);
          }
        );

        it('should allow unmarking of marked groups', function (done) {
          expect($el.bookmarked.children.length).toBe(2);
          expect($el.common.children.length).toBe(0);
          var g = $el.bookmarked.children[1];
          var name = g.querySelector('header h4').textContent;
          expect(name).toBe('memories');
          g.querySelector('footer button').click();
          window.setTimeout(function () {
            expect($el.bookmarked.children.length).toBe(1);
            expect($el.common.children.length).toBe(1);
            first('body > section > div p').click();
            window.setTimeout(done, 100); 
          }, 200);
        });

      });

      describe('group tag filtering', function () {
        var g;
        var tags;
        var btnActive;

        it('should filter by clicked tag all groups', function (done) {
          expect(groupsCount()).toBe(2);
          g = $el.bookmarked.children[0];
          tags = g.querySelector('footer ul').children;
          var cool = tags[0];
          var weird = tags[1];
          expect(cool.textContent).toBe('cool');
          expect(weird.textContent).toBe('weird');
          expect(cool.className).toBe('');
          expect(weird.className).toBe('');
          weird.click();
          window.setTimeout(function () {
            expect(cool.className).toBe('');
            expect(weird.className).toBe('active');
            expect(groupsCount()).toBe(1);
            btnActive = $el.tagsAside.querySelector('li button.active');
            expect(btnActive.textContent).toBe('weird');
            window.setTimeout(done, 100);
          }, 200);
        });

        it('should toggle off current filtering', function (done) {
          expect(groupsCount()).toBe(1);
          var weird = tags[1];
          expect(weird.className).toBe('active');
          weird.click();
          window.setTimeout(function () {
            expect(weird.className).toBe('');
            expect(groupsCount()).toBe(2);
            expect(btnActive.className).toBe('');
            window.setTimeout(done, 100);
          }, 200);
        });

      });

      describe('group side filters', function () {

        describe('filter by search', function () {

          it('should forbid text search under 3 characters', function (done) {
            fill($el.searchInput, '10');
            $el.searchOk.click();
            window.setTimeout(function () {
              expect($el.searchInput.checkValidity()).toBeFalsy();
              done();
            }, 100);
          });

          it('should allow text search otherwise, here without case impact',
            function (done) {
              expect(groupsCount()).toBe(2);
              fill($el.searchInput, 'MORI');
              $el.searchOk.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(1);
                done();
              }, 200);
            }
          );

          it('should remove filter with empty search', function (done) {
            expect(groupsCount()).toBe(1);
            fill($el.searchInput, '');
            $el.searchOk.click();
            window.setTimeout(function () {
              expect(groupsCount()).toBe(2);
              done();
            }, 200);
          });

        });

        describe('filter by predefined', function () {
          var f;
          beforeAll(function (done) {
            f = $el.filter.querySelectorAll('button');
            f = {
              admin: f[0],
              user: f[1],
              restricted: f[2], 
              private: f[3], 
              public: f[4], 
            };
            window.setTimeout(done, 100);
          });

          it('should filter when admin', function (done) {
            expect(groupsCount()).toBe(2);
            expect(f.admin.className).toBe('admin');
            f.admin.click();
            window.setTimeout(function () {
              expect(groupsCount()).toBe(2);
              expect(f.admin.className).toBe('admin active');
              f.admin.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(2);
                expect(f.admin.className).toBe('admin');
                done();
              }, 200);
            }, 200);
          });

          it('should filter when user', function (done) {
            expect(groupsCount()).toBe(2);
            expect(f.user.className).toBe('user');
            f.user.click();
            window.setTimeout(function () {
              expect(groupsCount()).toBe(0);
              expect(f.user.className).toBe('user active');
              f.user.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(2);
                expect(f.user.className).toBe('user');
                done();
              }, 200);
            }, 200);
          });

          it('should filter when visibility is restricted', function (done) {
            expect(groupsCount()).toBe(2);
            expect(f.restricted.className).toBe('user');
            f.restricted.click();
            window.setTimeout(function () {
              expect(groupsCount()).toBe(1);
              expect(f.restricted.className).toBe('user active');
              f.restricted.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(2);
                expect(f.restricted.className).toBe('user');
                done();
              }, 200);
            }, 200);
          });

          it('should filter when visibility is private', function (done) {
            expect(groupsCount()).toBe(2);
            expect(f.private.className).toBe('user');
            f.private.click();
            window.setTimeout(function () {
              expect(groupsCount()).toBe(0);
              expect(f.private.className).toBe('user active');
              f.private.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(2);
                expect(f.private.className).toBe('user');
                done();
              }, 200);
            }, 200);
          });

          it('should filter when visibility is public', function (done) {
            expect(groupsCount()).toBe(2);
            expect(f.public.className).toBe('user');
            f.public.click();
            window.setTimeout(function () {
              expect(groupsCount()).toBe(1);
              expect(f.public.className).toBe('user active');
              f.public.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(2);
                expect(f.public.className).toBe('user');
                done();
              }, 200);
            }, 200);
          });

        });

        describe('filter by tags', function () {
          var t;
          beforeAll(function (done) {
            var tags = $el.tagsAside.querySelectorAll('li button');
            t = {
              cool: tags[0],
              funky: tags[1],
              weird: tags[2]
            };
            window.setTimeout(done, 100);
          });

          it('should filter with one tag', function (done) {
            expect(groupsCount()).toBe(2);
            expect(t.funky.className).toBe('');
            t.funky.click();
            window.setTimeout(function () {
              expect(groupsCount()).toBe(1);
              expect(t.funky.className).toBe('active');
              t.funky.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(2);
                expect(t.funky.className).toBe('');
                done();
              }, 200);
            }, 200);
          });

          it('should filter with multiple tags', function (done) {
            expect(groupsCount()).toBe(2);
            expect(t.cool.className).toBe('');
            expect(t.weird.className).toBe('');
            t.cool.click();
            t.weird.click();
            window.setTimeout(function () {
              expect(groupsCount()).toBe(1);
              expect(t.cool.className).toBe('active');
              expect(t.weird.className).toBe('active');
              t.cool.click();
              t.weird.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(2);
                expect(t.cool.className).toBe('');
                expect(t.weird.className).toBe('');
                done();
              }, 200);
            }, 200);
          });

        });

        describe('filters combined', function () {

          it('should filter with combined filters, here search and admin', 
            function (done) {
              expect(groupsCount()).toBe(2);
              fill($el.searchInput, 'MORI');
              $el.searchOk.click();
              var filterAdmin = $el.filter.querySelector('button');
              expect(filterAdmin.className).toBe('admin');
              filterAdmin.click();
              window.setTimeout(function () {
                expect(groupsCount()).toBe(1);
                expect(filterAdmin.className).toBe('admin active');
                fill($el.searchInput, '');
                $el.searchOk.click();
                filterAdmin.click();
                window.setTimeout(function () {
                  expect(filterAdmin.className).toBe('admin');
                  expect(groupsCount()).toBe(2);
                  done();
                }, 200);
              }, 200);
            }
          );

        });
      });
    });
  };

  return list;
}).call(this);
