module.exports = {
  forbidden: [
    {
      name: 'ui-no-http',
      comment: 'UI sections must not import HTTP/caching libs',
      severity: 'error',
      from: { path: '^components/sections' },
      to: { path: '^lib/(http|caching|cache)' }
    },
    {
      name: 'no-abs-node-modules',
      comment: 'Avoid absolute node_modules imports leaking into UI',
      severity: 'warn',
      from: { path: '^(components|app)/' },
      to: { path: 'node_modules/.*/src/' }
    },
    {
      name: 'no-cycles',
      severity: 'error',
      from: {},
      to: { circular: true }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^(app|components|lib|domains)'
  }
}
