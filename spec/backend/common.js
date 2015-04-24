/**
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/

module.exports = (function () {
  'use strict';
  var ld = require('lodash');
  var storage = require('../../storage.js');
  var common = {};

  /**
  * `reInitDatabase` is a private function aiming to remove the test database
  * file and lets it virgin comme previsous testing before and after all module
  * tests. It also initializes secondary in-memory index.
  */

  common.reInitDatabase = function (done) {
    var unlink = require('fs').unlink;
    var db = require('../../storage.js').db;
    db.close(function () {
      unlink('./test.db', function () {
        db.init(ld.partial(storage.init, done));
      });
    });
  };

  /**
  * `mockupExpressServer` is a private function that launch an Express Server,
  * for local testing. It uses an intern namespace : `common.express`.
  */

  common.mockupExpressServer = function () {
    var express = require('express');
    common.express = {};
    common.express.app = express();
    common.express.server = common.express.app.listen(8042);
    common.express.io = require('socket.io')(common.express.server);
  };

  /**
  * `unmockExpressServer` closes the server launched with `mockupExpressServer`.
  */

  common.unmockExpressServer = function() { common.express.server.close(); };

  return common;
}).call(this);
