import EventEmitter from 'events';
import mixin from 'merge-descriptors';
import serveStatic from 'serve-static';

import appMixin from './application.js';
import Router from './router/index.js';

export default function createApp() {
  function app(req, res) {
    app.handle(req, res);
  }

  mixin(app, EventEmitter.prototype, false);
  mixin(app, appMixin, false);

  app.init();

  return app;
}

createApp.Router = Router;
createApp.static = serveStatic;
