module.exports = (function () {
  'use strict';
  var db;
  try {
    // Normal case : when installed as a plugin
    db = require('ep_etherpad-lite/node/db/DB').db;
  }
  catch (e) {
    /**
    * Testing case : we need to mock the database connection, using ueberDB and
    * coherent default configuration with eptherpad-lite one.
    */
    var ueberDB = require('ueberDB');
    db = new ueberDB.database('dirty', { filename: './test.db' });
    db.init(function (err) {});
  }

  return db;
}).call(this);
