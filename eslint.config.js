import astroEslintParser from 'astro-eslint-parser';
import astroPlugin from 'eslint-plugin-astro';
import typescriptEslintParser from '@typescript-eslint/parser';

export default [
  // Apply to all JS/TS/Astro files in src/
  {
    files: ['src/**/*.{js,ts,astro}'],
    plugins: {
      astro: astroPlugin
    },
    rules: {
      ...astroPlugin.configs.recommended.rules
    }
  },
  // Configuration for .astro files
  {
    files: ['src/**/*.astro'],
    languageOptions: {
      parser: astroEslintParser,
      parserOptions: {
        parser: typescriptEslintParser,
        extraFileExtensions: ['.astro']
      }
    }
  },
  // Configuration for TypeScript files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptEslintParser
    }
  },
  // Ignore patterns
  {
    ignores: ['dist/', 'node_modules/', '.astro/', 'public/']
  }
]; 