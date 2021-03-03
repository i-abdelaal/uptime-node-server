/*
 *
 * This helper function sends SMS via Twilio
 *
 */

const Twilio = function ({ https, querystring, config }) {
  // Send an SMS message via Twilio
  this.sendSms = function (phone, msg, callback) {
    // Validate paramiters
    phone =
      typeof phone == "string" && phone.trim().length == 10
        ? phone.trim()
        : false;
    msg =
      typeof msg == "string" &&
      msg.trim().length > 0 &&
      msg.trim().length <= 1600
        ? msg.trim()
        : false;
    if (phone && msg) {
      // Configure the request payload
      const payload = {
        From: config.twilio.fromPhone,
        To: "+20" + phone,
        Body: msg,
      };

      // Stringify the payload
      const stringPayload = querystring.stringify(payload);

      // Configure the request details
      const requestDetails = {
        protocol: "https:",
        hostname: "api.twilio.com",
        method: "POST",
        path:
          "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
        auth: config.twilio.accountSid + ":" + config.twilio.authToken,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(stringPayload),
        },
      };

      // Instantiate the request object
      const req = https.request(requestDetails, function (res) {
        // Grab the status of the sent request
        const status = res.statusCode;

        // Callback successfully if the request went through
        if (status == 200 || status == 201) {
          callback(false);
        } else {
          callback("Status code returned was " + status);
        }
      });

      // Bind to the error event so it does not get through
      req.on("error", function (e) {
        callback(e);
      });

      // Add the payload
      req.write(stringPayload);

      // End the request
      req.end();
    } else {
      callback("Given paramiters were missing or invalid");
    }
  };
};

// Export the module
module.exports = Twilio;
