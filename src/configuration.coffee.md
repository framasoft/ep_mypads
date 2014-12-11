# Configuration Module

The `configuration` object can be updated by the MyPads administrators, through
the API. The object if initialized with defaults.

    configuration =
      passwordMinimumLength = 8
      
`setPasswordMinimumLength` is a function taking only one mandatory argument, an
integer, for fixing this configuration option.

    configuration.setPasswordMinimumLength = ->
