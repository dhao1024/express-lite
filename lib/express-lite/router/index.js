import Route from './route.js';
import Layer from './layer.js';
import {
  METHODS, createDebug, signature, errorFormat,
} from '../utils.js';

const debug = createDebug('express:router');

let _routerID = 0;

function Router(name, options) {
  const opts = options || {};

  this.name = name || `<router-${_routerID++}>`;
  this.caseSensitive = opts.caseSensitive || false;
  this.strict = opts.strict || false;
  this.mergeParams = opts.mergeParams || false;
  this.stack = [];
  this.state = { err: undefined, done: false };
}

Router.prototype._next = function next(err) {
  this.state.err = err;
  this.state.done = false;
};

Router.prototype.handle = function handle(req, res, done) {
  debug.enter('enter router %o(%d layers): dispatching %o',
    this.name, this.stack.length, req.url);

  const path = req.url;
  const next = this._next.bind(this);
  next(); // reset `this.state`

  let idx = 0;
  let layer;
  let err;

  while (idx < this.stack.length) {
    layer = this.stack[idx++];
    debug('- try match layer%s: %s', errorFormat(err), signature(layer));

    if (!layer.match(err, path)) {
      continue;
    }
    if (this.mergeParams) {
      Object.assign(req.params, layer.params);
    } else {
      req.params = layer.params;
    }

    req.url = path;
    if (layer.path !== '/' && !layer.raw.ignoreTrim) {
      req.url = req.url.slice(layer.path.length);
      if (!req.url.startsWith('/')) {
        req.url = `/${req.url}`;
      }
    }

    this.state.done = true;
    layer.handle(err, req, res, next);
    err = this.state.err;

    if (err && err === 'router') {
      debug.exit('exit router %o: signal <router>', this.name);
      done();
      return;
    }
    if (this.state.done) {
      debug.exit('exit router %o', this.name);
      return;
    }
  }

  debug.exit('exit router%s %o', errorFormat(err), this.name);
  done(err);
};

Router.prototype.use = function use(...args) {
  const flattenArgs = args.flat(2);

  let path;
  let fns;

  if (typeof flattenArgs[0] === 'function') {
    path = '/';
    fns = flattenArgs;
  } else {
    [path, ...fns] = flattenArgs;
  }

  debug('%o: use %o', this.name, path);

  fns.forEach((fn) => {
    if (typeof fn !== 'function' && typeof fn.handle !== 'function') {
      throw new Error('Router.use() requires a middleware function');
    }

    const layer = new Layer(path, fn, {
      sensitive: this.caseSensitive,
      strict: false,
      end: false,
    });

    this.stack.push(layer);
    debug('add layer: %s', signature(layer));
  });

  return this;
};

Router.prototype.route = function route(path) {
  const route_ = new Route(path);

  const layer = new Layer(path, route_, {
    sensitive: this.caseSensitive,
    strict: this.strict,
    end: true,
  });

  this.stack.push(layer);
  debug('%o: new route %o', this.name, layer.name);

  return route_;
};

METHODS.forEach((method) => {
  Router.prototype[method] = function addRoute(path, ...fns) {
    const route = this.route(path);
    route[method](...fns);
    return this;
  };
});

export default function createRouter(...args) {
  let name;
  let opts;

  if (typeof args[0] === 'string') {
    [name, opts] = args;
  } else {
    [opts, name] = args;
  }

  const router = new Router(name, opts);
  debug('new router: %o', router.name);
  return router;
}
