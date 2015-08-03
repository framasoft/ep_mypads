/**
*  # Permission Module
*
*  ## License
*
*  Licensed to the Apache Software Foundation (ASF) under one
*  or more contributor license agreements.  See the NOTICE file
*  distributed with this work for additional information
*  regarding copyright ownership.  The ASF licenses this file
*  to you under the Apache License, Version 2.0 (the
*  "License"); you may not use this file except in compliance
*  with the License.  You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing,
*  software distributed under the License is distributed on an
*  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
*  KIND, either express or implied.  See the License for the
*  specific language governing permissions and limitations
*  under the License.
*
*  ## Description
*
*  This module contains all functions about permission for groups and pads,
*  according to authenticated user.
*/

// External dependencies
var ld = require('lodash');
var cuid = require('cuid');
var emailjs = require('emailjs');
// Local dependencies
require('./helpers.js'); // Helpers auto-init
var conf = require('./configuration.js');

module.exports = (function () {
  'use strict';

  var mail = {
    tokens: {},
    ends: {},
    connection: undefined
  };

  /**
  * ## genToken
  *
  * `genToken` is a function that creates a token using *cuid* and populates
  * local in memory store with necessary information. It also fixes maximum
  * time validity for the current token, according to configuration.
  *
  * It takes a mandatory `value` and returns the generated token.
  */

  mail.genToken = function (value) {
    if (ld.isUndefined(value)) {
      throw new TypeError('BACKEND.ERROR.TYPE.PARAMS_REQUIRED');
    }
    var duration = parseFloat(conf.get('tokenDuration')) || 60;
    var ts = Date.now();
    var end = ts + duration * 60 * 1000;
    var token = cuid();
    mail.tokens[token] = value;
    mail.ends[token] = end;
    return token;
  };

  /**
  * ## isValidToken
  *
  * This function checks if, for a given token, expiration has not been
  * reached.
  */

  mail.isValidToken = function (token) {
    return (mail.tokens[token] && (Date.now() < mail.ends[token]));
  };

  /**
  * ## connect
  *
  * `connect` uses SMTP configuration options to connect to the remote SMTP
  * server. It takes a `callback` function on which it returns *true* for
  * success or *error* on failure. If a connection has already been setup, it
  * quits before recreating one. If user and pass are provided, it uses them to
  * login after connection.
  */

  mail.connect = function () {
    var opts = {
      port: parseInt(conf.get('SMTPPort'), 10),
      host: conf.get('SMTPHost'),
      ssl: conf.get('SMTPSSL'),
      tls: conf.get('SMTPTLS'),
      user: conf.get('SMTPUser'),
      password: conf.get('SMTPPass')
    };
    if (!ld.isNumber(opts.port) || !ld.isString(opts.host) ||
      !ld.isBoolean(opts.ssl) || !ld.isBoolean(opts.tls)) {
      throw new TypeError('BACKEND.ERROR.TYPE.SMTP_CONFIG');
    }
    try {
      mail.server = emailjs.server.connect(opts);
    }
    catch (e) { console.log(e); }
  };

  /**
  * ## send
  *
  * `send` is an asynchronous function that sends an email. It takes mandatory
  *
  * - `to`, an email string
  * - `message`, a string containing the text message
  * - a `callback` function
  *
  *   It returns to the callback function *error* if there is, *null* otherwise
  *   and an information object. See smtp-connection for more details.
  */

  mail.send = function (to, subject, message, callback) {
    var err;
    if (!ld.isEmail(to)) {
      throw new TypeError('BACKEND.ERROR.TYPE.TO_MAIL');
    }
    if (!ld.isString(subject)) {
      throw new TypeError('BACKEND.ERROR.TYPE.SUBJECT_STR');
    }
    if (!ld.isString(message)) {
      throw new TypeError('BACKEND.ERROR.TYPE.MSG_STR');
    }
    if (!ld.isFunction(callback)) {
      throw new TypeError('BACKEND.ERROR.TYPE.CALLBACK_FN');
    }
    var emailFrom = conf.get('SMTPEmailFrom');
    if (!mail.server || !emailFrom) {
      err = 'BACKEND.ERROR.CONFIGURATION.MAIL_NOT_CONFIGURED';
      return callback(err);
    }
    var envelope = {
      from: emailFrom,
      to: to,
      subject: subject,
      text: message
    };
    mail.server.send(envelope, callback);
  };

  /**
  * ## init
  *
  * This function gets configuration option to initialize SMTP connection if
  * `SMTPHost` is defined.
  */

  mail.init = function () {
    if (conf.get('SMTPHost')) {
      mail.connect();
    }
  };

  return mail;

}).call(this);
