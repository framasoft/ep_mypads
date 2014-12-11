# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
#   http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

assert = require 'assert'

describe 'user', ->

  describe 'creation', ->

    it 'should return a TypeError and a message if either login or password
      aren\'t given', ->
      u = user.create()
      assert.throws -> user.create another: 'object'
      assert.throws -> user.create login: 'johnny'
      assert.throws -> user.create password: 'secret'

    it 'should accept any creation if login and password are fixed', ->
      assert.doesNotThrow ->
        u = user.create login: 'parker', password: 'lovesKubiak'
      u = user.create login: 'parker', password: 'lovesKubiak'
      assertEqual u.login, 'parker'
      assert.ok u.password

  describe 'helpers', ->
