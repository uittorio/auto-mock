const copy = require('copy-webpack-plugin');
const path = require('path');
const Dotenv = require('dotenv-webpack');
const development = 'development';
const activeEnv = process.env.NODE_ENV || development;

exports.onCreateWebpackConfig = ({
  _stage,
  _rules,
  _loaders,
  _plugins,
  actions,
}) => {
  actions.setWebpackConfig({
    resolve: {
      alias: {
        fs: 'fake-fs',
        typescript: 'fake-fs',
      },
    },
    plugins: [
      new copy({
        patterns: [
          { from: path.resolve('..', '..', 'data'), to: 'resources' },
          { from: path.resolve('..', '_config.yml'), to: '' },
        ],
      }),
      new Dotenv({
        path: resolveEnvironmentVariables(activeEnv),
      }),
    ],
  });
};

function resolveEnvironmentVariables(env) {
  const isDevelopment = env === development;

  if (isDevelopment) {
    return path.resolve('..', '.env.development');
  }

  return path.resolve('..', '.env');
}
