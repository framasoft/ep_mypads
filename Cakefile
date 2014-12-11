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
