/*
 * Primary file for API
 *
 */

// Dependencies

const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const fs = require("fs");
const config = require("./lib/config");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Define the port
const httpPort = config.httpPort;

// Define the environment
const ENV = config.envName;

// Start the HTTP server
httpServer.listen(httpPort, () =>
  console.log(`Server launched on ${httpPort} in ${ENV} mode`)
);

// Instantiate the HTTPs server
const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// Define the port
const httpsPort = config.httpsPort;

// Start the HTTPS server
httpsServer.listen(httpsPort, () =>
  console.log(`Server launched on ${httpsPort} in ${ENV} mode`)
);

// All the server logic for http and https server
const unifiedServer = function (req, res) {
  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the query string as an object
  const qureyStringObject = parsedUrl.query;

  // Get the request headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    //Choose the handler this request should go to
    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? handlers[trimmedPath]
        : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath: trimmedPath,
      qureyStringObject: qureyStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function (statusCode, payload) {
      // Set default status code
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // Set default payload
      payload = typeof payload == "object" ? payload : {};

      // Convert object to stirng
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      // Log the request path
      console.log(
        `Returning this statusCode: ${statusCode} and this payload: ${payloadString}`
      );
    });
  });
};

// Define request router
const router = {
  ping: handlers.ping,
  hello: handlers.hello,
  users: handlers.users,
};
