/**
*  # Group bookmarking module
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
*  Short module for group bookmark and unmark
*/

module.exports = (function () {
  'use strict';
  // Dependencies
  var m = require('mithril');
  var ld = require('lodash');
  var auth = require('../auth.js');
  var conf = require('../configuration.js');
  var notif = require('../widgets/notification.js');
  var model = require('../model/group.js');

  /**
  * ## Main function
  *
  * Used for authentication enforcement and confirmation before removal. In all
  * cases, redirection to parent group view. An optional `successFn` can be
  * given, called with no argument after successfull operation.
  */

  return function (group, successFn) {
    var gid  = group._id;
    var user = auth.userInfo();
    if (ld.includes(user.bookmarks.groups, gid)) {
      ld.pull(user.bookmarks.groups, gid);
    } else {
      user.bookmarks.groups.push(gid);
    }
    if (typeof(model.bookmarks().groups[group._id]) !== 'undefined') {
      delete model.bookmarks().groups[group._id];
    } else {
      model.bookmarks().groups[group._id] = group;
    }
    m.request({
      url: conf.URLS.USERMARK,
      method: 'POST',
      data: {
        type: 'groups',
        key: gid,
        auth_token: auth.token()
      }
    }).then(function () {
      notif.success({ body: conf.LANG.GROUP.MARK_SUCCESS });
      if (successFn) { successFn(); }
    }, function (err) {
      return notif.error({ body: ld.result(conf.LANG, err.error) });
    });
  };

}).call(this);
