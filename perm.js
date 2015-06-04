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
  * ### check
  *
  * `check` function is a middlware-like function for all request to pads.
  * It checks if the pad is handled by MyPads or not and if, allows to see it
  * according its *visibility* and user authentication.
  */

  perm.fn.check = function (req, res, next) {
    pad.get(req.params.pid, function (err, p) {
      // Key not found, not a MyPads pad so next()
      if (err) { return next(); }
      group.get(p.group, function (err, g) {
        var unexpectedErr = function () {
          return res.status(401).send('Sorry, an error has occured : ' + err);
        };
        var refuse = function () {
          res.status(403).send('You are not allowed to access to this pad.');
        };
        if (err) { return unexpectedErr(); }
        if (g.visibility === 'restricted') {
          if (ld.includes(ld.union(g.admins, g.users), req.session.uid)) {
            return next();
          } else {
            return refuse();
          }
        } else if (g.visibility === 'private') {
          var password = req.query.mypadspassword;
          if (!password) { return refuse(); }
          auth.fn.isPasswordValid(g, password, function (err, valid) {
            if (err) { return unexpectedErr(); }
            if (!valid) { return refuse(); }
            next();
          });
        } else {
          next(); // public
        }
      });
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
  };

  return perm;

}).call(this);
