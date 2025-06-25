module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['jest', 'prettier'],
  rules: {
    'no-unused-vars': 'warn',
    'prettier/prettier': 'warn',
    'node/no-unpublished-require': [
      'error',
      {
        allowModules: ['supertest'],
      },
    ],
  },
};
