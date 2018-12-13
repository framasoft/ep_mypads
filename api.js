/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
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

var rFS      = require('fs').readFileSync;
// External dependencies
var ld       = require('lodash');
var passport = require('passport');
var jwt      = require('jsonwebtoken');
var testMode = false;
var express;
try {
  // Normal case : when installed as a plugin
  express = require('ep_etherpad-lite/node_modules/express');
}
catch (e) {
  // Testing case : we need to mock the express dependency
  testMode = true;
  express  = require('express');
}
var settings;
try {
  // Normal case : when installed as a plugin
  settings = require('ep_etherpad-lite/node/utils/Settings');
}
catch (e) {
  // Testing case : we need to mock the express dependency
  if (process.env.TEST_LDAP) {
    settings = {
      'ep_mypads': {
        'ldap': {
          'url': 'ldap://rroemhild-test-openldap',
          'bindDN': 'cn=admin,dc=planetexpress,dc=com',
          'bindCredentials': 'GoodNewsEveryone',
          'searchBase': 'ou=people,dc=planetexpress,dc=com',
          'searchFilter': '(uid={{username}})',
          'properties': {
            'login': 'uid',
            'email': 'mail',
            'firstname': 'givenName',
            'lastname': 'sn'
          },
          'defaultLang': 'fr'
        }
      }
    };
  } else {
    settings = {};
  }
}
var bodyParser        = require('body-parser');
var cookieParser      = require('cookie-parser');
var decode            = require('js-base64').Base64.decode;
// Local dependencies
var conf              = require('./configuration.js');
var mail              = require('./mail.js');
var user              = require('./model/user.js');
var userCache         = require('./model/user-cache.js');
var group             = require('./model/group.js');
var pad               = require('./model/pad.js');
var auth              = require('./auth.js');
var perm              = require('./perm.js');
var common            = require('./model/common.js');

module.exports = (function () {
  'use strict';

  var api          = {};
  api.initialRoute = '/mypads/api/';
  var authAPI;
  var configurationAPI;
  var userAPI;
  var groupAPI;
  var padAPI;
  var cacheAPI;
  var statsAPI;

  /**
  * `init` is the first function that takes an Express app as argument.
  * It initializes authentication, permissions and also all API requirements,
  * particularly mypads routes.
  *
  * It needs to be fast to finish *before* YAJSML plugin (which takes over all
  * requests otherwise and refuse anything apart GET and HEAD HTTP methods.
  * That's why api.init is used without any callback and is called before
  * storage initialization.
  */

  api.init = function (app, callback) {
    // Use this for .JSON storage
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use('/mypads', express.static(__dirname + '/static'));
    if (testMode) {
      // Only allow functional testing in testing mode
      app.use('/mypads/functest', express.static(__dirname + '/spec/frontend'));
    }
    var rFSOpts = { encoding: 'utf8' };
    api.l10n    = {
      mail: {
        de: JSON.parse(rFS(__dirname + '/templates/mail_de.json', rFSOpts)),
        en: JSON.parse(rFS(__dirname + '/templates/mail_en.json', rFSOpts)),
        es: JSON.parse(rFS(__dirname + '/templates/mail_es.json', rFSOpts)),
        fr: JSON.parse(rFS(__dirname + '/templates/mail_fr.json', rFSOpts)),
      }
    };
    auth.init(app);
    authAPI(app);
    configurationAPI(app);
    userAPI(app);
    groupAPI(app);
    padAPI(app);
    cacheAPI(app);
    statsAPI(app);
    perm.init(app);

    /**
    * `index.html` is a simple lodash template
    */
    var idxTpl    = ld.template(rFS(__dirname + '/templates/index.html', rFSOpts));
    var idxHandle = function (req, res) {
      return res.send(idxTpl({ HTMLExtraHead: conf.get('HTMLExtraHead'), hideHelpBlocks: conf.get('hideHelpBlocks') }));
    };
    app.get('/mypads/index.html', idxHandle);
    app.get('/mypads/', idxHandle);

    callback(null);
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
          if (conf.get('allPadsPublicsAuthentifiedOnly')) {
            return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.MUST_BE');
          } else {
            return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.DENIED_RECORD');
          }
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
  * `mailMessage` is an internal helper that computed email templates. It takes
  * the `tpl` key of the template and the `data` needed. Optionally, a
  * `lang`uage can be defined.
  * It returns the computed template.
  */

  fn.mailMessage = function (tpl, data, lang) {
    lang = lang || conf.get('defaultLanguage');
    tpl  = ld.template(api.l10n.mail[lang][tpl]);
    return tpl(data);
  };


  /**
  * `ensureAuthenticated` internal is an Express middleware takes `req`,
  * `res` and `next`. It returns error or lets the next middleware go.
  * It relies on `passport.authenticate` with default strategy : *jwt*.
  */

  fn.ensureAuthenticated = passport.authenticate('jwt', { session: false });

  /**
  * `isAdmin` internal is a function that checks if current connnected user is
  * an Etherpad instance admin or not. It returns a boolean.
  */

  fn.isAdmin = function (req) {
    var token = req.query.auth_token || req.body.auth_token;
    if (!token) { return false; }
    try {
      var jwt_payload = jwt.verify(token, auth.secret);
      var admin       = auth.adminTokens[jwt_payload.login];
      return (admin && (admin.key === jwt_payload.key));
    }
    catch (e) { return false; }
  };

  /**
  * `ensureAdmin` internal is an Express middleware that takes classic `req`,
  * `res` and `next`. It returns an error if the connected user is not
  * an Etherpad instance admin.
  */

  fn.ensureAdmin = function (req, res, next) {
    if (!fn.isAdmin(req)) {
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
    var isAdmin = fn.isAdmin(req);

    var token   = (req.body.auth_token || req.query.auth_token);
    var login   = req.params.key;
    var u       = auth.fn.getUser(token);
    var isSelf  = (u && login === u.login);
    if (isSelf) { req.mypadsLogin = u.login; }

    if (!isAdmin && !isSelf) {
      return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.DENIED');
    } else {
      return next();
    }
  };

  /**
  * ## Authentication API
  */

  authAPI = function (app) {
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
        auth.fn.localFn(req.body.login, req.body.password, function (err, u) {
          if (err) { return res.status(400).send({ error: err.message }); }
          if (!u) {
            var emsg = 'BACKEND.ERROR.AUTHENTICATION.PASSWORD_INCORRECT';
            return res.status(400).send({ error: emsg });
          }
          res.status(200).send({ success: true });
        });
      }
    );

    /**
    * GET method : login/cas, method redirecting to home if auth
    * is a success, plus fixes a `login` session.
    * Only used with CAS authentication
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/auth/login/cas
    */

    app.post(authRoute + '/login/cas', function (req, res) {
      auth.fn.casAuth(req, res, function(err, infos) {
        if (err) { return res.status(400).send({ error: err.message }); }
        // JWTFn false arg = non-admin authentication
        auth.fn.JWTFn(req, infos, false, function (err, u, info) {
          if (err) { return res.status(400).send({ error: err.message }); }
          if (!u) { return res.status(400).send({ error: info.message }); }
          if (u.active) {
            var token = {
              login: u.login,
              key: auth.tokens[u.login].key
            };
            return res.status(200).send({
              success: true,
              user: ld.omit(u, 'password'),
              token: jwt.sign(token, auth.secret)
            });
          } else {
            var msg = 'BACKEND.ERROR.AUTHENTICATION.ACTIVATION_NEEDED';
            return fn.denied(res, msg);
          }
        });
      });
    });

    /**
    * POST method : login, method returning user object minus password if auth
    * is a success, plus fixes a `login` session.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/auth/login
    */

    app.post(authRoute + '/login', function (req, res) {
      var eplAuthorToken;
      if (typeof(req.body.login) !== 'undefined' && typeof(req.cookies['token-'+req.body.login]) !== 'undefined') {
        eplAuthorToken = req.cookies['token-'+req.body.login];
      } else if (typeof(req.cookies.token) !== 'undefined') {
        eplAuthorToken = req.cookies.token;
      }
      auth.fn.JWTFn(req, req.body, false, function (err, u, info) {
        if (err) { return res.status(400).send({ error: err.message }); }
        if (!u) { return res.status(400).send({ error: info.message }); }
        if (u.active) {
          var token = {
            login: u.login,
            key: auth.tokens[u.login].key
          };
          if (!u.eplAuthorToken && typeof(eplAuthorToken) !== 'undefined') {
            u.eplAuthorToken   = eplAuthorToken;
            var uToUpdate      = ld.cloneDeep(u);
            uToUpdate.password = req.body.password;
            user.set(uToUpdate, function (err) {
              if (err) { return res.status(400).send({ error: err.message }); }
              return res.status(200).send({
                success: true,
                user: ld.omit(u, 'password'),
                token: jwt.sign(token, auth.secret)
              });
            });
          } else {
            return res.status(200).send({
              success: true,
              user: ld.omit(u, 'password'),
              token: jwt.sign(token, auth.secret)
            });
          }
        } else {
          var msg = 'BACKEND.ERROR.AUTHENTICATION.ACTIVATION_NEEDED';
          return fn.denied(res, msg);
        }
      });
    });

    /**
    * GET method : logout, method that destroy current cached token
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/auth/logout
    */

    app.get(authRoute + '/logout', fn.ensureAuthenticated, function (req, res) {
      delete auth.tokens[req.mypadsLogin];
      res.status(200).send({ success: true });
    });

    /**
    * POST method : admin login, method that checks credentials and create
    * admin token in case of success
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/auth/admin/login
    */

    app.post(authRoute + '/admin/login', function (req, res) {
      auth.fn.JWTFn(req, req.body, true, function (err, u, info) {
        if (err) { return res.status(400).send({ error: err.message }); }
        if (!u) { return res.status(400).send({ error: info.message }); }
        var token = {
          login: u.login,
          key: auth.adminTokens[u.login].key
        };
        return res.status(200).send({
          success: true,
          token: jwt.sign(token, auth.secret)
        });
      });
    });

    /**
    * GET method : admin logout, method that destroy current admin token
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/auth/admin/logout
    */

    app.get(authRoute + '/admin/logout', fn.ensureAdmin, function (req, res) {
      delete auth.adminTokens[req.mypadsLogin];
      return res.status(200).send({ success: true });
    });

  };

  /**
  * ## Configuration API
  */

  configurationAPI = function (app) {
    var confRoute = api.initialRoute + 'configuration';

    /**
    * GET method : get all configuration plus user info if logged, else config
    * public fields.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/configuration
    */

    app.get(confRoute, function (req, res) {
      var u       = auth.fn.getUser(req.query.auth_token);
      var isAdmin = fn.isAdmin(req);
      var action  = (isAdmin === true) ? 'all' : 'public';
      var value   = conf[action]();
      var resp    = { value: value };
      resp.auth   = isAdmin || !!u;
      if (u) { resp.user = u; }
      /* Fix IE11 stupid habit of caching AJAX calls
       * See http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/
       * and https://framagit.org/framasoft/Etherpad/ep_mypads/issues/220
       */
      res.set('Expires', '-1');
      res.send(resp);
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
      /* Fix IE11 stupid habit of caching AJAX calls
       * See http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/
       * and https://framagit.org/framasoft/Etherpad/ep_mypads/issues/220
       */
      res.set('Expires', '-1');
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
      var key   = (req.method === 'POST') ? req.body.key : req.params.key;
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

    /**
    * GET method
    *
    * Return the value of useFirstLastNameInPads configuration setting
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/configuration/public/usefirstlastname
    */

    app.get(confRoute + '/public/usefirstlastname', function (req, res) {
      return res.send({ success: true, usefirstlastname: conf.get('useFirstLastNameInPads') });
    });

    /**
    * GET method
    *
    * Return the value of allPadsPublicsAuthentifiedOnly configuration setting
    * + given pad's group if allPadsPublicsAuthentifiedOnly is true
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/configuration/public/allpadspublicsauthentifiedonly
    */

    app.get(confRoute + '/public/allpadspublicsauthentifiedonly', function (req, res) {
      var confValue = conf.get('allPadsPublicsAuthentifiedOnly');
      var data      = {
        success: true,
        allpadspublicsauthentifiedonly: confValue
      };
      /* Fix IE11 stupid habit of caching AJAX calls
       * See http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/
       * and https://framagit.org/framasoft/Etherpad/ep_mypads/issues/220
       */
      res.set('Expires', '-1');
      if (confValue) {
        pad.get(req.query.pid, function (err, p) {
          if (err) {
            return res.send({ success: false, error: err });
          }
          data.group = p.group;
          return res.send(data);
        });
      } else {
        return res.send(data);
      }
    });

  };

  /**
  *  ## User API
  *
  * Most methods need `fn.ensureAdminOrSelf`
  */

  userAPI = function (app) {
    var userRoute        = api.initialRoute + 'user';
    var allUsersRoute    = api.initialRoute + 'all-users';
    var searchUsersRoute = api.initialRoute + 'search-users';
    var userlistRoute    = api.initialRoute + 'userlist';

    /**
    * GET method : `user.userlist` with crud fixed to *get* and current login.
    * Returns user userlists
    * ensureAuthenticated needed
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/userlist
    */

    app.get(userlistRoute, fn.ensureAuthenticated,
      function (req, res) {
        var opts = { crud: 'get', login: req.mypadsLogin };
        user.userlist(opts, function (err, u) {
          if (err) { return res.status(400).send({ error: err.message }); }
          /* Fix IE11 stupid habit of caching AJAX calls
           * See http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/
           * and https://framagit.org/framasoft/Etherpad/ep_mypads/issues/220
           */
          res.set('Expires', '-1');
          res.send({ value: u.userlists });
        });
      }
    );

    /**
    * POST method : `user.userlist` creation with crud fixed to *add*, current
    * login and userlist parameters, name and optionnally user logins
    * ensureAuthenticated needed
    *
    * Sample URL :
    * http://etherpad.ndd/mypads/api/userlist
    */

    app.post(userlistRoute, fn.ensureAuthenticated,
      function (req, res) {
        try {
          var users = { absent: [], present: [] };
          var lm    = req.body.loginsOrEmails;
          if (lm) { users = userCache.fn.getIdsFromLoginsOrEmails(lm); }
          var opts = {
            crud: 'add',
            login: req.mypadsLogin,
            name: req.body.name
          };
          if (users.uids) { opts.uids = users.uids; }
          user.userlist(opts, function (err, u) {
            if (err) { return res.status(400).send({ error: err.message }); }
            return res.send({
              success: true,
              value: u.userlists,
              present: users.present,
              absent: users.absent
            });
          });
        }
        catch (e) { return res.status(400).send({ error: e.message }); }
      }
    );

    /**
    * PUT method : `user.userlist` update with crud fixed to *set*, current
    * login, mandatory `ulistid` via request parameter and userlist arguments,
    * `name` or user `logins`
    * ensureAuthenticated needed
    *
    * Sample URL :
    * http://etherpad.ndd/mypads/api/userlist/xxx
    */

    app.put(userlistRoute + '/:key', fn.ensureAuthenticated,
      function (req, res) {
        try {
          var users = { absent: [], present: [] };
          var lm    = req.body.loginsOrEmails;
          if (lm) { users = userCache.fn.getIdsFromLoginsOrEmails(lm); }
          var opts = {
            crud: 'set',
            login: req.mypadsLogin,
            ulistid: req.params.key,
            name: req.body.name
          };
          if (users.uids) { opts.uids = users.uids; }
          user.userlist(opts, function (err, u) {
            if (err) { return res.status(400).send({ error: err.message }); }
            return res.send({
              success: true,
              value: u.userlists,
              present: users.present,
              absent: users.absent
            });
          });
        }
        catch (e) { return res.status(400).send({ error: e.message }); }
      }
    );

    /**
    * DELETE method : `user.userlist` removal with crud fixed to *del*, current
    * login, mandatory `ulistid` via request parameter
    * ensureAuthenticated needed
    *
    * Sample URL :
    * http://etherpad.ndd/mypads/api/userlist/xxx
    */

    app.delete(userlistRoute + '/:key', fn.ensureAuthenticated,
      function (req, res) {
        try {
          var opts = {
            crud: 'del',
            login: req.mypadsLogin,
            ulistid: req.params.key
          };
          user.userlist(opts, function (err, u) {
            if (err) { return res.status(400).send({ error: err.message }); }
            res.send({ success: true, value: u.userlists });
          });
        }
        catch (e) { return res.status(400).send({ error: e.message }); }
      }
    );


    /**
    * GET method : `user.get` login (key)
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/user/someone
    */

    app.get(userRoute + '/:key', fn.ensureAdminOrSelf,
      ld.partial(fn.get, user));

    /**
    * GET method : get all users from cache
    *
    * exemple: {
    *   usersCount: 1,
    *   users: {
    *     foo: {
    *       email: foo@bar.org,
    *       firstname: Foo,
    *       lastname: Bar
    *     }
    *   }
    * }
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/all-users
    */

    app.get(allUsersRoute, fn.ensureAdmin,
      function (req, res) {
        var emails  = ld.reduce(userCache.emails, function (result, n, key) {
          result[n] = key;
          return result;
        }, {});
        var users = ld.reduce(userCache.logins, function (result, n, key) {
          result[key] = {
            email: emails[n],
            firstname: userCache.firstname[n],
            lastname: userCache.lastname[n]
          };
          return result;
        }, {});
        res.send({ users: users, usersCount: ld.size(users) });
      }
    );

    /**
    * GET method : search users from their firstname, lastname, login or email
    *
    * exemple: {
    *   usersCount: 1,
    *   users: {
    *     foo: {
    *       email: foo@bar.org,
    *       firstname: Foo,
    *       lastname: Bar
    *     }
    *   }
    * }
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/search-users/parker
    */

    app.get(searchUsersRoute + '/:key', fn.ensureAdmin,
      function (req, res) {
        var users = userCache.fn.searchUserInfos(req.params.key);
        res.send({ users: users, usersCount: ld.size(users) });
      }
    );

    // `set` for POST and PUT, see below
    var _set = function (req, res) {
      var key;
      var value = req.body;
      var stop;
      if (req.method === 'POST' && !fn.isAdmin(req)) {
        if (conf.isNotInternalAuth() || !conf.get('openRegistration')) {
          stop = true;
          res.status(400).send({ error: 'BACKEND.ERROR.AUTHENTICATION.NO_REGISTRATION' });
        } else {
          key = req.body.login;
          if (conf.get('checkMails')) {
            var token = mail.genToken({ login: key, action: 'accountconfirm' });
            var url   = conf.get('rootUrl') +
              '/mypads/index.html?/accountconfirm/' + token;
            console.log(url);
            var lang = (function () {
              if (ld.includes(ld.keys(conf.cache.languages), req.body.lang)) {
                return req.body.lang;
              } else {
                return conf.get('defaultLanguage');
              }
            })();
            var subject = fn.mailMessage('ACCOUNT_CONFIRMATION_SUBJECT', {
              title: conf.get('title') });
            var message = fn.mailMessage('ACCOUNT_CONFIRMATION', {
              login: key,
              title: conf.get('title'),
              url: url,
              duration: conf.get('tokenDuration')
            }, lang);
            mail.send(req.body.email, subject, message, function (err) {
              if (err) {
                stop = true;
                return res.status(501).send({ error: err });
              }
            }, lang);
          }
        }
      } else {
        key         = req.params.key;
        value.login = req.body.login || key;
        value._id   = userCache.logins[key];
      }
      // Update needed session values
      if (!stop) {
        var u = auth.fn.getUser(req.body.auth_token);
        if (u && !fn.isAdmin(req)) {
          auth.tokens[u.login].color = req.body.color || u.color;
          if (!ld.isUndefined(req.body.useLoginAndColorInPads)) {
            auth.tokens[u.login].useLoginAndColorInPads = req.body.useLoginAndColorInPads;
          }
        }
        if (fn.isAdmin(req) && req.method !== 'POST') {
          delete value.auth_token;
          delete value.passwordConfirm;
          user.get(value.login, function (err, u) {
            if (err) { return res.status(400).send({ error: err.message }); }
            if (value.password) {
              common.hashPassword(null, value.password, function (err, pass) {
                if (err) { return res.status(400).send({ error: err }); }

                value.password = pass;
                ld.assign(u, value);
                var setFn = ld.partial(user.fn.set, u);
                fn.set(setFn, key, u, req, res);
              });
            } else {
              ld.assign(u, value);
              var setFn = ld.partial(user.fn.set, u);
              fn.set(setFn, key, u, req, res);
            }
          });
        } else {
          var setFn = ld.partial(user.set, value);
          fn.set(setFn, key, value, req, res);
        }
      }
    };

    /**
    * POST method : `user.set` with user value for user creation
    * Only method without permission verification
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
      var isSelf = (req.params.key === req.mypadsLogin);
      if (isSelf) { delete auth.tokens[req.mypadsLogin]; }
      fn.del(user.del, req, res);
    });

    /**
    * POST method : `user.mark` with user session login, bookmark type and key
    * Only need ensureAuthenticated because use own login for marking
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/usermark
    */

    app.post(userRoute + 'mark', fn.ensureAuthenticated,
      function (req, res) {
        try {
          user.mark(req.mypadsLogin, req.body.type, req.body.key,
            function (err) {
              if (err) { return res.status(404).send({ error: err.message }); }
              res.send({ success: true });
            }
          );
        }
        catch (e) { res.status(400).send({ error: e.message }); }
      }
    );

    /**
    * POST method : special password recovery with mail sending.
    * Need to have the email address into the body
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/passrecover
    */

    app.post(api.initialRoute + 'passrecover', function (req, res) {
      var email = req.body.email;
      var err;
      if (conf.isNotInternalAuth()) {
        err = 'BACKEND.ERROR.AUTHENTICATION.NO_RECOVER';
        return res.status(400).send({ error: err });
      }
      if (!ld.isEmail(email)) {
        err = 'BACKEND.ERROR.TYPE.MAIL';
        return res.status(400).send({ error: err });
      }
      if (!userCache.emails[email]) {
        err = 'BACKEND.ERROR.USER.NOT_FOUND';
        return res.status(404).send({ error: err });
      }
      if (conf.get('rootUrl').length === 0) {
        err = 'BACKEND.ERROR.CONFIGURATION.ROOTURL_NOT_CONFIGURED';
        return res.status(501).send({ error: err });
      }
      user.get(email, function (err, u) {
        if (err) { return res.status(400).send({ error: err }); }
        var token = mail.genToken({ login: u.login, action: 'passrecover' });
        console.log(conf.get('rootUrl') + '/mypads/index.html?/passrecover/' +
          token);
        var subject = fn.mailMessage('PASSRECOVER_SUBJECT', {
          title: conf.get('title') }, u.lang);
        var message = fn.mailMessage('PASSRECOVER', {
          login: u.login,
          title: conf.get('title'),
          url: conf.get('rootUrl') + '/mypads/index.html?/passrecover/' + token,
          duration: conf.get('tokenDuration')
        }, u.lang);
        mail.send(u.email, subject, message, function (err) {
          if (err) { return res.status(501).send({ error: err }); }
          return res.send({ success: true });
        });
      });
    });

    /**
    * PUT method : password recovery with token and new password
    * Need to have the login into the body
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/passrecover
    */

    app.put(api.initialRoute + 'passrecover/:token', function (req, res) {
      var err;
      var val       = mail.tokens[req.params.token];
      var badLogin  = (!val || !val.login || !userCache.logins[val.login]);
      var badAction = (!val || !val.action || (val.action !== 'passrecover'));
      if (conf.isNotInternalAuth()) {
        err = 'BACKEND.ERROR.AUTHENTICATION.NO_RECOVER';
        return res.status(400).send({ error: err });
      }
      if (badLogin || badAction) {
        err = 'BACKEND.ERROR.TOKEN.INCORRECT';
        return res.status(400).send({ error: err });
      }
      if (!mail.isValidToken(req.params.token)) {
        err = 'BACKEND.ERROR.TOKEN.EXPIRED';
        return res.status(400).send({ error: err });
      }
      var pass  = req.body.password;
      var passC = req.body.passwordConfirm;
      if (!pass || (pass !== passC)) {
        err = 'USER.ERR.PASSWORD_MISMATCH';
        return res.status(400).send({ error: err });
      }
      user.get(val.login, function (err, u) {
        if (err) { return res.status(400).send({ error: err.message }); }
        u.password = pass;
        if (!u.active) { u.active = true; }
        user.set(u, function (err) {
          if (err) { return res.status(400).send({ error: err.message }); }
          res.send({ success: true, login: val.login });
        });
      });
    });

    /**
    * POST method : account confirmation with token on body
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/accountconfirm
    */

    app.post(api.initialRoute + 'accountconfirm', function (req, res) {
      var val = mail.tokens[req.body.token];
      var err;
      if (conf.isNotInternalAuth()) {
        err = 'BACKEND.ERROR.AUTHENTICATION.NO_RECOVER';
        return res.status(400).send({ error: err });
      }
      if (!val || !val.action || (val.action !== 'accountconfirm')) {
        err = 'BACKEND.ERROR.TOKEN.INCORRECT';
        return res.status(400).send({ error: err });
      }
      if (!mail.isValidToken(req.body.token)) {
        err = 'BACKEND.ERROR.TOKEN.EXPIRED';
        return res.status(400).send({ error: err });
      }
      user.get(val.login, function (err, u) {
        if (err) { return res.status(400).send({ error: err.message }); }
        u.active = true;
        user.fn.set(u, function (err) {
          if (err) { return res.status(400).send({ error: err.message }); }
          res.send({ success: true, login: val.login });
        });
      });
    });

  };

  /**
  * ## Group API
  *
  * All methods except creation need special permissions.
  */

  groupAPI = function (app) {
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
        user.get(req.mypadsLogin, function (err, u) {
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
                  memo[key] = ld.omit(val, 'password');
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
              data.bookmarks = { groups: {}, pads: {} };
              group.getBookmarkedGroupsByUser(u, function (err, bookmarks) {
                if (err) {
                  return res.status(404).send({
                    error: err.message
                  });
                }
                data.bookmarks.groups = ld.transform(bookmarks,
                  function (memo, val, key) {
                    memo[key] = ld.omit(val, 'password');
                  }
                );
                pad.getBookmarkedPadsByUser(u, function (err, bookmarks) {
                  if (err) {
                    return res.status(404).send({
                      error: err.message
                    });
                  }
                  data.bookmarks.pads = ld.transform(bookmarks,
                    function (memo, val, key) {
                      memo[key] = ld.omit(val, 'password');
                    }
                  );
                  /* Fix IE11 stupid habit of caching AJAX calls
                   * See http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/
                   * and https://framagit.org/framasoft/Etherpad/ep_mypads/issues/220
                   */
                  res.set('Expires', '-1');
                  res.send({ value: data });
                });
              });
            });
          }
          catch (e) {
            res.status(400).send({ error: e.message });
          }
        });
      }
    );

    /**
    * GET method : `group.getWithPads` unique id
    * Returns pads too because useful for public groups and unauth users.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/xxxx
    */

    app.get(groupRoute + '/:key', function (req, res) {
      try {
        var key = req.params.key;
        group.getWithPads(key, function (err, g, pads) {
          if (err) {
            return res.status(404).send({ key: key, error: err.message });
          }
          var u                  = auth.fn.getUser(req.query.auth_token);
          var isAdmin            = fn.isAdmin(req);
          var isUser             = (u && ld.includes(ld.union(g.admins, g.users), u._id));
          var isAllowedForPublic = (g.visibility === 'public');

          // allPadsPublicsAuthentifiedOnly feature
          if (conf.get('allPadsPublicsAuthentifiedOnly')) {
            isAllowedForPublic = false;
            if (u && !isAdmin) {
              isUser = true;
            }
          }

          if (isAllowedForPublic && !isAdmin && !isUser) {
            pads = ld.transform(pads, function (memo, p, key) {
              if (!p.visibility || p.visibility === g.visibility) {
                memo[key] = p;
              }
            });
          }
          if (isAdmin || isUser || isAllowedForPublic) {
            return res.send({ key: key, value: g, pads: pads });
          }
          var isPrivate = (g.visibility === 'private' && !conf.get('allPadsPublicsAuthentifiedOnly'));
          if (isPrivate) {
            if (req.query.password) {
              var pwd = (ld.isUndefined(req.query.password)) ? undefined : decode(req.query.password);
              auth.fn.isPasswordValid(g, pwd,
                function (err, valid) {
                  if (!err && !valid) {
                    err = { message: 'BACKEND.ERROR.PERMISSION.UNAUTHORIZED' };
                  }
                  if (err) {
                    return res.status(401)
                      .send({ key: key, error: err.message });
                  }
                  if (isPrivate && !isAdmin && !isUser) {
                    pads = ld.transform(pads, function (memo, p, key) {
                      if (!p.visibility || p.visibility === g.visibility) {
                        memo[key] = p;
                      }
                    });
                  }
                  return res.send({ key: key, value: g, pads: pads });
                }
              );
            } else {
              var value = ld.pick(g, 'name', 'visibility');
              return res.send({ key: req.params.key, value: value });
            }
          } else {
            if (conf.get('allPadsPublicsAuthentifiedOnly')) {
              return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.MUST_BE');
            } else {
              return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.DENIED_RECORD');
            }
          }
        });
      }
      catch (e) { res.status(400).send({ error: e.message }); }
    });

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
      var isAdmin = fn.isAdmin(req);
      if (isAdmin) { return successFn(); }
      var u = auth.fn.getUser(req.body.auth_token);
      if (!u) {
        return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.NOT_AUTH');
      }
      group.get(req.params.key, function (err, g) {
        if (err) { return res.status(400).send({ error: err.message }); }
        var isAllowed = ld.includes(g.admins, auth.tokens[u.login]._id);
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

    app.post(groupRoute, function (req, res) {
      var isAdmin = fn.isAdmin(req);
      var u = auth.fn.getUser(req.body.auth_token);
      if (!u && !isAdmin) {
        return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.NOT_AUTH');
      }
      if (!isAdmin) { req.body.admin = u._id; }
      _set(req, res);
    });

    /**
    * PUT method : `group.set` with group id plus value for existing group
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/xxx
    */

    app.put(groupRoute + '/:key', function (req, res) {
      canEdit(req, res, ld.partial(_set, req, res));
    });

    /**
    * DELETE method : `group.del` with group id
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/xxxx
    */

    app.delete(groupRoute + '/:key', function (req, res) {
        canEdit(req, res, ld.partial(fn.del, group.del, req, res));
      }
    );

    /**
    * POST method : `group.inviteOrShare` with gid group id, array of all
    * concerned loginsOrEmails and invite boolean
    * This method is open to all authenticated users.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/invite
    */

    app.post(groupRoute + '/invite', function (req, res) {
      if (!req.body.gid) {
        return res.status(400)
          .send({ error: 'BACKEND.ERROR.TYPE.PARAMS_REQUIRED' });
      }
      req.params.key = req.body.gid;
      var successFn = ld.partial(function (req, res) {
        try {
          group.inviteOrShare(req.body.invite, req.body.gid,
            req.body.loginsOrEmails, function (err, g, uids) {
              if (err) {
                return res.status(401).send({ error: err.message });
              }
              return res.send(ld.assign({ success: true, value: g }, uids));
          });
        }
        catch (e) { res.status(400).send({ error: e.message }); }
      }, req, res);
      canEdit(req, res, successFn);
    });

    /**
    * POST method : `group.resign` with gid group id and current session uid.
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/group/resign
    */

    app.post(groupRoute + '/resign', fn.ensureAuthenticated,
      function (req, res) {
        try {
          group.resign(req.body.gid, auth.tokens[req.mypadsLogin]._id,
            function (err, g) {
              if (err) { return res.status(400).send({ error: err.message }); }
              return res.send({ success: true, value: g });
            }
          );
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

  padAPI = function (app) {
    var padRoute = api.initialRoute + 'pad';

    /**
    * `canAct` is a pad internal function that checks permissions to allow or
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
        var key = req.params.key;
        if (err) { return res.status(404).send({ error: err.message }); }
        var isAdmin = fn.isAdmin(req);
        if (isAdmin) { return successFn(req, res, p); }

        // allPadsPublicsAuthentifiedOnly feature
        if (conf.get('allPadsPublicsAuthentifiedOnly') && req.route.method === 'get') {
          var token = req.body.auth_token || req.query.auth_token;
          var u     = auth.fn.getUser(token);
          return (!u) ? fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.MUST_BE') : successFn(req, res, p);
        }

        if (!edit && (p.visibility === 'public')) {
          return successFn(req, res, p);
        }
        if (!edit && (p.visibility === 'private')) {
          var pwd = (ld.isUndefined(req.query.password)) ? undefined : decode(req.query.password);
          auth.fn.isPasswordValid(p, pwd, function (err, valid) {
            if (!err && !valid) {
              err = { message: 'BACKEND.ERROR.PERMISSION.UNAUTHORIZED' };
            }
            if (err) {
              return res.status(401).send({ key: key, error: err.message });
            }
            return successFn(req, res, p);
          });
        } else {
          group.get(p.group, function (err, g) {
            if (err) { return res.status(400).send({ error: err.message }); }
            if (!edit && (g.visibility === 'public')) {
              return successFn(req, res, p);
            } else if (!edit && (g.visibility === 'private')) {
              var pwd = (ld.isUndefined(req.query.password)) ? undefined : decode(req.query.password);
              auth.fn.isPasswordValid(g, pwd,
                function (err, valid) {
                  if (!err && !valid) {
                    err = { message: 'BACKEND.ERROR.PERMISSION.UNAUTHORIZED' };
                  }
                  if (err) {
                    return res.status(401)
                      .send({ key: key, error: err.message });
                  }
                  return successFn(req, res, p);
                }
              );
            } else {
              var token = req.body.auth_token || req.query.auth_token;
              var u     = auth.fn.getUser(token);
              if (!u) {
                return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.MUST_BE');
              }
              var users     = edit ? g.admins : ld.union(g.admins, g.users);
              var uid       = auth.tokens[u.login]._id;
              var isAllowed = ld.includes(users, uid);
              if (isAllowed) {
                return successFn(req, res, p);
              } else {
                var msg = edit ? 'DENIED_RECORD_EDIT' : 'DENIED_RECORD';
                return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.' + msg);
              }
            }
          });
        }
      });
    };

    /**
    * GET method : `pad.get` unique id
    * Only for group admin or users, and global admin
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/xxxx
    */

    // TODO: + admin, no pass needed...
    app.get(padRoute + '/:key',
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

    app.post(padRoute, function (req, res) {
      var isAdmin = fn.isAdmin(req);
      var u;
      if (!isAdmin) { u = auth.fn.getUser(req.body.auth_token); }
      if (!isAdmin && !u) {
        return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.NOT_AUTH');
      }
      if (isAdmin) {
        _set(req, res);
      } else {
        if (req.body.group) {
          group.get(req.body.group, function (err, g) {
            if (err) {
              if (ld.isEqual(err, new Error('BACKEND.ERROR.CONFIGURATION.KEY_NOT_FOUND'))) {
                err = 'BACKEND.ERROR.PAD.ITEMS_NOT_FOUND';
              }
              return res.status(400).send({ success: false, error: err });
            }
            if (ld.isUndefined(g)) {
              return res.status(400).send({ success: false, error: 'BACKEND.ERROR.PAD.ITEMS_NOT_FOUND'});
            } else {
              if (ld.indexOf(g.admins, u._id) !== -1 ||
                (g.allowUsersToCreatePads && ld.indexOf(g.users, u._id) !== -1)) {
                _set(req, res);
              } else {
                return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.DENIED');
              }
            }
          });
        } else {
          return res.status(400).send({ success: false, error: 'BACKEND.ERROR.TYPE.PARAM_STR'});
        }
      }
    });

    /**
    * PUT method : `pad.set` with group id plus value for existing pad
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/xxx
    */

    app.put(padRoute + '/:key', ld.partial(canAct, true, _set));

    /**
    * DELETE method : `pad.del` with pad id
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/xxxx
    */

    app.delete(padRoute + '/:key', function (req, res) {
      var isAdmin = fn.isAdmin(req);
      var u;
      if (!isAdmin) { u = auth.fn.getUser(req.body.auth_token); }
      if (!isAdmin && !u) {
        return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.NOT_AUTH');
      }
      canAct(true, ld.partial(fn.del, pad.del), req, res);
    });

    /**
    * DELETE method : `pad.delChatHistory` with pad id
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/chathistory/xxxx
    */

    app.delete(padRoute + '/chathistory/:key', function (req, res) {
      var isAdmin = fn.isAdmin(req);
      var u;
      if (!isAdmin) { u = auth.fn.getUser(req.body.auth_token); }
      if (!isAdmin && !u) {
        return fn.denied(res, 'BACKEND.ERROR.AUTHENTICATION.NOT_AUTH');
      }
      canAct(true, ld.partial(fn.del, pad.delChatHistory), req, res);
    });

    /**
    * GET method : with pad id
    *
    * Return true if the pad is public
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/pad/ispublic/xxxx
    */

    app.get(padRoute + '/ispublic/:key', function (req, res) {
      pad.get(req.params.key, function(err, p) {
        if (err) {
          return res.send({ success: false, error: err });
        } else if (p.visibility !== null) {
          return res.send({ success: true, key: req.params.key, ispublic: (p.visibility === 'public') });
        } else {
          group.get(p.group, function(err, g) {
            if (err) { return res.send({ success: false, error: err }); }
            return res.send({ success: true, key: req.params.key, ispublic: (g.visibility === 'public') });
          });
        }
      });
    });
  };

  cacheAPI = function (app) {
    var cacheRoute = api.initialRoute + 'cache';

    /**
    * GET method : check, method returning information about the end of users
    * cache loading
    *
    * exemple: { "userCacheReady": true }
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/cache/check
    */

    app.get(cacheRoute + '/check', function (req, res) {
      return res.send({ userCacheReady: userCache.userCacheReady });
    });

  };

  statsAPI = function (app) {
    var statsRoute = api.initialRoute + 'stats';

    /**
    * GET method : stats.json, method returning some stats about MyPads
    * instance usage
    *
    * exemple: { "timestamp":1524035674, "users":3, "pad":3, "groups":3 }
    *
    * Sample URL:
    * http://etherpad.ndd/mypads/api/stats/stats.json
    */

    app.get(statsRoute + '/stats.json', function (req, res) {
      var time = Math.floor(Date.now() / 1000);

      pad.count(function(err, pcount) {
        if (err) { return res.send({ timestamp: time, err: err }); }
        group.count(function(err, gcount) {
          if (err) { return res.send({ timestamp: time, err: err }); }
          return res.send({
            timestamp: time,
            users: ld.size(userCache.logins),
            pad: pcount,
            groups: gcount
          });
        });
      });
    });
  };

  return api;

}).call(this);
