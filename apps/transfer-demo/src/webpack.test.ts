import path from 'node:path';
import fs from 'node:fs';

describe('Webpack configuration (WP-23)', () => {
  const configPath = path.resolve(__dirname, '../webpack.config.cjs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rawConfig = require(configPath);
  const getConfig = (mode: 'development' | 'production') =>
    typeof rawConfig === 'function' ? rawConfig({}, { mode }) : rawConfig;

  test('WB-01: devServer is configured with port 5173 and historyApiFallback', () => {
    const devConfig = getConfig('development');
    expect(devConfig.devServer).toBeDefined();
    expect(devConfig.devServer.port).toBe(5173);
    expect(devConfig.devServer.historyApiFallback).toBe(true);
  });

  test('WB-02: entry and output directory with publicPath /', () => {
    const prodConfig = getConfig('production');
    expect(prodConfig.entry).toBeDefined();
    const entryFile =
      typeof prodConfig.entry === 'string'
        ? prodConfig.entry
        : prodConfig.entry.main || prodConfig.entry.index;
    const resolvedEntry = path.resolve(__dirname, '..', entryFile);
    expect(fs.existsSync(resolvedEntry)).toBe(true);
    expect(prodConfig.output).toBeDefined();
    expect(prodConfig.output.publicPath).toBe('/');
    expect(prodConfig.output.path).toBe(path.resolve(__dirname, '../dist'));
  });

  interface WebpackRule {
    test?: RegExp;
    use?: unknown;
    loader?: string;
    options?: {
      jsc?: {
        parser?: { syntax?: string; tsx?: boolean };
        transform?: { react?: { runtime?: string } };
        target?: string;
      };
    };
  }

  interface WebpackPlugin {
    constructor?: { name?: string };
    userOptions?: { template?: string };
  }

  test('WB-03: SWC loader compiles TypeScript and TSX with ES2022 and automatic React runtime', () => {
    const prodConfig = getConfig('production');
    const rules = (prodConfig.module?.rules || []) as WebpackRule[];
    const tsRule = rules.find(
      (r) => r.test && (r.test.test('index.ts') || r.test.test('index.tsx')),
    );
    expect(tsRule).toBeDefined();
    const use = Array.isArray(tsRule?.use) ? tsRule.use[0] : tsRule?.loader ? tsRule : tsRule?.use;
    const loaderName =
      typeof use === 'string' ? use : (use as { loader?: string } | undefined)?.loader;
    expect(loaderName).toContain('swc-loader');
    const options =
      typeof use === 'object' && use !== null
        ? (use as { options?: WebpackRule['options'] }).options
        : {};
    expect(options?.jsc?.parser?.syntax).toBe('typescript');
    expect(options?.jsc?.parser?.tsx).toBe(true);
    expect(options?.jsc?.transform?.react?.runtime).toBe('automatic');
    expect(options?.jsc?.target).toBe('es2022');
  });

  test('WB-04: CSS extraction uses mini-css-extract-plugin and css-loader', () => {
    const prodConfig = getConfig('production');
    const rules = (prodConfig.module?.rules || []) as WebpackRule[];
    const cssRule = rules.find((r) => r.test && r.test.test('styles.css'));
    expect(cssRule).toBeDefined();
    const useList = Array.isArray(cssRule?.use) ? cssRule.use : [cssRule?.use];
    const loaders = useList.map((u) =>
      typeof u === 'string' ? u : (u as { loader?: string } | undefined)?.loader,
    );
    expect(
      loaders.some(
        (l) => l && (l.includes('mini-css-extract-plugin') || l.includes('MiniCssExtractPlugin')),
      ),
    ).toBe(true);
    expect(loaders.some((l) => l && l.includes('css-loader'))).toBe(true);

    const plugins = (prodConfig.plugins || []) as WebpackPlugin[];
    const hasMiniCssExtract = plugins.some(
      (p) => p && p.constructor && p.constructor.name === 'MiniCssExtractPlugin',
    );
    expect(hasMiniCssExtract).toBe(true);
  });

  test('WB-05: HTML webpack plugin points to public/index.html', () => {
    const prodConfig = getConfig('production');
    const plugins = (prodConfig.plugins || []) as WebpackPlugin[];
    const htmlPlugin = plugins.find(
      (p) => p && p.constructor && p.constructor.name === 'HtmlWebpackPlugin',
    );
    expect(htmlPlugin).toBeDefined();
    expect(htmlPlugin?.userOptions?.template).toBe(path.resolve(__dirname, '../public/index.html'));
  });

  test('WB-06: resolve aliases match TypeScript and Jest mappings', () => {
    const prodConfig = getConfig('production');
    expect(prodConfig.resolve?.alias).toBeDefined();
    const alias = prodConfig.resolve.alias;
    const repoRoot = path.resolve(__dirname, '../../..');
    expect(alias['@satjeet2005/safe-money-ui/styles.css']).toBe(
      path.resolve(repoRoot, 'packages/safe-money-ui/src/react/styles.css'),
    );
    expect(alias['@satjeet2005/safe-money-ui/money']).toBe(
      path.resolve(repoRoot, 'packages/safe-money-ui/src/money/index.ts'),
    );
    expect(alias['@satjeet2005/safe-money-ui/submit']).toBe(
      path.resolve(repoRoot, 'packages/safe-money-ui/src/submit/index.ts'),
    );
    expect(alias['@satjeet2005/safe-money-ui/boundary']).toBe(
      path.resolve(repoRoot, 'packages/safe-money-ui/src/boundary/index.ts'),
    );
    expect(alias['@satjeet2005/safe-money-ui/react']).toBe(
      path.resolve(repoRoot, 'packages/safe-money-ui/src/react/index.ts'),
    );
    const rootAlias = alias['@satjeet2005/safe-money-ui'] || alias['@satjeet2005/safe-money-ui$'];
    expect(rootAlias).toBe(path.resolve(repoRoot, 'packages/safe-money-ui/src/money/index.ts'));
  });
});
