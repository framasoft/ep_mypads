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
conf = require('../../../configuration.js').configuration

describe 'configuration', ->

  it 'comes with defaults', ->
    assert.equal conf.get('passwordLength').min, 8
    assert.equal conf.get('passwordLength').max, 30

  describe 'get', ->
    
    it 'returns the value of the field', ->
      assert.equal conf.get('passwordLength').min, 8
      assert.equal conf.get('inexistent'), undefined

  describe 'set', ->
    
    it 'just sets a key for the conf object with the given value', ->
      conf.set 'key', 'value'
      conf.set 'array', [1, 2, 3]
      assert.equal conf.get('key'), 'value'
      assert.equal conf.get('array').length, 3

  describe 'passwordLength', ->

    it 'accepts updates for `passwordLength` on `min` and `max` fields', ->
      conf.setPasswordLength min: 12
      assert.equal conf.get('passwordLength').min, 12
      assert.equal conf.get('passwordLength').max, 30
      conf.setPasswordLength max: 55, useless: 120
      assert.equal conf.get('passwordLength').min, 12
      assert.equal conf.get('passwordLength').max, 55

    it 'checks if min is inferior to max, otherwise reverse automatically', ->
      conf.setPasswordLength min: 8, max: 5
      assert.equal conf.get('passwordLength').min, 5
      assert.equal conf.get('passwordLength').max, 8

    it 'does nothing if there is no argument as an object with min or max
      integer fields', ->
      conf.setPasswordLength min: 10, max: 25
      assert.equal conf.get('passwordLength').min, 10
      assert.equal conf.get('passwordLength').max, 25
      assert.equal conf.get('passwordLength').min, 10
      assert.equal conf.get('passwordLength').max, 25
      conf.setPasswordLength false
      assert.equal conf.get('passwordLength').min, 10
      assert.equal conf.get('passwordLength').max, 25
      conf.setPasswordLength an: 'object', with: 'no min nor max'
      assert.equal conf.get('passwordLength').min, 10
      assert.equal conf.get('passwordLength').max, 25
