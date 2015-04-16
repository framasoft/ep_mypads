/**
*  # Common for functional testing
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
*  Here are shared functions and helpers for client functional testing.
*/

module.exports = (function () {
  var common = {};
  /*
  * ## Helpers
  *
  * Functions helpers for functional testing.
  */

  common.helper = {};

  /**
  * ### fill
  *
  * `fill` is a function, taking an HTML input `el` *Element* and a string
  * `val`ue, that fixes the `val` to the *Element* and dispatches an *input*
  * *KeyboardEvent*. Then mithril *oninput* usage is filled.
  */

  common.helper.fill = function (el, val) {
    el.value = val;
    el.dispatchEvent(new window.KeyboardEvent('input'));
  };

  /**
  * ## user
  *
  * Helpers for `user` testing : profile, login, subscription...
  */

  common.user = {};

  /**
  * ### beforeAll
  *
  * `beforeAll` takes the iframe `app`, `nSel` navigation selector and a
  * `callback` function.
  * It simulates a click on the navigation element and returns generated
  * elements as a JS Object via the callback function.
  */

  common.user.beforeAll = function (app, nSel, callback) {
    app.document.querySelector(nSel).click();
    window.setTimeout(function () {
      var first = function (sel) { return app.document.querySelector(sel); };
      callback({
        form: first('form'),
        password: first('input[name=password]'),
        passwordConfirm: first('input[name=passwordConfirm]'),
        email: first('input[name=email]'),
        firstname: first('input[name=firstname]'),
        lastname: first('input[name=lastname]'),
        organization: first('input[name=organization]'),
        submit: first('input[type=submit]')
      });
    }, 200);
  };

  return common;
}).call(this);
