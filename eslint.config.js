// One linter for the whole project: SonarJS (the rules behind SonarQube's JavaScript
// analysis), React, React Hooks and accessibility (jsx-a11y). Browser code and server code
// get their own globals, so a `window` in the server (or `process` in the store) is caught.
import sonarjs from 'eslint-plugin-sonarjs';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

const shared = {
  ecmaVersion: 'latest',
  sourceType: 'module'
};

export default [
  { ignores: ['**/node_modules/**', '**/dist/**'] },
  sonarjs.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', ignoreRestSiblings: true }],
      'no-undef': 'error'
    }
  },
  // Browser: the store and the admin panel.
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    languageOptions: { ...shared, parserOptions: { ecmaFeatures: { jsx: true } }, globals: globals.browser },
    settings: { react: { version: '19' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off'
    }
  },
  // Node: the API server, scripts, tests and tool configs.
  {
    files: ['server/**/*.js', 'scripts/**/*.{js,mjs}', 'tests/**/*.{js,mjs}', '*.config.js'],
    languageOptions: { ...shared, globals: globals.node }
  },
  // Tests use made-up IPs and passwords on purpose.
  {
    files: ['tests/**/*.{js,mjs}'],
    rules: { 'sonarjs/no-hardcoded-ip': 'off', 'sonarjs/no-hardcoded-passwords': 'off' }
  }
];
