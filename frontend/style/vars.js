/**
*  # CSS Variables
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
*  This module contains all variables, for easy updates.
*/

module.exports = (function () {

  var vars = {};

  /**
  * `colors` are hexadicemal colors for base and all themes. There are by
  * default chosen from [framacss](https://framalab.org/framacss/).
  */

  vars.color = {
    lightest: '#fafafa',
    light: '#f5f5f5',
    lightgrey: '#e0e0e0',
    grey: '#949494',
    dark: '#333333',
    purplelight: '#d3c5e8',
    purplemidlight: '#9876cc',
    purplemid: '#8157c2',
    purple: '#6a5687',
    purpledark: '#635182',
    purpledarkest: '#3e3363',
    red: '#cc2d18',
    redlight: '#f9bdbb',
    yellowlight: '#fff8e3',
    yellow: '#ffcf4f',
    yellowdark: '#c47e1b',
    yellowdarkest: '#a15014',
    green: '#b3cc66',
    bluelight: '#83c9d6'
  };

  /*
  * `font` contains global fonts variables.
  */

  vars.font = {
    size: '1em',
    family: 'DejaVu Sans, Verdana, sans-serif'
  };

  /*
  * `media` are for variables into media queries.
  * We are using mobile first styles.
  */

  vars.media = {
    desktop: '(min-width: 60em)',
    largetablet: '(min-width: 50em)',
    tablet: '(min-width: 40em)'
  };

  return vars;

}).call(this);
