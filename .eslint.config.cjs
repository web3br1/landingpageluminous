module.exports = {
  overrides: [
    {
      files: ["components/sections/**/*.tsx"],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "CallExpression[callee.name='fetch']",
            message: 'UI sections must not perform fetch; use resolver and pass via props.'
          }
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: ['axios', 'node-fetch'],
            patterns: [
              {
                group: ['@/lib/http*', '@/lib/caching*'],
                message: 'Sections cannot import HTTP/caching; keep UI pure.'
              }
            ]
          }
        ]
      }
    }
  ]
}
