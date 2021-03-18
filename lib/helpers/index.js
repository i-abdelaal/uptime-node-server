/*
 * This is the helpers index to export all helper functions
 *
 */

// Dependencies
const dep = {};
dep.crypto = require("crypto");
dep.querystring = require("querystring");
dep.https = require("https");
dep.path = require("path");
dep.fs = require("fs");
dep.config = require("./../config");
dep.Twilio = require("./Twilio");
dep.Crypt = require("./Crypt");
dep.Utilities = require("./Utilities");
dep.Template = require("./Template");

// Container
const helpers = {};

// Dependencies injection
helpers.twilio = new dep.Twilio(dep);
helpers.crypt = new dep.Crypt(dep);
helpers.utilities = new dep.Utilities(dep);
helpers.template = new dep.Template(dep);

// Export the module
module.exports = helpers;
