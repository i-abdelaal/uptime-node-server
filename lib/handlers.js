/*
 * Request handlers
 *
 */
// Dependencies
const _data = require("./data");
const config = require("./config");
const helpers = require("./helpers");

// Define handlers
const handlers = {};

// Define ping handler
handlers.ping = function (data, callback) {
  // Callback http status code and payload object
  callback(200, { message: "It works fine" });
};

// Define users handler
handlers.users = function (data, callback) {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function (data, callback) {
  // Check that the phone number is valid
  const phone =
    typeof data.qureyStringObject.phone == "string" &&
    data.qureyStringObject.phone.length == 10
      ? data.qureyStringObject.phone
      : false;

  if (phone) {
    // Lookup the user
    _data.read("users", phone, function (err, data) {
      if (!err && data) {
        // Remove the hashed password from the user object before returning
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
  // Check that all required fields are filled out
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesn't already exist
    _data.read("users", phone, function (err, data) {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // Create the user object
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true,
          };

          // Store the user
          _data.create("users", phone, userObject, function (err) {
            if (!err) {
              callback(201);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the password" });
        }
      } else {
        // User already exists
        callback(400, {
          Error: "A user with that phone number already exists",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field(s)" });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
  // Check for the required field
  const phone =
    typeof data.payload.phone == "string" && data.payload.phone.length == 10
      ? data.payload.phone
      : false;

  // Check fro the optional fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  // Error if the phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {
      // Lookup the user
      _data.read("users", phone, function (err, userData) {
        if (!err && userData) {
          // Update the necessary fields
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }

          // Store the updated fields
          _data.update("users", phone, userData, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not update the user" });
            }
          });
        } else {
          callback(400, { Error: "The specified user does not exist" });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Missing requied field" });
  }
};

// Users - delete
// Required field: phone
handlers._users.delete = function (data, callback) {
  // Check that the phone number is valid
  const phone =
    typeof data.qureyStringObject.phone == "string" &&
    data.qureyStringObject.phone.length == 10
      ? data.qureyStringObject.phone
      : false;
  if (phone) {
    // Lookup the user
    _data.read("users", phone, function (err, data) {
      if (!err && data) {
        _data.delete("users", phone, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified user" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing reuired field" });
  }
};

// Define tokens handler
handlers.tokens = function (data, callback) {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all tokens submethods
handlers._tokens = {};

// Tokens - get
// Required data: tokenId
// Optional data: none
handlers._tokens.get = function (data, callback) {
  // Check that the sent tokenId is valid
  const tokenId =
    typeof data.qureyStringObject.tokenId == "string" &&
    data.qureyStringObject.tokenId.length == 20
      ? data.qureyStringObject.tokenId
      : false;

  if (tokenId) {
    // Lookup the tokenId
    _data.read("tokens", tokenId, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function (data, callback) {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    // Lookup the user who maches that phone number
    _data.read("users", phone, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password and compare it to the stored password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name and set the expiration date for 1 hour in the future
          const tokenId = helpers.createRandomString(
            config.tokenRandomNumberGenerator
          );
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone,
            tokenId,
            expires,
          };

          // Store the token
          _data.create("tokens", tokenId, tokenObject, function (err) {
            if (!err) {
              callback(201, tokenObject);
            } else {
              callback(500, { Error: "Could not create the new token" });
            }
          });
        } else {
          callback(400, { Error: "Invalid password" });
        }
      } else {
        callback(400, { Error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field(s)" });
  }
};

// Tokens - put
// Required data: tokenId, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  const tokenId =
    typeof data.payload.tokenId == "string" &&
    data.payload.tokenId.length == config.tokenRandomNumberGenerator
      ? data.payload.tokenId
      : false;
  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;
  if (tokenId && extend) {
    // Lookup the token
    _data.read("tokens", tokenId, function (err, tokenData) {
      if (!err && tokenData) {
        // Check to make sure that the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an ahour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update("tokens", tokenId, tokenData, function (err) {
            if (!err) {
              callback(200, tokenData);
            } else {
              callback(500, { Error: "Could not update the specified token" });
            }
          });
        } else {
          callback(400, {
            Error: "The token has already expired and cannot be extended",
          });
        }
      } else {
        callback(400, { Error: "Specified token does not exist" });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required field(s) or field(s) are invalid",
    });
  }
};

// Tokens - delete
// Required data: tokenId
// Optional data: none
handlers._tokens.delete = function (data, callback) {
  // Check that the tokenId is valid
  const tokenId =
    typeof data.qureyStringObject.tokenId == "string" &&
    data.qureyStringObject.tokenId.length == config.tokenRandomNumberGenerator
      ? data.qureyStringObject.tokenId
      : false;
  if (tokenId) {
    // Lookup the token
    _data.read("tokens", tokenId, function (err, tokenData) {
      if (!err && tokenData) {
        _data.delete("tokens", tokenId, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Define hello handler
handlers.hello = function (data, callback) {
  callback(200, { message: "Hello World!" });
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

// Export the module

module.exports = handlers;
