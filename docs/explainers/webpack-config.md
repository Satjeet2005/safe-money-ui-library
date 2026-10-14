# Explainer: webpack-config

## What it does

`apps/transfer-demo/webpack.config.cjs` configures development and production bundling for the transfer demo application, including SWC transpilation, CSS extraction, HTML generation, and internal monorepo path aliases.

## Why it exists

In a TypeScript monorepo, the demo application must consume unpublished library packages directly from TypeScript source code during development without requiring continuous build steps. The Webpack configuration provides fast local compilation, path alias synchronization, and optimized production asset emission.

## How it works

1. Exports a configuration function handling `development` and `production` modes.
2. Sets the application entry point to `apps/transfer-demo/src/index.tsx` and output directory to `dist/`.
3. Configures `swc-loader` for `.ts` and `.tsx` files targeting `es2022` with automatic React runtime.
4. Uses `MiniCssExtractPlugin` and `css-loader` to extract styles into standalone `.css` files.
5. Injects bundled assets into `public/index.html` via `HtmlWebpackPlugin`.
6. Configures `webpack-dev-server` on port `5173` with `historyApiFallback: true` for client routing.
7. Maps package aliases (`@satjeet2005/safe-money-ui/*`) directly to local package source files.
8. Configures source maps (`source-map` for production, `eval-cheap-module-source-map` for dev).
9. Employs output directory cleaning on each build execution.

## Trade-offs

The configuration uses `swc-loader` instead of standard `ts-loader` or Babel. SWC is implemented in Rust and executes significantly faster, speeding up hot reloads and test builds while delegating type verification to a separate `tsc --noEmit` check.

## How it is tested

- Unit tests in `apps/transfer-demo/src/webpack.test.ts` verify configuration assertions `WB-01` through `WB-06` (devServer, output paths, SWC options, CSS extraction, HTML template, and resolve aliases).
- Production build verification is tested via `pnpm build` in `pnpm verify`.
- Bundle size scripts (`pnpm size`) verify that compiled JavaScript stays within the 88,900 B ratcheted budget.

## Questions an interviewer may ask

1. Why does the Webpack configuration use SWC rather than standard `ts-loader`?
2. How do resolve aliases in Webpack mirror TypeScript's path configuration in a monorepo?
3. Why is CSS extracted into a standalone file via `MiniCssExtractPlugin` instead of injected via `style-loader`?
