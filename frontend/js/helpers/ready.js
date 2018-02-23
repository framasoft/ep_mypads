/**
*  # Ready helpers functions
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
*  This module contains function to check if the user cache is populated
*/

module.exports = (function () {
  // Dependencies
  var m = require('mithril');
  var conf = require('../configuration.js');

  var ready = {};

  /**
  * `checkLoop` will poll the server to know if the user cache is fully loaded
  * It will call ready.inFrame too.
  */

  ready.checkLoop = function(element, isInitialized) {
    if (isInitialized) return;

    // Are we in an iFrame?
    ready.inFrame(element, isInitialized);

    // Is the user cache ready?
    m.request({
      method: 'GET',
      url: conf.URLS.CACHECHECK
    }).then(function (resp) {
      if (resp.userCacheReady) {
        var toHide = document.getElementById('hide-when-ready').classList;
        var toShow = document.querySelectorAll('.show-when-ready');
        toHide.add('hidden');
        // Hack due to browsers that does not support forEach on nodeList
        [].forEach.call(toShow, function(element) {
          element.classList.remove('hidden');
        });
        return 'user cache ready';
      } else {
        setTimeout(function() {
          return ready.checkLoop();
        }, 500);
      }
    }, function (err) {
      console.log('user cache check loop:' + err);
      var emsg = config.LANG.BACKEND.CONFIGURATION.LANG_PROBLEM +
        ' (' + err + ')';
      var notifErr = require('../widgets/notification.js').error;
      notifErr({ body: emsg });
      if (err) {
        setTimeout(function() {
          return ready.checkLoop();
        }, 500);
      }
    })
  };

  /**
  * `inFrame` checks if we are in a MyPads iFrame and reload the parent window
  * if it's the case.
  *
  * Example: you're using a pad through a MyPads iFrame, the server crashes, you
  * need to relog, but this prevents the login page to show inside the iFrame.
  */
  var rgx = new RegExp('/mypads');
  ready.inFrame = function(element, isInitialized) {
    if (isInitialized) return;

    var windowMode     = location.href;
    window.displaymode = windowMode;
    //detect if we are in a iframe
    if (typeof(window.parent.displaymode) !== 'undefined' && window.parent.displaymode === windowMode) {
      return false;
    } else if (window.parent.location.href.match(rgx)) {
      window.parent.location.reload();
    }
  }

  return ready;

}).call(this);
