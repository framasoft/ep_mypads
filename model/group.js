/**
* # Group Model
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
*/

module.exports = (function () {
  'use strict';

  // Dependencies
  var ld = require('lodash');
  var storage = require('../storage.js');
  var conf = require('../configuration.js');

  /**
  * ## Description
  *
  * Groups belong to users. Each user can have multiple groups of pads.
  * DBPREFIX is fixed for database key work.
  */

  var group = { DBPREFIX: 'mypads:group:' };

  /**
  * ## Public Functions
  *
  * ### add
  *
  * Adding checks the fields, throws error if needed, set defaults options. As
  * arguments, it takes mandatory :
  *
  * - `params` object, with
  *
  *   - a `name` string that can't be empty
  *   - an `admin` string, the unique key identifying the initial administrator
  *   of the group
  *   - `visibility`, a string defined as *restricted* by default to invited
  *   users. Can be set to *public*, letting non authenticated users access to
  *   all pads in the group with the URL, or *private*, protected by a password
  *   phrase chosen by the administrator
  *   - `readonly`, *false* on creation. If *true*, pads that will be linked to
  *   the group will be set on readonly mode
  *   - `password` string field, only usefull if visibility fixed to private,
  *   by default to an empty string
  *
  * - `callback` function returning error if error, null otherwise and the
  *   group object;
  * - a special `edit` boolean, defaults to *false* for reusing the function for
  *   set (edit) an existing group.
  *
  * `add` sets other defaults
  *
  * - an empty `pads` array, will contain ids of pads attached to the group
  * - an empty `users` array, with ids of users invited to read and/or edit the
  *   pad, for restricted visibility only
  *
  *   Finally, a group object can be represented like :
  *
  * var group = {
  *   name: 'group1',
  *   pads: [ 'padkey1', 'padkey2' ],
  *   admins: [ 'userkey1', 'userkey2' ],
  *   users: [ 'ukey1' ],
  *   visibility: 'restricted' || 'public' || 'private',
  *   password: '',
  *   readonly: false
  * };
  *
  */

  group.add = ld.noop;

  /**
  * ### get
  */

  group.get = ld.noop;

  /**
  * ### set
  */

  group.set = ld.noop;

  /**
  * ### del
  */

  group.del = ld.noop;

  /**
  *  ## Helpers Functions
  *
  *  Helpers here are public functions created to facilitate interaction with
  *  the API.
  */

  group.helpers = {};

  /**
  * ### attachPads
  *  string or array
  */

  group.helpers.attachPads = ld.noop;

  /**
  * ### inviteUsers
  * string or array
  */

  group.helpers.inviteUsers = ld.noop;

  /**
  * ### setAdmins
  * string or array
  */

  group.helpers.setAdmins = ld.noop;

  /**
  * ### setPassword
  * string of false
  */

  group.helpers.setPassword = ld.noop;

  /**
  * ### setPublic
  * boolean
  */

  group.helpers.setPublic = ld.noop;

  /**
  *  ## Internal Functions
  */

  group.fn = {};

  return group;


}).call(this);
