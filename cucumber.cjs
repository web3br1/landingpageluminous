module.exports = {
  default: {
    import: ['ts-node/register', 'features/**/*.steps.ts', 'features/step_definitions/**/*.ts'],
    format: ['progress', 'html:cucumber-report.html'],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    paths: ['features/**/*.feature'],
    parallel: 2,
    retry: 1,
    retryTagFilter: '@flaky',
    strict: true,
    tags: 'not @ignore',
    timeout: 60000,
    worldParameters: {
      appUrl: 'http://localhost:3000'
    }
  }
}
