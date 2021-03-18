/*
 * This is the handlers index to export all request handlers
 *
 */

const helpers = require("./../helpers");

// Dependencies
const dep = {};
dep.helpers = require("./../helpers");
dep.config = require("./../config");
dep._data = require("./../data");
dep.Tokens = require("./Tokens");
dep.Users = require("./Users");

dep.Checks = require("./Checks");

// Dependencies Injection
// _tokens need to be initialized first so that it can be used as a dependency
dep._tokens = new dep.Tokens(dep);
const _users = new dep.Users(dep);
const _checks = new dep.Checks(dep);

// Container
const handlers = {};

/*
 * HTML Handlers
 */

// Index handler
handlers.index = function (data, callback) {
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Read in a template as a string
    dep.helpers.template.get("index", function (err, str) {
      if (!err && str) {
        callback(200, str, "html");
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

/*
 * JSON API Handlers
 */

// Define main handler function
const routeHandler = function (route) {
  return function (data, callback) {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
      try {
        route[data.method](data, callback);
      } catch (e) {
        callback(404);
      }
    } else {
      callback(405);
    }
  };
};

// Users handler
handlers.users = routeHandler(_users);

// Tokens handler
handlers.tokens = routeHandler(dep._tokens);

// Checks handler
handlers.checks = routeHandler(_checks);

// Ping handler
handlers.ping = function (data, callback) {
  // Callback http status code and payload object
  callback(200, { message: "It works fine" });
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;
