/**
*  # expandPad helpers functions
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
  var cookie = require('js-cookie');
  var conf = require('../configuration.js');

  var expandPad = {};

  /*
   * Expand iframe when view is initialized and the cookie says to
   */
  expandPad.autoExpand = function(element, isInitialized) {
    if (isInitialized) return;

    var wantExpandedPad = cookie.get('wantExpandedPad');
    if (typeof wantExpandedPad === 'string' && wantExpandedPad === 'true') {
      expandPad.expandIframe();
    }
  }

  /*
   * Check if iframe is expanded
   */
  expandPad.isExpanded = function() {
      return ((document.querySelector('a.expand-toggle').className).indexOf('expanded') > -1);
  }

  /*
   * Expand the iframe
   */
  expandPad.expandIframe = function() {
    var toHide        = document.querySelectorAll('#mypads header, #mypads aside, #mypads footer');
    var section9      = document.querySelector('#mypads main.container section.col-md-9');
    var mainContainer = document.querySelector('#mypads main.container');
    var iframe        = document.querySelector('section.pad iframe');
    var aExpandI      = document.querySelector('a.expand-toggle i');
    var aExpand       = document.querySelector('a.expand-toggle');

    // Hack due to browsers that does not support forEach on nodeList
    [].forEach.call(toHide, function(element) {
        element.classList.add('hidden');
    });

    section9.classList.remove('col-md-9');
    section9.classList.add('col-md-12');

    mainContainer.classList.remove('container');
    mainContainer.classList.add('container-fluid');

    iframe.style.height = '80vh';

    aExpandI.classList.remove('glyphicon-resize-full');
    aExpandI.classList.add('glyphicon-resize-small');

    aExpand.classList.add('expanded');
    aExpand.title = conf.LANG.GROUP.PAD.REDUCE;
    cookie.set('wantExpandedPad', 'true', { expires: 365, path: conf.URLS.RAWBASE });
  };

  /*
   * Reduce the iframe
   */
  expandPad.reduceIframe = function(remember) {
    if (typeof(remember) === 'undefined') {
      remember = true;
    }
    var toShow        = document.querySelectorAll('#mypads header, #mypads aside, #mypads footer');
    var section12     = document.querySelector('#mypads main.container-fluid section.col-md-12');
    var mainContainer = document.querySelector('#mypads main.container-fluid');
    var iframe        = document.querySelector('section.pad iframe');
    var aExpandI      = document.querySelector('a.expand-toggle i');
    var aExpand       = document.querySelector('a.expand-toggle');

    // Hack due to browsers that does not support forEach on nodeList
    [].forEach.call(toShow, function(element) {
        element.classList.remove('hidden');
    });

    section12.classList.remove('col-md-12');
    section12.classList.add('col-md-9');

    mainContainer.classList.remove('container-fluid');
    mainContainer.classList.add('container');

    iframe.style.height = null;

    aExpandI.classList.remove('glyphicon-resize-small');
    aExpandI.classList.add('glyphicon-resize-full');

    aExpand.classList.remove('expanded');
    aExpand.title = conf.LANG.GROUP.PAD.EXPAND;
    if (remember) {
      cookie.set('wantExpandedPad', 'false', { expires: 365, path: conf.URLS.RAWBASE });
    }
  };

  return expandPad;

}).call(this);
