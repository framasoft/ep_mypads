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
   * Expand iframe when the cookie says to
   */
  expandPad.autoExpand = function(element, isInitialized) {
    if (isInitialized) return;

    if (expandPad.wantExpandedPad()) {
      expandPad.expandIframe();
    }
  }

  /*
   * Read the wantExpandedPad cookie and if it says that the user wants to expand iframe
   */
  expandPad.wantExpandedPad = function() {
    var wantExpandedPad = cookie.get('wantExpandedPad');
    return (typeof wantExpandedPad === 'string' && wantExpandedPad === 'true');
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
    var iframe        = document.querySelector('section.pad iframe');
    var aExpandI      = document.querySelector('a.expand-toggle i');
    var aExpand       = document.querySelector('a.expand-toggle');

    if (iframe) {
      iframe.style.height = '80vh';
    }

    if (aExpandI) {
      aExpandI.classList.remove('glyphicon-resize-full');
      aExpandI.classList.add('glyphicon-resize-small');
    }

    if (aExpand) {
      aExpand.classList.add('expanded');
      aExpand.title = conf.LANG.GROUP.PAD.REDUCE;
    }

    cookie.set('wantExpandedPad', 'true', { expires: 365, path: conf.URLS.RAWBASE });
  };

  /*
   * Reduce the iframe
   */
  expandPad.reduceIframe = function(remember) {
    if (typeof(remember) === 'undefined') {
      remember = true;
    }
    var iframe        = document.querySelector('section.pad iframe');
    var aExpandI      = document.querySelector('a.expand-toggle i');
    var aExpand       = document.querySelector('a.expand-toggle');

    if (iframe) {
      iframe.style.height = null;
    }

    if (aExpandI) {
      aExpandI.classList.remove('glyphicon-resize-small');
      aExpandI.classList.add('glyphicon-resize-full');
    }

    if (aExpand) {
      aExpand.classList.remove('expanded');
      aExpand.title = conf.LANG.GROUP.PAD.EXPAND;
    }

    if (remember) {
      cookie.set('wantExpandedPad', 'false', { expires: 365, path: conf.URLS.RAWBASE });
    }
  };

  return expandPad;

}).call(this);
