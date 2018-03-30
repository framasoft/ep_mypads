/**
*  vim:set sw=2 ts=2 sts=2 ft=javascript expandtab:
*
*  # Helpers Module
*
*  This module contains all transversal helpers functions.
*/

module.exports = (function () {
  'use strict';

  // Dependencies
  var ld = require('lodash');

  /**
  * ## lodash mixins
  *
  * Here are lodash user extensions for MyPads.
  *
  * ### isEmail
  *
  * `isEmail` checks if given string is an email or not. It takes a value and
  * returns a boolean.
  *
  * For reference, used regular expression is :
  * /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  */

  ld.mixin({ isEmail: function (val) {
    var rg = new RegExp(['[a-z0-9!#$%&\'*+/=?^_`{|}~-]+',
      '(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9]',
      '(?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9]',
      '(?:[a-z0-9-]*[a-z0-9])?'].join(''), 'i');
    return (ld.isString(val) && rg.test(val));
  }});

}).call(this);
