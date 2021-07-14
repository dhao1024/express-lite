import http from 'http';
import finalhandler from 'finalhandler';

import Router from './router/index.js';
import { METHODS, createDebug } from './utils.js';

const debug = createDebug('express:application');

const appMixin = {};
export default appMixin;

appMixin.init = function init() {
  this.settings = {};
  this.defaultConfig();

  this._router = new Router('express', {
    caseSensitive: this.enabled('case sensitive routing'),
    strict: this.enabled('strict routing'),
    end: false,
  });
};

appMixin.defaultConfig = function defaultConfig() {
  const env = process.env.NODE_ENV || 'development';

  this.enable('x-powered-by');
  this.set('env', env);

  debug('booting in %o mode', env);
};

appMixin.handle = function handle(req, res) {
  debug('%o', `${req.method} ${req.url}`);

  setImmediate((r) => {
    debug('%o', `${r.statusCode} ${r.statusMessage}`);
  }, res);

  const done = finalhandler(req, res, {
    env: this.get('env'),
  });

  req.originalUrl = req.url;
  req.params = {};

  this._router.handle(req, res, done);
  debug.reset();
};

appMixin.use = function use(...args) {
  this._router.use(...args);
  return this;
};

appMixin.route = function route(path) {
  return this._router.route(path);
};

METHODS.forEach((method) => {
  if (method === 'get') return;

  appMixin[method] = function addRoute(path, ...fns) {
    this._route[method](path, ...fns);
    return this;
  };
});

appMixin.get = function get(path, ...fns) {
  if (fns.length === 0) {
    return this.settings[path];
  }

  this._router.get(path, ...fns);
  return this;
};

appMixin.set = function set(setting, val = true) {
  this.settings[setting] = val;
  debug('set %o to %o', setting, val);

  return this;
};

appMixin.enable = function enable(setting) {
  return this.set(setting, true);
};

appMixin.disable = function disable(setting) {
  return this.set(setting, false);
};

appMixin.enabled = function enabled(setting) {
  return Boolean(this.settings[setting]);
};

appMixin.disabled = function disabled(setting) {
  return !this.settings[setting];
};

appMixin.listen = function listen(...args) {
  const server = http.createServer(this);
  return server.listen(...args);
};
