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
  * Otherwise, it will use `req.params.key` to get the database record.
  */

  fn.get = function (module, req, res) {
    try {
      module.get(req.params.key, function (err, val) {
        if (err) {
          return res.status(404).send({
            error: err.message,
            key: req.params.key
          });
        }
        res.send({ key: req.params.key, value: val });
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
  * `ensureAuthenticated` internal is an Express middleware takes `req`,
  * `res` and `next`. It returns error or lets the next middleware go.
  */

  fn.ensureAuthenticated = function (req, res, next) {
    if (!req.isAuthenticated() && !req.session.mypadsLogin) {
      res.status(401).send({ error: 'BACKEND.ERROR.AUTHENTICATION.MUST_BE' });
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
    *
    * TODO: disallow whole configuration when authenticated ~> filter only
    * relevant things if not admin
    */

    app.get(confRoute, function (req, res) {
      var isAuth = (req.isAuthenticated() || !!req.session.mypadsLogin);
      var action = isAuth ? 'all' : 'public';
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
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/configuration/something
    *
    * TODO: same TODO as before
    */

    app.get(confRoute + '/:key', fn.ensureAuthenticated, function (req, res) {
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
    *
    * Sample URL for POST:
    * http://etherpad.ndd/mypads/api/configuration
    * for PUT
    * http://etherpad.ndd/mypads/api/configuration/something
    *
    * TODO: same TODO as before, plus only planned keys?
    */

    var _set = function (req, res) {
      var key = (req.method === 'POST') ? req.body.key : req.params.key;
      var value = req.body.value;
      var setFn = ld.partial(conf.set, key, value);
      fn.set(setFn, key, value, req, res);
    };

    app.post(confRoute, fn.ensureAuthenticated, _set);
    app.put(confRoute + '/:key', fn.ensureAuthenticated, _set);

    /**
    * DELETE method : `configuration.del` key
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/configuration/something
    *
    * TODO: same TODO as before
    */

    app.delete(confRoute + '/:key', fn.ensureAuthenticated,
      ld.partial(fn.del, conf.del));
  };

  /**
  *  ## User API
  *
  * All methods needs `fn.ensureAuthenticated`
  */

  var userAPI = function (app) {
    var userRoute = api.initialRoute + 'user';

    /**
    * GET method : `user.get` login (key)
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.get(userRoute + '/:key', fn.ensureAuthenticated,
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

    app.put(userRoute + '/:key', fn.ensureAuthenticated, _set);

    /**
    * DELETE method : `user.del` with user key/login
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.delete(userRoute + '/:key', fn.ensureAuthenticated,
      ld.partial(fn.del, user.del));

    /**
    * POST method : `user.mark` with user session login, bookmark type and key
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
  * All methods needs `fn.ensureAuthenticated`
  */

  var groupAPI = function (app) {
    var groupRoute = api.initialRoute + 'group';

    /**
    * GET method : `group.getByUser` via user login. passwords are omitted
    * Returns all groups and pads, filtered from sensitive data.
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
      ld.partial(fn.get, group));

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

    app.put(groupRoute + '/:key', fn.ensureAuthenticated, _set);

    /**
    * DELETE method : `group.del` with group id
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/xxxx
    */

    app.delete(groupRoute + '/:key', fn.ensureAuthenticated,
      ld.partial(fn.del, group.del));

    /**
    * POST method : `group.inviteOrShare` with gid group id, array of logins
    * and invite boolean
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/invite
    */

    app.post(groupRoute + '/invite', fn.ensureAuthenticated,
      function (req, res) {
        try {
          group.inviteOrShare(req.body.invite, req.body.gid, req.body.logins,
            function (err, g) {
              if (err) { return res.status(401).send({ error: err.message }); }
              res.send({ success: true, value: g });
          });
        }
        catch (e) { res.status(400).send({ error: e.message }); }
      }
    );

  };

  /**
  * ## Pad API
  *
  * All methods needs `fn.ensureAuthenticated`
  */

  var padAPI = function (app) {
    var padRoute = api.initialRoute + 'pad';

    /**
    * GET method : `pad.get` unique id
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/xxxx
    */

    app.get(padRoute + '/:key', fn.ensureAuthenticated,
      ld.partial(fn.get, pad));

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

    app.put(padRoute + '/:key', fn.ensureAuthenticated, _set);

    /**
    * DELETE method : `pad.del` with pad id
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/xxxx
    */

    app.delete(padRoute + '/:key', fn.ensureAuthenticated,
      ld.partial(fn.del, pad.del));

  };

  return api;

}).call(this);
