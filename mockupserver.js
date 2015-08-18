/**
*  licensed to the apache software foundation (asf) under one
*  or more contributor license agreements.  see the notice file
*  distributed with this work for additional information
*  regarding copyright ownership.  the asf licenses this file
*  to you under the apache license, version 2.0 (the
*  "license"); you may not use this file except in compliance
*  with the license.  you may obtain a copy of the license at
*
*    http://www.apache.org/licenses/license-2.0
*
*  unless required by applicable law or agreed to in writing,
*  software distributed under the license is distributed on an
*  "as is" basis, without warranties or conditions of any
*  kind, either express or implied.  see the license for the
*  specific language governing permissions and limitations
*  under the license.
*
*  ## Description
*
*  Express server mockup for development purposes. It initializes all needed
*  stuff for MyPads, except Etherpad itself and creates a first user.
*/

(function () {
  'use strict';

  var hooks = require('./hooks.js');
  var storage = require('./storage.js');
  var api = require('./api.js');
  var mail = require('./mail.js');
  var user = require('./model/user.js');
  var group = require('./model/group.js');
  var pad = require('./model/pad.js');
  var specCommon = require('./spec/backend/common.js');

  specCommon.mockupExpressServer();
  specCommon.reInitDatabase(function () {
    hooks.init(null, null, function () {
      storage.init(function () {
        user.set({
          login: 'frank',
          password: 'reallyLikesGrace',
          email: 'frank@gracefanclub.org'
        }, function (err, frank) {
          if (err) { console.log(err); }
          user.set({
            login: 'parker',
            password: 'lovesKubiak',
            firstname: 'Parker',
            lastname: 'Lewis',
            email: 'parker@lewis.me'
          }, function (err, parker) {
            if (err) { console.log(err); }
            user.set({
              login: 'shelly',
              password: 'feelsGoodWithFrank'
            }, function (err, shelly) {
              if (err) { console.log(err); }
              var opts = {
                crud: 'add',
                login: 'parker',
                name: 'enemies',
                uids: [ frank._id, shelly._id ]
              };
              user.userlist(opts, function (err) {
                if (err) { console.log(err); }
                var g = {
                  name: 'Santa Fe',
                  admin: parker._id,
                  tags: ['cool', 'weird']
                };
                group.set(g, function () {
                  g.name = 'memories';
                  g.visibility = 'public';
                  g.tags = ['cool', 'funky'];
                  group.set(g, function (err, g) {
                    if (err) { console.log(err); }
                    pad.set({ name: 'Loving Annie', group: g._id }, function() {
                      pad.set({ name: 'Watch sync', group: g._id }, function() {
                        g = {
                          name: 'shared notes',
                          admin: parker._id,
                          admins: [ frank._id ],
                          visibility: 'public'
                        };
                        group.set(g, function () {
                          api.init(specCommon.express.app, function () {
                            mail.init();
                            console.log('MockupServer runs on port 8042');
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

}).call(this);
