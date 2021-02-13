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
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

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
              delete userObject.hashedPassword;
              callback(201, userObject);
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
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, {
          Error: "Missing required token in the header, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
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

  // Check for the optional fields
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
      // Get the token from the headers
      const token =
        typeof data.headers.token == "string" ? data.headers.token : false;
      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
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
                  callback(200, userData);
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
          callback(403, {
            Error: "Missing required token in the header, or token is invalid",
          });
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
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", phone, function (err, data) {
          if (!err && data) {
            _data.delete("users", phone, function (err) {
              if (!err) {
                callback(200, { Message: "User deleted" });
              } else {
                callback(500, { Error: "Could not delete the specified user" });
              }
            });
          } else {
            callback(400, { Error: "Could not find the specified user" });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in the header, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing reuired field" });
  }
};

// Define tokens handler
handlers.tokens = function (data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all tokens submethods
handlers._tokens = {};

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
            callback(200, { Message: "Token deleted" });
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

// Verify if a given tokenId is currently valid for a given user
handlers._tokens.verifyToken = function (tokenId, phone, callback) {
  // Lookup the token
  _data.read("tokens", tokenId, function (err, tokenData) {
    if (!err && tokenData) {
      // Check if the token is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Define checks handler
handlers.checks = function (data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all checks submethods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = function (data, callback) {
  // Validate inputs
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol.trim()) > -1
      ? data.payload.protocol.trim()
      : false;
  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  const method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method.trim()) > -1
      ? data.payload.method.trim()
      : false;
  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Lookup the user from the token
    _data.read("tokens", token, function (err, tokenData) {
      if (!err && tokenData.expires > Date.now()) {
        const userPhone = tokenData.phone;

        // Lookup the user data
        _data.read("users", userPhone, function (err, userData) {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];

            // Verify that the user has less than the mex-checks-per-user
            if (userChecks.length < config.maxChecks) {
              // Create a random ID for the check
              const checkId = helpers.createRandomString(
                config.checkRandomNumber
              );

              // Create the check object and include the user phone
              const checkObject = {
                checkId,
                userPhone,
                protocol,
                url,
                successCodes,
                timeoutSeconds,
              };

              // Store the chekObject
              _data.create("checks", checkId, checkObject, function (err) {
                if (!err) {
                  // Add the checkId to the user object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update("users", userPhone, userData, function (err) {
                    if (!err) {
                      // Return the checkOject
                      callback(201, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new check" });
                }
              });
            } else {
              callback(400, {
                Error:
                  "The user has already the maximum number of checks (" +
                  config.maxChecks +
                  ")",
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs, or inputs are invalid" });
  }
};

// Checks - get
// Required data: checkId
// Optional data: none
handlers._checks.get = function (data, callback) {
  // Check that the checkId is valid
  const checkId =
    typeof data.qureyStringObject.checkId == "string" &&
    data.qureyStringObject.checkId.length == config.checkRandomNumber
      ? data.qureyStringObject.checkId
      : false;

  if (checkId) {
    // Lookup the check
    _data.read("checks", checkId, function (err, checkData) {
      if (!err && checkData) {
        // Get the token from the headers
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;

        if (token) {
          // Verify the token is valid and belong to the user who created the check
          handlers._tokens.verifyToken(
            token,
            checkData.userPhone,
            function (tokenIsValid) {
              if (tokenIsValid) {
                // Return the check data
                callback(200, checkData);
              } else {
                callback(403, { Error: "Invalid token" });
              }
            }
          );
        } else {
          callback(403, { Error: "Token is missing from the headers" });
        }
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required filed" });
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
