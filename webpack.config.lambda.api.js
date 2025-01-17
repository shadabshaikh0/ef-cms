const config = require('./webpack.config.lambda');

module.exports = {
  ...config,
  entry: {
    api: './web-api/terraform/template/lambdas/api.js',
    'api-public': './web-api/terraform/template/lambdas/api-public.js',
    'cognito-authorizer':
      './web-api/terraform/template/lambdas/cognito-authorizer.js',
    'cognito-triggers':
      './web-api/terraform/template/lambdas/cognito-triggers.js',
    cron: './web-api/terraform/template/lambdas/cron.js',
    'handle-bounced-service-email':
      './web-api/terraform/template/lambdas/handle-bounced-service-email.js',
    'maintenance-notify':
      './web-api/terraform/template/lambdas/maintenance-notify.js',
    'public-api-authorizer':
      './web-api/terraform/template/lambdas/public-api-authorizer.js',
    'seal-in-lower-environment':
      './web-api/terraform/template/lambdas/seal-in-lower-environment.js',
    streams: './web-api/terraform/template/lambdas/streams.js',
    'websocket-authorizer':
      './web-api/terraform/template/lambdas/websocket-authorizer.js',
    websockets: './web-api/terraform/template/lambdas/websockets.js',
  },
  externals: ['aws-sdk', '@sparticuz/chrome-aws-lambda'],
  output: {
    clean: true,
    libraryTarget: 'umd',
    path: __dirname + '/web-api/terraform/template/lambdas/dist',
  },
};
