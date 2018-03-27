/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # CleanupXss helpers functions
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
  var cleanupXss = {};

  /**
  * `cleanup` removes `<` and `>` to replace them by HTML entities
  */

  var rgx1 = new RegExp('<', 'g');
  var rgx2 = new RegExp('>', 'g');

  cleanupXss.cleanup = function(text) {
    return text.replace(rgx1, '&lt;').replace(rgx2, '&gt;');
  };

  return cleanupXss;

}).call(this);
