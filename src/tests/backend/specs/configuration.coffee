assert = require 'assert'
conf = require('../../../configuration.js').configuration

describe 'configuration', ->

    it 'comes with defaults', ->
      assert.equal conf.passwordLength.min, 8
      assert.equal conf.passwordLength.max, 30

  describe 'passwordMinimumLength', ->

    it 'accepts updates for `passwordLength` on `min` and `max` fields', ->
      conf.setPasswordLength min: 12
      assert.equal conf.passwordLength.min, 12
      assert.equal conf.passwordLength.max, 30
      conf.setPasswordLength max: 55, useless: 120
      assert.equal conf.passwordLength.min, 12
      assert.equal conf.passwordLength.max, 55

    it 'checks if min is inferior to max, otherwise reverse automatically', ->
      conf.setPasswordLength min: 8, max: 5
      assert.equal conf.passwordLength.min, 5
      assert.equal conf.passwordLength.max, 8

    it 'does nothing if there is no argument as an object with min or max
      integer fields', ->
      conf.setPasswordLength min: 10, max: 25
      assert.equal conf.passwordLength.min, 10
      assert.equal conf.passwordLength.max, 25
      assert.equal conf.passwordLength.min, 10
      assert.equal conf.passwordLength.max, 25
      conf.setPasswordLength false
      assert.equal conf.passwordLength.min, 10
      assert.equal conf.passwordLength.max, 25
      conf.setPasswordLength an: 'object', with: 'no min nor max'
      assert.equal conf.passwordLength.min, 10
      assert.equal conf.passwordLength.max, 25
