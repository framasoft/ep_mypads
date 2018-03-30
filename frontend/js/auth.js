/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Authentification module
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
*  This module handles MyPads Web client authentification.
*/

module.exports = (function () {
  var m = require('mithril');

  var auth = {};
  auth.admToken = function () { return localStorage.getItem('admToken'); };
  auth.isAdmin = function () { return !!auth.admToken(); };
  auth.userInfo = m.prop();
  auth.token = function () { return localStorage.getItem('token'); };
  //auth.isAuthenticated = m.prop(!!auth.token());
  auth.isAuthenticated = function () { return !!auth.token(); };

  auth.fn = {};

  /**
  * ### xhrConfig
  *
  * `xhrConfig` sets *Authorization* header for XML Requests. It takes a `xhr`
  * object for m.request and sets Authorization header with `auth.token`
  * property.
  */

  auth.fn.xhrConfig = function (xhr) {
    xhr.setRequestHeader('Authorization', 'JWT ' + auth.token());
  };

  return auth;
}).call(this);
