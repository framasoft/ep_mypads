assert = require 'assert'

describe 'user', ->

  describe 'creation', ->

    it 'should return a TypeError and a message if either login or password
      aren\'t given', ->
      u = user.create()
      assert.throws -> user.create another: 'object'
      assert.throws -> user.create login: 'johnny'
      assert.throws -> user.create password: 'secret'

    it 'should accept any creation if login and password are fixed' ->
      assert.doesNotThrow ->
        u = user.create login: 'parker', password: 'lovesKubiak'
      u = user.create login: 'parker', password: 'lovesKubiak'
      assertEqual u.login, 'parker'
      assert.ok u.password

  describe 'helpers', ->
