/**
*  # API Module
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
*  This module holds all public functions, used for the API of mypads.
*  Please refer to binded function when no details are given.
*/

// External dependencies
var ld = require('lodash');
var passport = require('passport');
var express;
var testMode = false;
try {
  // Normal case : when installed as a plugin
  express = require('../ep_etherpad-lite/node_modules/express');
}
catch (e) {
  // Testing case : we need to mock the express dependency
  testMode = true;
  express = require('express');
}
var bodyParser = require('body-parser');
// Local dependencies
var conf = require('./configuration.js');
var user = require('./model/user.js');
var group = require('./model/group.js');
var pad = require('./model/pad.js');
var auth = require('./auth.js');
var perm = require('./perm.js');

module.exports = (function () {
  'use strict';

  var api = {};
  api.initialRoute = '/mypads/api/';

  /**
  * `init` is the first function that takes an Express app as argument.
  * It loads locales definitions, then it initializes all API requirements,
  * particularly mypads routes.
  */

  api.init = function (app, language, callback) {
    // Use this for .JSON storage
    app.use(bodyParser.json());
    app.use('/mypads', express.static(__dirname + '/static'));
    if (testMode) {
      // Only allow functional testing in testing mode
      app.use('/mypads/functest', express.static(__dirname + '/spec/frontend'));
    }
    auth.init(app);
    authAPI(app);
    perm.init(app);
    configurationAPI(app);
    userAPI(app);
    groupAPI(app);
    padAPI(app);
    callback();
  };

  /**
  * ## Internal functions helpers
  *
  * These functions are not private like with closures, for testing purposes,
  * but they are expected be used only internally by other MyPads functions.
  */

  var fn = {};

  /**
  * `get` internal takes a mandatory `module` argument to call its `get` method.
  * It will use `req.params.key` to get the database record and returns an
  * according response. By the way, an optional `cond`ition can be passed. It
  * is a function that takes the result of the module.get and *true* or
  * *false*. If *false*, an error will be returned.
  */

  fn.get = function (module, req, res, next, cond) {
    try {
      module.get(req.params.key, function (err, val) {
        if (err) {
          return res.status(404).send({
            error: err.message,
            key: req.params.key
          });
        }
        if (cond && !cond(val)) {
          return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.DENIED_RECORD');
        } else {
          return res.send({ key: req.params.key, value: val });
        }
      });
    }
    catch (e) {
      res.status(400).send({ error: e.message });
    }
  };

  /**
  * `set` internal takes :
  *
  * - a `setFn` bounded function targetted the original `set` from the module
  *   used in the case of this public API
  * - `key` and `value` that has been given to the `setFn` function
  * - `req` and `res` express request and response
  */

  fn.set = function (setFn, key, value, req, res) {
    try {
      setFn(function (err, data) {
        if (err) { return res.status(400).send({ error: err.message }); }
        res.send({ success: true, key: key || data._id, value: data || value });
      });
    }
    catch (e) {
      res.status(400).send({ error: e.message });
    }
  };

  /**
  * `del` internal takes four arguments :
  *
  * - `delFn` bounded function targetted the original `del` method from the
  *   module used
  * - classical `req` and `res` express parameters, with mandatory
  *   *req.params.key*.
  */

  fn.del = function (delFn, req, res) {
    var key = req.params.key;
    delFn(key, function (err) {
      if (err) { return res.status(404).send({ error: err.message }); }
      res.send({ success: true, key: key });
    });
  };

  /**
  * `denied` is an internal helper that just takes `res` express response and
  * an `errorCode` string. It returns an unothorized status.
  */

  fn.denied = function (res, errCode) {
    return res
    .status(401)
    .send({ error: errCode });
  };


  /**
  * `ensureAuthenticated` internal is an Express middleware takes `req`,
  * `res` and `next`. It returns error or lets the next middleware go.
  */

  fn.ensureAuthenticated = function (req, res, next) {
    if (!req.isAuthenticated() && !req.session.mypadsLogin) {
      return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.MUST_BE');
    } else {
      return next();
    }
  };

  /**
  * `ensureAdmin` internal is an Express middleware that takes classic `req`,
  * `res` and `next`. It returns an error if the connected user is not
  * autenticated by Etherpad as the instance admin (ATM via /admin).
  */

  fn.ensureAdmin = function (req, res, next) {
    var isAdmin = (req.session.user && req.session.user.isAdmin);
    if (!isAdmin) {
      return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.ADMIN');
    } else {
      return next();
    }
  };

  /**
  * `ensureAdminOrSelf` internal Express middleware takes the classic `req`,
  * `res` and `next`. It returns an error if the connected user tries to manage
  * users other than himself and he is not an Etherpad logged admin.
  */

  fn.ensureAdminOrSelf = function (req, res, next) {
    var isAdmin = (req.session.user && req.session.user.isAdmin);
    var login = req.params.key || req.body.login;
    var isSelf = (login === req.session.mypadsLogin);
    if (!isAdmin && !isSelf) {
      return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.DENIED');
    } else {
      return next();
    }
  };

  /**
  * ## Authentication API
  */

  var authAPI = function (app) {
    var authRoute = api.initialRoute + 'auth';

    /**
    * POST method : check, method returning success or error if given *login*
    * and *password* do not match to what is stored into database
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/auth/check
    */

    app.post(authRoute + '/check', fn.ensureAuthenticated,
      function (req, res) {
        try {
          auth.fn.localFn(req.body.login, req.body.password,
            function (err) {
              if (err) { return res.status(400).send({ error: err.message }); }
              res.status(200).send({ success: true });
            }
          );
        }
        catch (e) {
          res.status(400).send({ error: e.message });
        }
      }
    );

    /**
    * POST method : login, method returning user object minus password if auth
    * is a success, plus fixes a `login` session.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/auth/login
    */

    app.post(authRoute + '/login', function (req, res, next) {
      passport.authenticate('local', function (err, user, info) {
        if (err) { return res.status(400).send({ error: err.message }); }
        if (!user) { return res.status(400).send({ error: info.message }); }
        req.login(user, function (err) {
          if (err) { return res.status(400).send({ error: err }); }
          var finish = function () {
            ld.assign(req.session, {
              mypadsUid: user._id,
              mypadsLogin: user.login,
              mypadsColor: user.color,
              mypadsUseLoginAndColorInPads: user.useLoginAndColorInPads
            });
            res.status(200).send({
              success: true,
              user: ld.omit(user, 'password')
            });
          };
          finish();
        });
      })(req, res, next);
    });

    /**
    * GET method : logout, method that destroy current `req.session` and logout
    * from passport.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/auth/logout
    */

    app.get(authRoute + '/logout', function (req, res) {
      if (req.isAuthenticated() || !!req.session.mypadsLogin) {
        req.logout();
        req.session.destroy();
        res.status(200).send({ success: true });
      } else {
        res.status(400)
          .send({ error: 'BACKEND.ERROR.AUTHENTICATION.NOT_AUTH' });
      }
    });

  };

  /**
  * ## Configuration API
  *
  * All methods needs `fn.ensureAuthenticated`
  */

  var configurationAPI = function (app) {
    var confRoute = api.initialRoute + 'configuration';

    /**
    * GET method : get all configuration plus user info if logged, else config
    * public fields.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/configuration
    */

    app.get(confRoute, function (req, res) {
      var isAuth = (req.isAuthenticated() || !!req.session.mypadsLogin);
      var isAdmin = (req.session.user && req.session.user.isAdmin);
      var action = isAdmin ? 'all' : 'public';
      var value = conf[action]();
      var resp = { value: value, auth: isAuth };
      if (isAuth) {
        user.get(req.session.mypadsLogin, function (err, u) {
          if (err) { return res.status(400).send({ error: err }); }
          resp.user = u;
          res.send(resp);
        });
      } else {
        res.send(resp);
      }
    });

    /**
    * GET method : `configuration.get` key
    * Reserved to Etherpad administrators
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/configuration/something
    */

    app.get(confRoute + '/:key', fn.ensureAdmin, function (req, res) {
      var value = conf.get(req.params.key);
      if (ld.isUndefined(value)) {
        return res.status(404).send({
          error: 'BACKEND.ERROR.CONFIGURATION.KEY_NOT_FOUND',
          key: req.params.key 
        });
      }
      res.send({ key: req.params.key, value: value });
    });

    /**
    * POST/PUT methods : `configuration.set` key and value on initial
    * Reserved to Etherpad administrators
    *
    * Sample URL for POST:
    * http://etherpad.ndd/mypads/api/configuration
    * for PUT
    * http://etherpad.ndd/mypads/api/configuration/something
    */

    var _set = function (req, res) {
      var key = (req.method === 'POST') ? req.body.key : req.params.key;
      var value = req.body.value;
      var setFn = ld.partial(conf.set, key, value);
      fn.set(setFn, key, value, req, res);
    };

    app.post(confRoute, fn.ensureAdmin, _set);
    app.put(confRoute + '/:key', fn.ensureAdmin, _set);

    /**
    * DELETE method : `configuration.del` key
    * Reserved to Etherpad administrators
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/configuration/something
    */

    app.delete(confRoute + '/:key', fn.ensureAdmin,
      ld.partial(fn.del, conf.del));
  };

  /**
  *  ## User API
  *
  * Most methods need `fn.ensureAdminOrSelf`
  */

  var userAPI = function (app) {
    var userRoute = api.initialRoute + 'user';

    /**
    * GET method : `user.get` login (key)
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.get(userRoute + '/:key', fn.ensureAdminOrSelf,
      ld.partial(fn.get, user));

    // `set` for POST and PUT, see below
    var _set = function (req, res) {
      var key;
      var value = req.body;
      if (req.method === 'POST') {
        key = req.body.login;
      } else {
        key = req.params.key;
        value.login = req.body.login || key;
        value._id = user.ids[key];
      }
      // Update needed session values
      req.session.mypadsColor = req.body.color || req.session.mypadsColor;
      if (!ld.isUndefined(req.body.useLoginAndColorInPads)) {
        req.session.mypadsUseLoginAndColorInPads =
          req.body.useLoginAndColorInPads;
      }
      var setFn = ld.partial(user.set, value);
      fn.set(setFn, key, value, req, res);
    };

    /**
    * POST method : `user.set` with user value for user creation
    * Only method without AdminOrSelf
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/user
    */

    app.post(userRoute, _set);

    /**
    * PUT method : `user.set` with user key/login plus value for existing user
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.put(userRoute + '/:key', fn.ensureAdminOrSelf, _set);

    /**
    * DELETE method : `user.del` with user key/login
    * Destroy session if self account removal
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.delete(userRoute + '/:key', fn.ensureAdminOrSelf, function (req, res) {
      var isSelf = (req.params.key === req.session.mypadsLogin);
      if (isSelf) { req.session.destroy(); }
      fn.del(user.del, req, res);
    });

    /**
    * POST method : `user.mark` with user session login, bookmark type and key
    * Only need ensureAuthenticated because use own login for marking
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/user/mark
    */

    app.post(userRoute + '/mark', fn.ensureAuthenticated,
      function (req, res) {
        try {
          user.mark(req.session.mypadsLogin, req.body.type, req.body.key,
            function (err) {
              if (err) { return res.status(404).send({ error: err.message }); }
              res.send({ success: true });
            }
          );
        }
        catch (e) { res.status(400).send({ error: e.message }); }
      }
    );

  };

  /**
  * ## Group API
  *
  * All methods except creation need special permissions.
  */

  var groupAPI = function (app) {
    var groupRoute = api.initialRoute + 'group';

    /**
    * GET method : `group.getByUser` via user login. passwords are omitted
    * Returns all groups and pads, filtered from sensitive data.
    *
    * Only for authenticated users.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group
    */

    app.get(groupRoute, fn.ensureAuthenticated,
      function (req, res) {
        user.get(req.session.mypadsLogin, function (err, u) {
          if (err) { return res.status(400).send({ error: err }); }
          try {
            group.getByUser(u, true, function (err, data) {
              if (err) {
                return res.status(404).send({
                  error: err.message
                });
              }
              data.groups = ld.transform(data.groups,
                function (memo, val, key) {
                  memo[key] = ld.omit(val, 'password');
                }
              );
              data.pads = ld.transform(data.pads,
                function (memo, val, key) {
                  memo[key] = ld.pick(val, '_id', 'name', 'group');
                }
              );
              data.users = ld.transform(data.users, function (memo, val, key) {
                memo[key] = ld.pick(val, '_id', 'login', 'firstname',
                  'lastname', 'email');
              });
              data.admins = ld.transform(data.admins,
                function (memo, val, key) {
                  memo[key] = ld.pick(val, '_id', 'login', 'firstname',
                    'lastname', 'email');
                }
              );
              res.send({ value: data });
            });
          }
          catch (e) {
            res.status(400).send({ error: e.message });
          }
        });
      }
    );

    /**
    * GET method : `group.get` unique id
    *
    * Sample URL:
    * http://etherpad.ndd/mypemailads/api/group/xxxx
    */

    app.get(groupRoute + '/:key', fn.ensureAuthenticated,
      function (req, res, next) {
        var cond = function (val) {
          var isAdmin = (req.session.user && req.session.user.isAdmin);
          var isAllowed = ld.includes(ld.union(val.admins, val.users),
            req.session.mypadsUid);
          return (isAdmin || isAllowed);
        };
        return fn.get(group, req, res, next, cond);
      }
    );

    /**
    * `canEdit` is an asynchronous internal group helper to check common
    * permissions for edit methods used here (set && delete ones). It ensures
    * that the current user is either an Etherpad admin or a group admin.
    *
    * It takes the `req` and `res` request and response Express objects, and a
    * `successFn` function, called if the user is allowed. Otherwise, it uses
    * response to return statusCode and Error messages.
    */

    var canEdit = function (req, res, successFn) {
      var isAdmin = (req.session.user && req.session.user.isAdmin);
      if (isAdmin) { return successFn(); }
      group.get(req.params.key, function (err, g) {
        if (err) { return res.status(400).send({ error: err.message }); }
        var isAllowed = ld.includes(g.admins, req.session.mypadsUid);
        if (isAllowed) {
          return successFn();
        } else {
          return fn.denied(res,
            'BACKEND.ERROR.AUTHENTICATION.DENIED_RECORD_EDIT');
        }
      });
    };

    // `set` for POST and PUT, see below
    var _set = function (req, res) {
      var setFn = ld.partial(group.set, req.body);
      fn.set(setFn, req.body._id, req.body, req, res);
    };

    /**
    * POST method : `group.set` with user value for group creation
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group
    */

    app.post(groupRoute, fn.ensureAuthenticated, _set);

    /**
    * PUT method : `group.set` with group id plus value for existing group
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/xxx
    */

    app.put(groupRoute + '/:key', fn.ensureAuthenticated, function (req, res) {
      canEdit(req, res, ld.partial(_set, req, res));
    });

    /**
    * DELETE method : `group.del` with group id
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/xxxx
    */

    app.delete(groupRoute + '/:key', fn.ensureAuthenticated,
      function (req, res) {
        canEdit(req, res, ld.partial(fn.del, group.del, req, res));
      }
    );

    /**
    * POST method : `group.inviteOrShare` with gid group id, array of all
    * concerned logins and invite boolean
    * This method is open to all authenticated users.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/invite
    */

    app.post(groupRoute + '/invite', fn.ensureAuthenticated,
      function (req, res) {
        if (!req.body.gid) {
          return res.status(400)
            .send({ error: 'BACKEND.ERROR.TYPE.PARAMS_REQUIRED' });
        }
        req.params.key = req.body.gid;
        var successFn = ld.partial(function (req, res) {
          try {
            group.inviteOrShare(req.body.invite, req.body.gid, req.body.logins,
              function (err, g) {
                if (err) {
                  return res.status(401).send({ error: err.message });
                }
                return res.send({ success: true, value: g });
            });
          }
          catch (e) { res.status(400).send({ error: e.message }); }
        }, req, res);
        canEdit(req, res, successFn);
      }
    );

    /**
    * POST method : `group.resign` with gid group id and current session uid.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/resign
    */

    app.post(groupRoute + '/resign', fn.ensureAuthenticated,
      function (req, res) {
        try {
          group.resign(req.body.gid, req.session.mypadsUid, function (err, g) {
            if (err) { return res.status(400).send({ error: err.message }); }
            return res.send({ success: true, value: g });
          });
        }
        catch (e) { return res.status(400).send({ error: e.message }); }
      }
    );

  };

  /**
  * ## Pad API
  *
  * All methods needs special permissions
  */

  var padAPI = function (app) {
    var padRoute = api.initialRoute + 'pad';

    /**
    * `canAct` is a pad internal fucntion that checks permissions to allow or
    * not interaction with the pad object.
    *
    * It takes :
    *
    * - `edit` boolean, if the pad should be only read or updated
    * - `successFn` functional, to be called if allowed, that takes req, res
    *   and value
    * - classic `req`uest and `res`ponse Express objects
    */

    var canAct = function (edit, successFn, req, res) {
      pad.get(req.params.key, function (err, p) {
        if (err) { return res.status(404).send({ error: err.message }); }
        group.get(p.group, function (err, g) {
          if (err) { return res.status(400).send({ error: err.message }); }
          var users = edit ? g.admins : ld.union(g.admins, g.users);
          var isAllowed = ld.includes(users, req.session.mypadsUid);
          var isAdmin = (req.session.user && req.session.user.isAdmin);
          if (isAdmin || isAllowed) {
            return successFn(req, res, p);
          } else {
            var msg = edit ? 'DENIED_RECORD_EDIT' : 'DENIED_RECORD';
            return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.' + msg);
          }
        });
      });
    };

    /**
    * GET method : `pad.get` unique id
    * Only for group admin or users, and global admin
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/xxxx
    */

    app.get(padRoute + '/:key', fn.ensureAuthenticated,
      ld.partial(canAct, false, function (req, res, val) {
        return res.send({ key: req.params.key, value: val });
      }));

    // `set` for POST and PUT, see below
    var _set = function (req, res) {
      var setFn = ld.partial(pad.set, req.body);
      fn.set(setFn, req.body._id, req.body, req, res);
    };

    /**
    * POST method : `pad.set` with user value for pad creation
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad
    */

    app.post(padRoute, fn.ensureAuthenticated, _set);

    /**
    * PUT method : `pad.set` with group id plus value for existing pad
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/xxx
    */

    app.put(padRoute + '/:key', fn.ensureAuthenticated,
      ld.partial(canAct, true, _set));

    /**
    * DELETE method : `pad.del` with pad id
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/xxxx
    */

    app.delete(padRoute + '/:key', fn.ensureAuthenticated,
      ld.partial(canAct, true, ld.partial(fn.del, pad.del)));

  };

  return api;

}).call(this);
