/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/

(function () {
  'use strict';

  var ld = require('lodash');
  var specCommon = require('./common.js');
  var conf = require('../../configuration.js');

  describe('configuration', function () {
    beforeAll(specCommon.reInitDatabase);
    afterAll(specCommon.reInitDatabase);

    describe('init', function () {

      it('takes an optional callback as argument that must be a function',
        function () {
          expect(ld.partial(conf.init, 'string')).toThrow();
          expect(conf.init).not.toThrow();
        }
      );

      it('will call the callback, with an error or null when succeeded',
        function () {
          conf.init(function (err) {
            expect(err).toBeNull();
            var res = conf.get('passwordMax');
            expect(res).toBe(30);
          });
        }
      );

      it('will set the authMethod to \'ldap\' because of Etherpad\'s settings.json (ep_mypads.ldap)',
        function () {
          var res = conf.get('authMethod');
          expect(res).toBe('ldap');
        }
      );

      it('will fetch and set authLdapSettings from Etherpad\'s settings.json (ep_mypads.ldap)',
        function (done) {
          var res = conf.get('authLdapSettings');
          expect(res).toEqual({
            url:             'ldap://rroemhild-test-openldap',
            bindDN:          'cn=admin,dc=planetexpress,dc=com',
            bindCredentials: 'GoodNewsEveryone',
            searchBase:      'ou=people,dc=planetexpress,dc=com',
            searchFilter:    '(uid={{username}})',
            properties: {
              login:     'uid',
              email:     'mail',
              firstname: 'givenName',
              lastname:  'sn'
            },
            defaultLang: 'fr'
          });
          done();
        }
      );
    });

    describe('get', function () {

      it('throws an error if key isn\'t a string', function () {
        expect(conf.get).toThrow();
        expect(ld.partial(conf.get, 1)).toThrow();
      });

      it('returns undefined if the field isn\'t defined', function () {
        var res = conf.get('inexistent');
        expect(res).toBeUndefined();
      });

      it('returns the value of the field otherwise', function () {
        var res = conf.get('passwordMin');
        expect(res).toBe(8);
      });
    });

    describe('set', function () {

      it('throws an error if key isn\'t a string, value is undefined, ' +
        'callback is not a function', function (done) {
          expect(conf.set).toThrow();
          expect(ld.partial(conf.set, 'key')).toThrow();
          expect(ld.partial(conf.set, 'key', 'value')).toThrow();
          expect(ld.partial(conf.set, 12, ld.noop)).toThrow();
          expect(ld.partial(conf.set, [], 12, ld.noop)).toThrow();
          expect(ld.partial(conf.set, 'key', 'notAFn')).toThrow();
          done();
      });

      it('sets a key for the conf with the given value', function (done) {
        conf.set('key', 'value', function () {
          var val = conf.get('key');
          expect(val).toBe('value');
          conf.set('@rray', [1, 2, 3], function () {
            val = conf.get('@rray');
            expect(val.length).toBe(3);
            done();
          });
        });
      });
    });

    describe('del', function () {

      it('throws an error if key isn\'t a string and callback not a function',
        function () {
          expect(conf.del).toThrow();
          expect(ld.partial(conf.del, 1)).toThrow();
          expect(ld.partial(conf.del, 1, 1)).toThrow();
          expect(ld.partial(conf.del, 1, ld.noop)).toThrow();
          expect(ld.partial(conf.del, 'key')).toThrow();
          expect(ld.partial(conf.del, 'key', 2)).toThrow();
      });

      it('removes the item otherwise', function (done) {
        conf.set('forremove', 10, function () {
          var res = conf.get('forremove');
          expect(res).toBe(10);
          conf.del('forremove', function (err) {
            expect(err).toBeUndefined();
            res = conf.get('forremove');
            expect(res).toBeUndefined();
            done();
          });
        });
      });
    });

    describe('all', function () {

      it('returns the configuration object', function (done) {
        conf.set('key', 10, function () {
          conf.set('power', 'max', function () {
            var settings = conf.all();
            expect(settings.key).toBe(10);
            expect(settings.power).toBe('max');
            done();
          });
        });
      });
    });

    describe('public', function () {

      it('returns the filtered configuration object', function (done) {
        conf.set('power', 'max', function () {
          var settings = conf.public();
          expect(settings.power).toBeUndefined();
          expect(settings.title).toBeDefined();
          expect(settings.passwordMin).toBeDefined();
          expect(settings.passwordMax).toBeDefined();
          expect(settings.languages).toBeDefined();
          expect(settings.HTMLExtraHead).toBeDefined();
          expect(settings.openRegistration).toBeDefined();
          expect(settings.hideHelpBlocks).toBeDefined();
          expect(settings.useFirstLastNameInPads).toBeDefined();
          done();
        });
      });
    });
  });

}).call(this);
