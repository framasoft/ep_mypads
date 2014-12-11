assert = require 'assert'

describe 'configuration', ->

  describe 'passwordMinimumLength', ->

    it 'should only accept integers', ->
      assert.throws
