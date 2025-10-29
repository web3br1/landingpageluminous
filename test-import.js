// Test import of design system
try {
  const designSystem = require("./design-system");
  console.log("Design system imported successfully");
  console.log("Colors available:", Object.keys(designSystem.colors || {}));
} catch (error) {
  console.error("Failed to import design system:", error.message);
}
