const { withGradleProperties } = require("expo/config-plugins");

module.exports = function withKotlinVersion(config) {
  return withGradleProperties(config, (config) => {
    // Remove existing kotlinVersion if present
    config.modResults = config.modResults.filter(
      (item) => !(item.type === "property" && item.key === "kotlinVersion")
    );
    // Add kotlinVersion = 1.9.25
    config.modResults.push({
      type: "property",
      key: "kotlinVersion",
      value: "1.9.25",
    });
    return config;
  });
};
