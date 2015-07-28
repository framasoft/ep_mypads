/**
*  # Pad and group sharing module
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
*  Short module for pad and group sharing
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var conf = require('../configuration.js');

  /**
  * ## Main function
  *
  * Used to give the MyPads URL
  */
  return function (gid, pid) {
    var l = window.location;
    var url = l.protocol + '//' + l.host + l.pathname + '?/mypads/group/' + gid;
    var suffix = (pid ? '/pad/view/' + pid : '/view');
    window.prompt(conf.LANG.GROUP.SHARE_LINK, url + suffix);
  };
}).call(this);
