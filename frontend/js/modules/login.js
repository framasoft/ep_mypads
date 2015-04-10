/**
*  # Login module
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
*  This module contains the login markup.
*/

module.exports = (function () {
  var und = require('underscore');
  var Backbone = require('backbone');
  var conf = require('../configuration.js');

  var login = {};

  /**
  * ## Views
  *
  * `main`, `aside` views.
  * `form`, `field` and `icon` views.
  */

  var view = {};

  var form = Backbone.View.extend({
    tagName: 'section',
    template: und.template($('#login-form').html()),
    initialize: function () { return this; },
    render: function () {
      var html = this.template({ USER: conf.LANG.USER });
      this.$el.html(html);
      this.popov = this.$el.find('i[data-toggle="popover"]');
      this.popov.popover();
      return this;
    },
    remove: function () { this.popov.popover('destroy'); }
  });

  var main = Backbone.ContainerView.extend({
    tagName: 'div',
    className: 'row',
    template: und.template($('#login-layout').html()),
    initialize: function () {
      var html = this.template({ title: conf.server.get('title'), descr: conf.server.get('descr') });
      this.$el.html(html);
      this.append(view.form, '#login-form-container');
    },
    render: function () {
      view.form.render();
      return this;
    }
  });

  login.view = function () {
    view.form = new form();
    //return new main();
    return view.form;
  };

  return login;

}).call(this);
