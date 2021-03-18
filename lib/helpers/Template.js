/*
 *
 * Template helper function
 *
 */

// Factory function
const Template = function ({ path, fs }) {
  // Get the string content of a template
  this.get = function (templateName, callback) {
    templateName =
      typeof templateName == "string" && templateName.length > 0
        ? templateName
        : false;
    if (templateName) {
      const templatesDir = path.join(__dirname, "/../../templates/");
      fs.readFile(
        templatesDir + templateName + ".html",
        "utf8",
        function (err, str) {
          if (!err && str && str.length > 0) {
            callback(false, str);
          } else {
            callback("No template could be found");
          }
        }
      );
    } else {
      callback("A valid template name was not specified");
    }
  };
};

// Export the module
module.exports = Template;
