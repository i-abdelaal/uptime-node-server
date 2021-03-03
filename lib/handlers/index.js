/*
 * This is the handlers index to export all request handlers
 *
 */

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

// Hello handler
handlers.hello = function (data, callback) {
  callback(200, { message: "Hello World!" });
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;
