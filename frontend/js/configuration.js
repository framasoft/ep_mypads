/**
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
  config.URLS = { BASE: '/mypads/api' };
  config.URLS.CONF = config.URLS.BASE + '/configuration';
  config.URLS.AUTH = config.URLS.BASE + '/auth';
  config.URLS.LOGIN = config.URLS.AUTH + '/login';
  config.URLS.LOGOUT = config.URLS.AUTH + '/logout';
  config.URLS.CHECK = config.URLS.AUTH + '/check';
  config.URLS.USER = config.URLS.BASE + '/user';
  config.URLS.USERMARK = config.URLS.USER + 'mark';
  config.URLS.GROUP = config.URLS.BASE + '/group';
  config.URLS.PAD = config.URLS.BASE + '/pad';
  config.SERVER = m.prop();
  // default to en
  config.USERLANG = 'en';
  config.LANG = require('../../static/l10n/en.json');

  /**
  * ## updateLang
  *
  * `updateLang` is an asynchronous function that takes a lang *key* and
  * gathers the JSON language file to fix it into `config.LANG`.
  *
  * TODO: error handling
  */

  config.updateLang = function (key) {
    m.request({
      method: 'GET',
      url: '/mypads/l10n/' + key + '.json'
    }).then(function (resp) {
      config.USERLANG = key;
      config.LANG = resp;
    });
  };

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
    m.request({ method: 'GET', url: config.URLS.CONF })
    .then(function (settings) {
      config.SERVER = settings.value; 
      auth.isAuthenticated(settings.auth);
      auth.userInfo(settings.user);
      var ulang = window.navigator.userLanguage || window.navigator.language;
      ulang = ld.find(ld.keys(config.SERVER.languages), function (l) {
        return ld.startsWith(ulang, l);
      });
      if (ulang && (ulang !== 'en')) { config.updateLang(ulang); }
      callback();
    });
  };

  return config;
}).call(this);
