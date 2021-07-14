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
  this.state = { err: undefined, done: false };
}

Route.prototype._next = function next(err) {
  this.state.err = err;
  this.state.done = false;
};

Route.prototype.handle = function handle(req, res, done) {
  debug.enter('enter %o (%d layers): dispatching %o',
    this.name, this.stack.length, req.url);

  let method = req.method.toLowerCase();
  if (method === 'head' && !this.methods.has('head')) {
    method = 'get';
  }

  const next = this._next.bind(this);
  next(); // reset `this.state`

  let idx = 0;
  let layer;
  let err;

  while (idx < this.stack.length) {
    layer = this.stack[idx++];
    debug('- try match layer%s: %s', errorFormat(err), signature(layer));

    if (!layer.matchArgs(err)) {
      continue;
    }
    if (layer.raw.method !== 'all' && layer.raw.method !== method) {
      continue;
    }

    this.state.done = true;
    layer.handle(err, req, res, next);
    err = this.state.err;

    if (err === 'route') {
      debug.exit('exit route %o: singnal <route>', this.name);
      done();
      return;
    }
    if (err && err === 'router') {
      debug.exit('exit route %o: signal <router>', this.name);
      done(err);
      return;
    }
    if (this.state.done) {
      debug.exit('exit route %o', this.name);
      return;
    }
  }

  debug.exit('exit route%s %o', errorFormat(err), this.name);
  done(err);
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
