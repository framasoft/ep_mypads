fs = require 'fs'
{spawn, exec} = require 'child_process'

paths =
  src: 'src'
  dest: './'
  backendTests: 'tests/backend/specs'

option '-w', '--watch', 'Invokes watch with coffee compilation'

# Internal functions

launch = (cmd, args) ->
  runner = spawn cmd, args
  runner.stdout.pipe process.stdout
  runner.stderr.pipe process.stderr
  runner.on 'exit', (code, signal) ->
    process.exit code if code isnt 0

# Tasks
task 'build', 'Build MyPads from src repository', (options) ->
  args = ['-c', '-o', paths.dest]
  args.push '-w' if options.watch
  args.push paths.src
  launch 'coffee', args

task 'test', 'Backend testing with mocha', ->
  launch 'mocha', [paths.backendTests]
