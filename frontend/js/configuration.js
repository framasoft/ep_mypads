/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Configuration
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
*  ## Description
*
*  This module contains configuration-like for frontend.
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var auth = require('./auth.js');

  var config = {};
  config.URLS = { RAWBASE: window.location.pathname.replace(new RegExp('index.html'), '') };
  config.URLS.BASE = config.URLS.RAWBASE + 'api';
  config.URLS.CONF = config.URLS.BASE + '/configuration';
  config.URLS.AUTH = config.URLS.BASE + '/auth';
  config.URLS.LOGIN = config.URLS.AUTH + '/login';
  config.URLS.LOGOUT = config.URLS.AUTH + '/logout';
  config.URLS.CASLOGIN = config.URLS.AUTH + '/login/cas';
  config.URLS.CHECK = config.URLS.AUTH + '/check';
  config.URLS.USER = config.URLS.BASE + '/user';
  config.URLS.ALL_USERS = config.URLS.BASE + '/all-users';
  config.URLS.USERMARK = config.URLS.USER + 'mark';
  config.URLS.GROUP = config.URLS.BASE + '/group';
  config.URLS.PAD = config.URLS.BASE + '/pad';
  config.URLS.USERLIST = config.URLS.BASE + '/userlist';
  config.URLS.PASSRECOVER = config.URLS.BASE + '/passrecover';
  config.URLS.ACCOUNT_CONFIRMATION = config.URLS.BASE + '/accountconfirm';
  config.URLS.CACHECHECK = config.URLS.BASE + '/cache/check';
  config.SERVER = m.prop();
  // default to en
  var USERLANG_DEFAULT = 'en';
  config.USERLANG = USERLANG_DEFAULT;
  config.LANG = require('../../static/l10n/en.json');

  /**
  * ## updateLang
  *
  * `updateLang` is an asynchronous function that takes a lang *key* and
  * gathers the JSON language file to fix it into `config.LANG`.
  */

  config.updateLang = function (key) {
    m.request({
      method: 'GET',
      url: config.URLS.RAWBASE + 'l10n/' + key + '.json'
    }).then(function (resp) {
      config.USERLANG = key;
      config.LANG = resp;
    }, function (err) {
      console.log('updatel:' + err);
      config.USERLANG = USERLANG_DEFAULT;
      var emsg = config.LANG.BACKEND.ERROR.CONFIGURATION.LANG_PROBLEM +
        ' (' + err + ')';
      var notifErr = require('./widgets/notification.js').error;
      notifErr({ body: emsg });
    });
  };

  /**
  * ## unauthUrl
  *
  * `unauthUrl` is a function that wraps an internal value, a string, `url`,
  * which is empty by default. If argument `set` is fixed to *true*, internal
  * `url` becomes current window location. It always return `url` value.
  */

  config.unauthUrl = (function () {
    var url = '';
    return function (set) {
      if (set) { url = window.location.toString(); }
      return url;
    };
  })();

  /**
  * ## init
  *
  * `init` is an asynchronous function that calls for the public configuration
  * of MyPads and push them to the `SERVER` field. It also populates `auth`
  * m.props with proper  data, when there is already a valid cookie fixed.
  * Finally, it loads language according to browser preference.
  *
  * It takes a `callback` function to execute when initialization is finished.
  */

  config.init = function (callback) {
    m.request({
      method: 'GET',
      url: config.URLS.CONF,
      data: (auth.isAuthenticated() ? { auth_token: auth.token() } : undefined )
    }).then(function (settings) {
      config.SERVER = settings.value; 
      if (!settings.auth && auth.isAuthenticated()) {
        localStorage.removeItem('token');
      }
      auth.userInfo(settings.user);
      var ulang = window.navigator.userLanguage || window.navigator.language;
      ulang = ld.find(ld.keys(config.SERVER.languages), function (l) {
        return ld.startsWith(ulang, l);
      });
      if (ulang && (ulang !== 'en')) { config.updateLang(ulang); }
      callback();
    }, function (err) {
      console.log('confinit:' + err);
      var emsg = config.LANG.BACKEND.ERROR.CONFIGURATION.CANTGET + ' (' + err + ')';
      var notifErr = require('./widgets/notification.js').error;
      notifErr({ body: emsg });
    });
  };

  return config;
}).call(this);
