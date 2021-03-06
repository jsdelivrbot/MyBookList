/**
 * Created by val on 9/26/16.
 */

'use strict';

import errorHandler from 'errorhandler';
import express from 'express';
import path from 'path';
import config from './env';

export default function (app) {
  const env = app.get('env');

  app.use(express.static(path.join(config.root, '.tmp')));

  app.set('appPath', path.join(config.root, 'client'));
  app.use(express.static(app.get('appPath')));

  app.set('views', `${config.root}/server/views`);
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');

  const webpackDevMiddleware = require('webpack-dev-middleware');
  const stripAnsi = require('strip-ansi');
  const webpack = require('webpack');
  const webpackConfig = require('../../webpack.config.babel');
  const compiler = webpack(webpackConfig);
  const browserSync = require('browser-sync').create();

  browserSync.init({
    open: false,
    logFileChanges: false,
    proxy: `localhost:${config.port}`,
    ws: true,
    middleware: [
      webpackDevMiddleware(compiler, {
        noInfo: false,
        stats: {
          colors: true,
          timings: true,
          chunks: false,
        },
      }),
    ],
    port: config.browserSyncPort,
    plugins: ['bs-fullscreen-message'],
  });

  compiler.plugin('done', (stats) => {
    console.log('webpack done hook');
    if (stats.hasErrors() || stats.hasWarnings()) {
      return browserSync.sockets.emit('fullscreen:message', {
        title: 'Webpack Error:',
        body: stripAnsi(stats.toString()),
        timeout: 100000,
      });
    }
    browserSync.reload();
  });

  app.use(errorHandler());
}
