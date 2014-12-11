# Configuration Module

## License

Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.

## Description

    isObject = require('underscore').isObject

The `data` is a private holding, at the moment, the configuration. The object
if initialized with defaults but may and will be populated from database. *TODO*

    data = do -> passwordLength: min: 8, max: 30
      
`conf` object is a wrapper to interact with the `data` object.

    conf = {}

`get` and `set` are an eponym functions, getting and setting a key of the
`conf` object. 

    conf.get = (key) -> data[key]
    conf.set = (key, val) -> data[key] = val

`setPasswordLength` is a function taking only one mandatory argument, an
object, for fixing this configuration option with either a `min` or `max`
option. Both `min` and `max` are optional but must be integers if provided.

TODO: remove data sanitization for API usage.

    conf.setPasswordLength = (l) ->
      if isObject l
        for field of conf.get 'passwordLength'
          unless l[field] and parseInt(l[field]) is l[field]
            l[field] = conf.get('passwordLength')[field]
        [l.min, l.max] = [l.max, l.min] if l.min > l.max
        conf.set 'passwordLength', min: l.min, max: l.max
    
## Exports

    exports.configuration = conf
