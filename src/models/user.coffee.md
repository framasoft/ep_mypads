# User Model

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
