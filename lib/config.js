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
  loopWorkerInterval: 1000 * 60,
  loopLogRotationWorkerInterval: 1000 * 60 * 60 * 24,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromPhone: process.env.TWILIO_FROM_PHONE,
  },
};

// Production environment
environments.production = {
  httpPort: process.env.HTTP_PORT,
  httpsPort: process.env.HTTPS_PORT,
  envName: "production",
  hashSecret: process.env.HASH_SECRET,
  tokenRandomNumberGenerator: process.env.TOKEN_RANDOM_NUMBER_GENERATOR,
  tokenStringGenerator: process.env.TOKEN_STRING_GENERATOR,
  maxChecks: process.env.MAX_CHECKS,
  checkRandomNumber: process.env.CHECK_RANDOM_NUMBER,
  loopWorkerInterval: process.env.LOOP_WORKER_INTERVAL,
  loopLogRotationWorkerInterval: process.env.LOOP_LOG_ROTATION_WORKER_INTERVAL,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromPhone: process.env.TWILIO_FROM_PHONE,
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
