import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'Website to be revamped/**',
    ],
  },
  ...nextCoreWebVitals,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    rules: {
      'import/no-anonymous-default-export': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',

      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/void-use-memo': 'off',
      'react-hooks/component-hook-factories': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/memoized-effect-dependencies': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/no-deriving-state-in-effects': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/invariant': 'off',
      'react-hooks/hooks': 'off',
      'react-hooks/capitalized-calls': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
    },
  },
]

export default config
