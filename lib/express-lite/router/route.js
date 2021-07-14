import {
  METHODS, signature, createDebug, errorFormat,
} from '../utils.js';
import Layer from './layer.js';

const debug = createDebug('express:router');

export default function Route(path) {
  this.name = `route[${path}]`;
  this.path = path;
  this.ignoreTrim = true;
  this.methods = new Set();
  this.stack = [];
}

Route.prototype.handle = function handle(req, res, done) {
  debug.enter('enter %o (%d layers): dispatching %o',
    this.name, this.stack.length, req.url);

  const { stack } = this;
  const self = this;
  let idx = 0;

  let method = req.method.toLowerCase();
  if (method === 'head' && !this.methods.has('head')) {
    method = 'get';
  }

  function next(err) {
    if (err === 'route') {
      debug.exit('exit %o: singnal <route>', self.name);
      done();
      return;
    }

    if (err === 'router') {
      debug.exit('exit %o: singnal <router>', self.name);
      done(err);
      return;
    }

    let match = false;
    let layer;

    while (!match && idx < stack.length) {
      layer = stack[idx++];
      match = layer.matchArgs(err);

      if (layer.raw.method !== 'all' && layer.raw.method !== method) {
        match = false;
      }

      debug('- try match layer%s: %s', errorFormat(err), signature(layer));
    }

    if (!match) {
      debug.exit('exit %o: failed', self.path);
      done(err);
      return;
    }

    layer.handle(err, req, res, next);
  }

  next();
};

Route.prototype.getMethods = function getMethods() {
  const methods = [];

  this.methods.forEach((method) => {
    methods.push(method.toUpperCase());
  });

  if (this.methods.has('get') && !this.methods.has('head')) {
    methods.push('HEAD');
  }

  return methods.sort();
};

Route.prototype.hasMethod = function hasMethod(method) {
  let bool = this.methods.has('all') || this.methods.has(method.toLowerCase());

  if (!bool && method.toLowerCase() === 'head') {
    bool = this.methods.has('get');
  }

  return bool;
};

METHODS.forEach((method) => {
  Route.prototype[method] = function addcallback(...fns) {
    for (let i = 0, fn; i < fns.length; i++) {
      fn = fns[i];

      if (typeof fn !== 'function') {
        const msg = `Route.${method}() requires a callback function`;
        throw new Error(msg);
      }

      fn.method = method;
      this.methods.add(method);

      const layer = new Layer('/', fn, {});
      this.stack.push(layer);

      debug('add %o: %s', method.toUpperCase(), signature(layer));
    }

    return this;
  };
});
