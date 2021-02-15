/*
 * Create and export configuration variables
 *
 */

// Container for all the environments
const environments = {};

// Development (default) environment
environments.development = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "development",
  hashSecret: "ThisIsASecret",
  tokenRandomNumberGenerator: 20,
  tokenStringGenerator: "abcdefghijklmnopqrstuvwxyz0123456789",
  maxChecks: 5,
  checkRandomNumber: 20,
  loopWorkerInterval: 1000 * 6,
  twilio: {
    accountSid: process.env.accountSid,
    authToken: process.env.authToken,
    fromPhone: process.env.fromPhone,
  },
};

// Production environment
environments.production = {
  httpPort: process.env.httpPort,
  httpsPort: process.env.httpsPort,
  envName: "production",
  hashSecret: process.env.hashSecret,
  tokenRandomNumberGenerator: process.env.tokenRandomNumberGenerator,
  tokenStringGenerator: process.env.tokenStringGenerator,
  maxChecks: process.env.maxChecks,
  checkRandomNumber: process.env.checkRandomNumber,
  loopWorkerInterval: process.env.loopWorkerInterval,
  twilio: {
    accountSid: process.env.accountSid,
    authToken: process.env.authToken,
    fromPhone: process.env.fromPhone,
  },
};

// Determine which environment was passed as command-line argument
const currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// Check that the current environment is one of the defined environments or the default
const environmentToExport =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.development;

// Export the module
module.exports = environmentToExport;
