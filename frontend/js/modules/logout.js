/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Home module
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
*  This module contains the logout logic.
*/

module.exports = (function () {
  // Global dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var cookies = require('js-cookie');
  // Local dependencies
  var conf = require('../configuration.js');
  var auth = require('../auth.js');
  var model = require('../model/group.js');
  var notif = require('../widgets/notification.js');

  var logout = {
    /**
    * `controller` calls the API for logout and returns either :
    *
    * - an error noticiation if the user was not authenticated
    * - a success notification if he was, with updates of local cached data
    */

    controller: function () {
      if (!auth.isAuthenticated()) { return m.route('/login'); }
      m.request({
        method: 'GET',
        url: conf.URLS.LOGOUT,
        config: auth.fn.xhrConfig
      }).then(function () {
        /*
         * Fix pad authorship mixup
         * See https://framagit.org/framasoft/ep_mypads/issues/148
         */
        if (cookies.get('token')) {
          cookies.set('token-' + auth.userInfo().login, cookies.get('token'), { expires: 365 });
          cookies.remove('token');
        }

        auth.userInfo(null);
        localStorage.removeItem('token');
        model.init();
        document.title = conf.SERVER.title;
        notif.success({ body: conf.LANG.USER.AUTH.SUCCESS_OUT });
        m.route('/');
      }, function (err) {
        notif.error({ body: ld.result(conf.LANG, err.error) });
        m.route('/');
      });
    },
    view: function () {}
  };

  return logout;
}).call(this);
