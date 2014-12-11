# Configuration Module

    isObject = require('underscore').isObject

The `configuration` object can be updated by the MyPads administrators, through
the API. The object if initialized with defaults.

    conf =
      passwordLength: min: 8, max: 30
      
`setPasswordLength` is a function taking only one mandatory argument, an
object, for fixing this configuration option with either a `min` or `max`
option. Both `min` and `max` are optional but must be integers if provided.

    conf.setPasswordLength = (l) ->
      if isObject l
        for field of conf.passwordLength
          unless l[field] and parseInt(l[field]) is l[field]
            l[field] = conf.passwordLength[field]
        [l.min, l.max] = [l.max, l.min] if l.min > l.max
        conf.passwordLength = min: l.min, max: l.max
    
## Exports

    exports.configuration = conf
