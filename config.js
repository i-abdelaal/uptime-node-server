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
};

// Production environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
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
