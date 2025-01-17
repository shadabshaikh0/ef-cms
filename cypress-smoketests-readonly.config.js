const { defineConfig } = require('cypress');

module.exports = defineConfig({
  browser: 'edge',
  defaultCommandTimeout: 20000,
  e2e: {
    specPattern: 'cypress-readonly/integration/*.cy.js',
    supportFile: 'cypress-readonly/support/index.js',
  },
  fixturesFolder: 'cypress-readonly/fixtures',
  reporter: 'spec',
  reporterOptions: {
    toConsole: true,
  },
  requestTimeout: 20000,
  screenshotsFolder: 'cypress-readonly/screenshots',
  video: true,
  videoCompression: 10,
  videoUploadOnPasses: false,
  videosFolder: 'cypress-readonly/videos',
  viewportHeight: 900,
  viewportWidth: 1200,
});
