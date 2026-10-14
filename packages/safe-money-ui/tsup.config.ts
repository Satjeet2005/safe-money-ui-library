import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'money/index': 'src/money/index.ts',
    'submit/index': 'src/submit/index.ts',
    'boundary/index': 'src/boundary/index.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  treeshake: true,
  external: ['react', 'react-dom', 'zod'],
  onSuccess: async () => {
    const fs = await import('node:fs');
    fs.copyFileSync('src/react/styles.css', 'dist/styles.css');
  },
});
