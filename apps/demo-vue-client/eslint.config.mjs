import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';

export default defineConfigWithVueTs(
  js.configs.recommended,
  vue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    languageOptions: {
      ecmaVersion: 'latest',
    },
  },
);
