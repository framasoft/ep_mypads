/**
*  # Media Queries by JavaScript
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
*  This module uses media queries listeners to ensure compatibility with JSS.
*/

module.exports = (function () {

  var media = {};

  /**
  * ## breaks
  *
  * `breaks` is an object containing a list of responsive breaks and functions
  * to call when they match.
  */


  media.breaks = {
    desktop: {
      match: window.matchMedia('(min-width: 60em)'),
      fns: []
    },
    largetablet: {
      match: window.matchMedia('(min-width: 50em)'),
      fns: []
    },
    tablet: {
      match: window.matchMedia('(min-width: 40em)'),
      fns: []
    },
  };

  /**
  * ## init
  *
  * `init` is a function that creates listeners for responsive design and apply
  * functions when break is matched.
  */

  media.init = function () {
    var listener = function (name) {
      return function (m) {
        if (m.matches) {
          for (var i = 0, l = media.breaks[name].fns.length; i < l; i++) {
            media.breaks[name].fns[i].attach();
          }
        }
      };
    };
    for (var name in media.breaks) {
      media.breaks[name].match.addListener(listener(name));
    }
  };

  return media;

}).call(this);
