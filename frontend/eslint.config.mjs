import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const core = compat.extends('next/core-web-vitals');

// Force an explicit `files` glob on every converted config that does not already
// declare one. (Without it, this ESLint version reports .jsx files as "no
// matching configuration" and silently skips linting them.)
const withExplicitFiles = core.map((config) => {
  const hasStringFiles =
    Array.isArray(config.files) && config.files.some((f) => typeof f === 'string');
  if (hasStringFiles) return config;
  return { files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'], ...config };
});

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'out/**', 'build/**', 'coverage/**'],
  },
  ...withExplicitFiles,
];

export default eslintConfig;

