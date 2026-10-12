// webpack.config.cjs - to be fully configured in WP-23
const path = require('path');

module.exports = {
  resolve: {
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
      '@satjeet2005/safe-money-ui': path.resolve(
        __dirname,
        '../../packages/safe-money-ui/src/money/index.ts',
      ),
    },
  },
};
