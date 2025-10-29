module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // General code quality rules
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',

    // TypeScript specific rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-throw-literal': 'error',
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    'complexity': ['error', 10],

    // Design System Rules
    'react/button-has-type': 'error',

    // Result Pattern Rules
    'no-restricted-syntax': [
      'error',
      {
        selector: 'MemberExpression[property.name="data"][object.name=/result|Result/]',
        message: 'Use result.value instead of result.data for Result types'
      }
    ],
  },
  ignorePatterns: [
    'lib/payments/**/*.ts',
    'app/api/webhooks/**/*.ts'
  ],
  settings: {
    // Custom rules location
    'import/resolver': {
      typescript: {}
    }
  },
  // SSR Safety Rules - Custom implementation
  // Note: Full ESLint plugin implementation pending
  // For now, manual code review required for SSR safety
  //
  // TODO: Implement as proper ESLint plugin
  // rules: {
  //   'ssr/no-direct-browser-api': ['error', {
  //     forbiddenGlobals: ['window', 'document', 'navigator', 'localStorage', 'sessionStorage'],
  //     allowedContexts: ['useEffect', 'useLayoutEffect', 'safeBrowserAPI', 'isClient', 'isServer']
  //   }]
  // }
}
