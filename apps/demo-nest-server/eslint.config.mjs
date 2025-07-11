import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import ts from 'typescript-eslint';

export default ts.config(
  js.configs.recommended,
  ts.configs.recommended,
  prettierRecommended,
  {
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
