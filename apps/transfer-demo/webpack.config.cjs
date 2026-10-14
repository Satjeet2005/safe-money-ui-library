const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env = {}, argv = {}) => {
  void env;
  const mode = argv.mode || process.env.NODE_ENV || 'production';
  const isProduction = mode === 'production';

  return {
    mode,
    entry: path.resolve(__dirname, 'src/index.tsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      publicPath: '/',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      extensionAlias: {
        '.js': ['.ts', '.tsx', '.js'],
        '.mjs': ['.mts', '.mjs'],
      },
      alias: {
        '@satjeet2005/safe-money-ui/styles.css': path.resolve(
          __dirname,
          '../../packages/safe-money-ui/src/react/styles.css',
        ),
        '@satjeet2005/safe-money-ui/money': path.resolve(
          __dirname,
          '../../packages/safe-money-ui/src/money/index.ts',
        ),
        '@satjeet2005/safe-money-ui/submit': path.resolve(
          __dirname,
          '../../packages/safe-money-ui/src/submit/index.ts',
        ),
        '@satjeet2005/safe-money-ui/boundary': path.resolve(
          __dirname,
          '../../packages/safe-money-ui/src/boundary/index.ts',
        ),
        '@satjeet2005/safe-money-ui/react': path.resolve(
          __dirname,
          '../../packages/safe-money-ui/src/react/index.ts',
        ),
        '@satjeet2005/safe-money-ui$': path.resolve(
          __dirname,
          '../../packages/safe-money-ui/src/money/index.ts',
        ),
        '@satjeet2005/safe-money-ui': path.resolve(
          __dirname,
          '../../packages/safe-money-ui/src/money/index.ts',
        ),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                  },
                },
                target: 'es2022',
              },
            },
          },
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? '[name].[contenthash].css' : '[name].css',
      }),
    ],
    performance: {
      hints: 'warning',
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
    },
    devServer: {
      port: 5173,
      historyApiFallback: true,
      hot: true,
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
    },
  };
};
