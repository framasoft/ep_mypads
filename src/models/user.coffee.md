# User Model

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

The `user` is the masterpiece of the MyPads plugin. It's defined by :

* required
  * login
  * password
* optional
  * firstname
  * lastname
  * organization.

    user = {}
    
The creation sets the defaults and checks if required fields have been fixed.
It takes a parameters object and a callback function. This callback function
will be called with an Error or null and the newly created user.

    user.create = (params, callback) ->
 
The modification of an user can be done for every field.

    user.update = (params) ->

## Helpers
    
    user.helpers = {}

`checkPassword` is a private helper whose the aims are :

* respecting the minimum length fixed into MyPads configuration
* allowing only string.
 
It returns an error message if the verification has failed.

    user.helpers._checkPassword = (password) ->

`hashPassword` takes the password and returns a hashed password, for storing in
database and verification.

    user.helpers.hashPassword = ->

## Exports

    exports.user = user
