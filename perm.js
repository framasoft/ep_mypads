/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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
var getPadID;
var getPadHTML;
try {
  // Normal case : when installed as a plugin
  getPad = require('ep_etherpad-lite/node/db/PadManager').getPad;
  getPadID = require('ep_etherpad-lite/node/db/API').getPadID;
  getPadHTML = require('ep_etherpad-lite/node/utils/ExportHtml').getPadHTML;
}
catch (e) {
  // Testing case : noop functions
    getPad = function (padId, callback) { callback(null); };
    getPadID = function (padId, callback) { callback(null); };
    getPadHTML = function (pad, rev, callback) {
      callback(null, '<p>Testing only</p>');
    };
}
var ld = require('lodash');
var decode = require('js-base64').Base64.decode;
var conf = require('./configuration.js');
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
  * ### getVarFromReferer
  *
  * `getVarFromReferer` synchronous function for getting an URL passed variable
  * from referer. Usefull for cases like timeslider or exports.
  *
  */

 perm.fn.getVarFromReferer = function (varName, req) {
   var ref = req.headers.referer;
   if (!ref) { return false; }
   var rg = new RegExp(varName + '=([^&]+)');
   var rgxres = rg.exec(ref);
   return (rgxres ? rgxres[1] : false);
 };

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
      if (err) { console.error(err); }
      if (err || !p) { return callback(null, null); }
      group.get(p.group, function (err, g) {
        if (err) { return callback(err); }
        return callback(null, { pad : p, group: g });
      });
    });
  };

  /**
  * ### check
  *
  * `check` internal function checks if the pad is handled by MyPads or not and
  * if, allows to see it according its *visibility* and user authentication.
  */

  perm.fn.check = function (params) {
    var callback = ld.partial(params.callback, params);
    var checkPass = function (el) {
      var rq = params.req.query;
      var password = (rq ? rq.mypadspassword : false );
      if (!password) {
        password = perm.fn.getVarFromReferer('mypadspassword', params.req);
      }
      if (!password) { return params.refuse(); }
      auth.fn.isPasswordValid(el, decode(password), function (err, valid) {
        if (err) { return params.unexpected(err); }
        return (valid ? callback() : params.refuse());
      });
    };
    var token = (params.req.query ? params.req.query.auth_token : false);
    if (!token) {
      var ref = params.req.headers.referer;
      if (ref) {
        var rgxres = /&auth_token=(.+)&?/.exec(ref);
        if (rgxres) { token = rgxres[1]; }
      }
    }
    var u = auth.fn.getUser(token);
    var uid = u && u._id || false;
    // Key not found, not a MyPads pad so depends on allowEtherPads
    if (!params.pg) {
      return params[(conf.get('allowEtherPads') ? 'next' : 'unexpected')]();
    }
    var g = params.pg.group;
    var p = params.pg.pad;
    // If admin of the group or pad or group publics, ok
    // If pad or group is private, check password
    if (ld.includes(g.admins, uid)) { return callback(); }
    switch (p.visibility) {
      case 'public':
        return callback();
      case 'private':
        return checkPass(p);
      default:
        switch (g.visibility) {
          case 'public':
            return callback();
          case 'private':
            return checkPass(g);
          // Restricted case : if user, ok
          default:
            return (ld.includes(g.users, uid) ? callback() : params.refuse());
        }
    }
  };

  /**
  * ### readonly
  *
  * `readonly` checks if the pad belongs to MyPads and has been archived. If
  * yes, it redirects to HTML export.
  */

  perm.fn.readonly = function (params) {
    var g = params.pg.group;
    var p = params.pg.pad;
    if (p.readonly || (g.readonly && p.readonly === null)) {
      return getPad(params.pg.pad._id, function (err, p) {
        if (err) { return params.unexpected(err); }
        getPadHTML(p, undefined, function (err, html) {
          if (err) { return params.unexpected(err); }
          html = '<!DOCTYPE HTML><html><body>' + html + '</body></html>';
          return params.res.status(200).send(html);
        });
      });
    } else {
      return params.next();
    }
  };

  /**
  * ### check
  *
  * `check` is a middleware-like function for all requests to pads.
  * It regroups permissions work according to groups and pads visibility and
  * readonly verifications. It retrieves pad and group requested and pass the
  * result alongside request, result and chained function.
  */

  var trimRgx = new RegExp('/.*');
  perm.check = function (req, res, next) {
    var params;
    var pid = req.params.pid || req.params[0];
        pid = pid.replace(trimRgx, '');
    var unexpected = function (err) {
      return res.status(401).send({
        error: 'BACKEND.ERROR.PERMISSION.UNEXPECTED',
        extra: err
      });
    };
    var refuse = function () {
      var mypadsRoute = conf.get('rootUrl') + '/mypads/index.html?/mypads/group/' +
        params.pg.group._id + '/pad/view/' + params.pg.pad._id;
      return res.redirect(mypadsRoute);
    };
    params = {
      req: req,
      res: res,
      next: next,
      callback: perm.fn.readonly,
      unexpected: unexpected,
      refuse: refuse,
      pid: pid
    };
    // Is pid a real pad id or a read only pad id?
    if (pid.match(/^r\.[A-Za-z0-9_-]{32}$/)) {
      // It's a read only pid, let's get the real pad id
      getPadID(pid, function(err, result) {
        if (err) { return unexpected(err); }
        pid = result.padID;
        // And then fetch the pad through MyPads API
        perm.fn.getPadAndGroup(pid, function (err, pg) {
          if (err) { return unexpected(err); }
          params.pg = pg;
          perm.fn.check(params);
        });
      });
    } else {
      // It's a real pad id, fetch the pad through MyPads API
      perm.fn.getPadAndGroup(pid, function (err, pg) {
        if (err) { return unexpected(err); }
        params.pg = pg;
        perm.fn.check(params);
      });
    }
  };

  /**
  * ### setNameAndColor
  *
  * Internal function `setNameAndColor` is an Express middleware used in
  * conjunction with `padAndAuthor` public JS object. According to *user*
  * object in `auth.tokens` and user preference for `useLoginAndColorInPads`,
  * it passes, for a given pad identifier, the last `login` and user `color`
  * values.
  */

  perm.padAndAuthor = {};

  perm.setNameAndColor = function (req, res, next) {
    var token = (req.query ? req.query.auth_token : false);
    if (!token) { token = perm.fn.getVarFromReferer('auth_token', req); }
    var u = auth.fn.getUser(token);
    if (u && u.useLoginAndColorInPads) {
      var opts = { userName: u.login };
      if (u.padNickname) {
        opts.userName = u.padNickname;
      }
      if (conf.get('useFirstLastNameInPads')) {
        var firstname = (u.firstname) ? u.firstname : '';
        var lastname  = (u.lastname)  ? u.lastname  : '';
        opts.userName = firstname+' '+lastname;
      }
      if (u.color) {
        opts.userColor = u.color;
        req.query.userColor = opts.userColor;
      }
      perm.padAndAuthor[req.params.pid] = opts;
      req.query.userName = opts.userName;
    } else {
      delete perm.padAndAuthor[req.params.pid];
    }
    return next();
  };


  /**
  * ## Public functions
  *
  * ### init
  *
  * `init` is a synchronous function used to set up authentification. It :
  *
  * - initializes routes with `check` and `setNameAndColor`
  * - if configuration option `forbidPublicPads` is *true*, redirects etherpad
  *   homepage to MyPads and forbids direct creation from /p/pid (via `check`)
  */

  perm.init = function (app) {
    //app.all('/p/([A-Za-z0-9_-]+)', perm.check);
    var rgx = new RegExp('/p/(r\.[A-Za-z0-9_-]{32}$|[.A-Za-z0-9_-]+[A-Za-z0-9_/-]*)');
    app.all(rgx, perm.check);
    app.all('/p/:pid', perm.setNameAndColor);
    app.get('/', function (req, res, next) {
      if (conf.get('allowEtherPads')) {
        return next();
      } else {
        return res.redirect(conf.get('rootUrl') + '/mypads/');
      }
    });
  };

  return perm;

}).call(this);
