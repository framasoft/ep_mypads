/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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

// Reload page on disconnect to prevent unauthorized access
var automaticReconnect = require('ep_etherpad-lite/static/js/pad_automatic_reconnect');
var showCountDownTimerToReconnectOnModal = automaticReconnect.showCountDownTimerToReconnectOnModal;
automaticReconnect.showCountDownTimerToReconnectOnModal = function($modal, pad) {
  if ($modal.is('.with_reconnect_timer')) {
    location.reload();
  }
};

exports.postToolbarInit = function (hook_name, args) {
  /*
   * Fix links with auth_token
   */
  var params = {};

  if (location.search) {
    var parts = location.search.substring(1).split('&');

    for (var i = 0; i < parts.length; i++) {
      var nv = parts[i].split('=');
      if (!nv[0]) continue;
      params[nv[0]] = nv[1] || true;
    }
  }

  setTimeout(function() {
    if (typeof params.auth_token !== 'undefined') {
      updateLinks('auth_token', params.auth_token);
    } else if (typeof params.mypadspassword !== 'undefined') {
      updateLinks('mypadspassword', params.mypadspassword);
    }
  }, 500);

  function updateLinks(parName, parValue) {
    $('#exportColumn .exportlink, #import_export #export a.exportlink').each(function(index) {
      var element = $(this);

      var link = element.attr('href');

      if (link.indexOf('?') !== -1) {
        element.attr('href', link+'&'+parName+'='+parValue);
      } else {
        element.attr('href', link+'?'+parName+'='+parValue);
      }
    });

    $('li[data-key="showTimeSlider"]').unbind('click');
    $('li[data-key="showTimeSlider"] a').attr('href', location.pathname+'/timeslider?'+parName+'='+parValue);

    var padLoc = location.pathname.replace(new RegExp('/timeslider$'), '');
    $('li[data-key="timeslider_returnToPad"]').unbind('click');
    $('li[data-key="timeslider_returnToPad"] a').attr('href', padLoc+'?'+parName+'='+parValue);

    $('#importform').attr('action', $('#importform').attr('action')+'?'+parName+'='+parValue);
  }

  /*
   * Hide read-only checkbox if the pad is not public
   */
  $('#embedreadonly').css('display', 'none');
  var padID = window.location.href.split('/').pop().split('?').shift();
  var baseURL = window.location.href.split('/p/'+padID).shift();
  $.ajax({
    method: 'GET',
    url: baseURL+'/mypads/api/pad/ispublic/'+padID,
    dataType: 'JSON',
    success: function(data, textStatus, jqXHR) {
      if (data.success && data.ispublic) {
        $('#embedreadonly').css('display', 'block');
      }
    }
  });

  /*
   * Prevents users from changing their nickname if useFirstLastNameInPads is set
   */
  $.ajax({
    method: 'GET',
    url: baseURL+'/mypads/api/configuration/public/usefirstlastname',
    dataType: 'JSON',
    success: function(data, textStatus, jqXHR) {
      if (data.success && data.usefirstlastname) {
        $('#myusernameedit').prop('disabled', true);
      }
    }
  });

  /*
   * Replace the Etherpad share URL by MyPads share URL and hide embed code
   * if using allPadsPublicsAuthentifiedOnly
   */
  $.ajax({
    method: 'GET',
    url: baseURL+'/mypads/api/configuration/public/allpadspublicsauthentifiedonly',
    dataType: 'JSON',
    data: {
      pid: padID
    },
    success: function(data, textStatus, jqXHR) {
      if (data.success && data.allpadspublicsauthentifiedonly) {
        var url = baseURL+'/mypads/?/mypads/group/'+data.group+'/pad/view/'+padID;
        $('#linkinput').hide();
        $('#embedcode').hide();
        $('#linkinput').parent().append('<input id="linkinput2" value="'+url+'" onclick="this.select()" type="text">');
      }
    }
  });
}
