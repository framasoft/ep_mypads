/**
*  # Client Hooks Module
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
*  This module contains client-side hooks used by etherpad.
*
*  ## Client Hooks
*/
'use strict';

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
exports.postToolbarInit = function (hook_name, args) {
  var params = {};

  if (location.search) {
    var parts = location.search.substring(1).split('&');

    for (var i = 0; i < parts.length; i++) {
      var nv = parts[i].split('=');
      if (!nv[0]) continue;
      params[nv[0]] = nv[1] || true;
    }
  }

  var token = params.auth_token;

  $('#exportColumn .exportlink').each(function(index) {
    var element = $(this);

    var link = element.attr('href');

    if (link.indexOf('?') !== -1) {
      element.attr('href', link+'&auth_token='+params.auth_token);
    } else {
      element.attr('href', link+'?auth_token='+params.auth_token);
    }
  });

  $('li[data-key="showTimeSlider"]').unbind('click');
  $('li[data-key="showTimeSlider"] a').attr('href', location.pathname+'/timeslider?auth_token='+params.auth_token);

  var padLoc = location.pathname.replace(new RegExp('/timeslider$'), '');
  $('li[data-key="timeslider_returnToPad"]').unbind('click');
  $('li[data-key="timeslider_returnToPad"] a').attr('href', padLoc+'?auth_token='+params.auth_token);
}
