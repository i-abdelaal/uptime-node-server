/*
 * Users submethods
 *
 */

// Factory function
const Users = function ({ _data, _tokens, helpers }) {
  // Users - post
  // Required data: firstName, lastName, phone, password, tosAgreement
  // Optional data: none
  this.post = function (data, callback) {
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
          const hashedPassword = helpers.crypt.hash(password);

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
  this.get = function (data, callback) {
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
      this._tokens.verifyToken(token, phone, function (tokenIsValid) {
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
  this.put = function (data, callback) {
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
        this._tokens.verifyToken(token, phone, function (tokenIsValid) {
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
                  userData.hashedPassword = helpers.crypt.hash(password);
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
              Error:
                "Missing required token in the header, or token is invalid",
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
  this.delete = function (data, callback) {
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
      _tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
          // Lookup the user
          _data.read("users", phone, function (err, userData) {
            if (!err && userData) {
              _data.delete("users", phone, function (err) {
                if (!err) {
                  // Delete each check associated with the user
                  const userChecks =
                    typeof userData.checks == "object" &&
                    userData.checks instanceof Array &&
                    userData.checks.length > 0
                      ? userData.checks
                      : [];
                  const checksToDelete = userChecks.length;
                  if (checksToDelete > 0) {
                    let checksDeleted = 0;
                    let deletionErrors = false;
                    // Loop through the checks
                    userChecks.forEach(function (checkId) {
                      _data.delete("checks", checkId, function (err) {
                        if (err) deletionErrors = false;
                        checksDeleted++;
                        if (checksDeleted == checksToDelete) {
                          if (!deletionErrors) {
                            callback(200, { Message: "User has been deleted" });
                          } else {
                            callback(500, {
                              Error:
                                "All cheecks may not have been deleted from the system successfully",
                            });
                          }
                        }
                      });
                    });
                  } else {
                    callback(200, { Message: "User has been deleted" });
                  }
                } else {
                  callback(500, {
                    Error: "Could not delete the specified user",
                  });
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
};

// Export the module
module.exports = Users;
