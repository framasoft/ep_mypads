/**
*  # Permission Module
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
*  This module contains all functions about permission for groups and pads,
*  according to authenticated user.
*/

// External dependencies
var getPad;
var getPadHTML;
try {
  // Normal case : when installed as a plugin
  getPad = require('ep_etherpad-lite/node/db/PadManager').getPad;
  getPadHTML = require('ep_etherpad-lite/node/utils/ExportHtml').getPadHTML;
}
catch (e) {
  // Testing case : noop functions
    getPad = function (padId, callback) { callback(null); };
    getPadHTML = function (pad, rev, callback) {
      callback(null, '<p>Testing only</p>');
    };
}
var ld = require('lodash');
var auth = require('./auth.js');
var pad = require('./model/pad.js');
var group = require('./model/group.js');

module.exports = (function () {
  'use strict';

  var perm = {};

  /**
  * ## Private functions
  */

  perm.fn = {};

  /**
  * ### getPadAndGroup
  *
  * `getPadAndGroup` asynchronous function returns to callback the *pad* and
  * parent *group* or an *error* if there is. It takes mandatory pad id and
  * callback function.
  *
  */

  perm.fn.getPadAndGroup = function (pid, callback) {
    pad.get(pid, function (err, p) {
      if (err) { return callback(null, null); }
      group.get(p.group, function (err, g) {
        if (err) { return callback(err); }
        return callback(null, { pad : p, group: g });
      });
    });
  };

  /**
  * ### check
  *
  * `check` function is a middlware-like function for all request to pads.
  * It checks if the pad is handled by MyPads or not and if, allows to see it
  * according its *visibility* and user authentication.
  */

  perm.fn.check = function (req, res, next) {
    var unexpectedErr = function (err) {
      return res.status(401).send('Sorry, an error has occured : ' + err);
    };
    var refuse = function () {
      res.status(403).send('You are not allowed to access to this pad.');
    };
    var uid = req.session.uid || false;
    perm.fn.getPadAndGroup(req.params.pid, function (err, pg) {
      if (err) { return unexpectedErr(err); }
      // Key not found, not a MyPads pad so next()
      if (!pg) { return next(); }
      // If admin of the group, ok
      var g = pg.group;
      if (ld.includes(g.admins, uid)) { return next(); }
      if (g.visibility === 'restricted') {
        return (ld.includes(g.users, uid) ? next() : refuse());
      } else if (g.visibility === 'private') {
        var password = req.query.mypadspassword;
        if (!password) { return refuse(); }
        auth.fn.isPasswordValid(g, password, function (err, valid) {
          if (err) { return unexpectedErr(err); }
          return (valid ? next() : refuse());
        });
      } else {
        next(); // public
      }
    });
  };

  /**
  * ### readonly
  *
  * `readonly` is a middleware-like procedure for all requests to pads.
  * It checks if the pad belongs to MyPads and has been archived. If yes, it
  * redirects to HTML export.
  */

  perm.fn.readonly = function (req, res, next) {
    var unexpectedErr = function (err) {
      return res.status(401).send('Sorry, an error has occured : ' + err);
    };
    perm.fn.getPadAndGroup(req.params.pid, function (err, pg) {
      if (err) { return unexpectedErr(err); }
      // Key not found, not a MyPads pad so next()
      if (!pg) { return next(); }
      var g = pg.group;
      if (g.readonly) {
        getPad(pg.pad._id, function (err, p) {
          if (err) { return unexpectedErr(err); }
          getPadHTML(p, undefined, function (err, html) {
            if (err) { return unexpectedErr(err); }
            html = '<!DOCTYPE HTML><html><body>' + html + '</body></html>';
            return res.status(200).send(html);
          });
        });
      } else {
        return next();
      }
    });
  };

  /**
  * ## Public functions
  *
  * ### init
  *
  * `iniŧ` is a synchronous function used to set up authentification. It :
  *
  * - initializes local strategy by default
  * - uses of passport middlwares for express
  * - launch session middleware bundled with express, using secret phrase saved
  *   in database
  */

  perm.init = function (app) {
    app.all('/p/:pid', perm.fn.check);
    app.all('/p/:pid', perm.fn.readonly);
  };

  return perm;

}).call(this);
