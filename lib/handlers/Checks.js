/*
 * Checks submethods
 *
 */

// Factory function
const Checks = function ({ _data, _tokens, helpers, config }) {
  // Checks - post
  // Required data: protocol, url, method, successCodes, timeoutSeconds
  // Optional data: none
  this.post = function (data, callback) {
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
                const checkId = helpers.utilities.createRandomString(
                  config.checkRandomNumber
                );

                // Create the check object and include the user phone
                const checkObject = {
                  checkId,
                  userPhone,
                  protocol,
                  url,
                  method,
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
      callback(400, {
        Error: "Missing required inputs, or inputs are invalid",
      });
    }
  };

  // Checks - get
  // Required data: checkId
  // Optional data: none
  this.get = function (data, callback) {
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
            this._tokens.verifyToken(
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

  // Checks - put
  // Required data: checkId
  // Optional data: protocol, url, method, successCodes, timeoutSeconds (at least one)
  this.put = function (data, callback) {
    // Check for the required field
    const checkId =
      typeof data.payload.checkId == "string" &&
      data.payload.checkId.length == config.checkRandomNumber
        ? data.payload.checkId
        : false;

    // Check for the optional fields
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

    // Make sure check ID has been sent
    if (checkId) {
      // Make sure one or more of optional field has been sent
      if (protocol || url || method || successCodes || timeoutSeconds) {
        // Lookup the check
        _data.read("checks", checkId, function (err, checkData) {
          if (!err && checkData) {
            // Get the token from the headers
            const token =
              typeof data.headers.token == "string"
                ? data.headers.token
                : false;

            if (token) {
              // Verify the token is valid and belong to the user who created the check
              this._tokens.verifyToken(
                token,
                checkData.userPhone,
                function (tokenIsValid) {
                  if (tokenIsValid) {
                    // Update the check where necessary
                    if (protocol) {
                      checkData.protocol = protocol;
                    }

                    if (url) {
                      checkData.url = url;
                    }
                    if (method) {
                      checkData.method = method;
                    }
                    if (successCodes) {
                      checkData.successCodes = successCodes;
                    }
                    if (timeoutSeconds) {
                      checkData.timeoutSeconds = timeoutSeconds;
                    }

                    // Store the new updates
                    _data.update("checks", checkId, checkData, function (err) {
                      if (!err) {
                        callback(200, checkData);
                      } else {
                        callback(500, {
                          Error: "Could not update the specified check",
                        });
                      }
                    });
                  } else {
                    callback(403, { Error: "Invalid token" });
                  }
                }
              );
            } else {
              callback(403, { Error: "Token is missing from the headers" });
            }
          } else {
            callback(400, { Error: "The specified check does not exist" });
          }
        });
      } else {
        callback(400, { Error: "Missing fields to update" });
      }
    } else {
      callback(400, { Error: "Missing required field" });
    }
  };

  // Checks - delete
  // Required data: checkId
  // Optional data: none
  this.delete = function (data, callback) {
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
            // Verify that the given token is valid for the user
            _tokens.verifyToken(
              token,
              checkData.userPhone,
              function (tokenIsValid) {
                if (tokenIsValid) {
                  // Delete the check data
                  _data.delete("checks", checkId, function (err) {
                    if (!err) {
                      // Lookup the user
                      _data.read(
                        "users",
                        checkData.userPhone,
                        function (err, userData) {
                          if (!err && userData) {
                            // Get the user checks
                            const userChecks =
                              typeof userData.checks == "object" &&
                              userData.checks instanceof Array &&
                              userData.checks.length > 0
                                ? userData.checks
                                : [];

                            // Remove the deleted check from the list of check
                            const checkPosition = userChecks.indexOf(checkId);
                            if (checkPosition > -1) {
                              userChecks.splice(checkPosition, 1);

                              // Resave the user data
                              _data.update(
                                "users",
                                checkData.userPhone,
                                userData,
                                function (err) {
                                  if (!err) {
                                    callback(200, {
                                      Message: `Check ID ${checkId} has been deleted`,
                                    });
                                  } else {
                                    callback(500, {
                                      Error:
                                        "Could not remove the check ID from the user check list",
                                    });
                                  }
                                }
                              );
                            } else {
                              callback(500, {
                                Error:
                                  "Could not find the checks on user check ID list in order to delete it",
                              });
                            }
                          } else {
                            callback(500, {
                              Error:
                                "Could not find the user who created the check in order to remove the check ID from their checks list",
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        Error: "Could not delete the specified check",
                      });
                    }
                  });
                } else {
                  callback(403, { Error: "Invalid token" });
                }
              }
            );
          } else {
            callback(403, { Error: "Missing token in the headers" });
          }
        } else {
          callback(400, { Error: "The specified check does not exist" });
        }
      });
    } else {
      callback(400, { Error: "Missing required field" });
    }
  };
};

// Export the module
module.exports = Checks;
