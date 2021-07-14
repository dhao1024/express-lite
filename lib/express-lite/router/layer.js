import { pathToRegexp } from 'path-to-regexp';

let _layerID = 0;

export default function Layer(path, fn, options) {
  const opts = options || {};

  this.name = fn.name || `<layer-${_layerID++}>`;
  this.raw = fn;
  this.path = undefined;
  this.params = undefined;
  this.keys = [];
  this.regexp = pathToRegexp(path, this.keys, opts);
}

Layer.prototype.match = function match(err, path) {
  return this.matchArgs(err) && this.matchPath(path);
};

Layer.prototype.matchArgs = function matchArgs(err) {
  const fn = this.raw.handle || this.raw;

  if (err && fn.length === 4) {
    return true;
  }
  if (!err && fn.length < 4) {
    return true;
  }

  return false;
};

Layer.prototype.matchPath = function matchPath(path) {
  if (path === '/') {
    this.params = {};
    this.path = '/';
    return true;
  }

  const match = this.regexp.exec(path);

  if (match) {
    this.params = {};
    [this.path] = match;

    for (let i = 1; i < match.length; i++) {
      const { name } = this.keys[i - 1];
      this.params[name] = decodeURIComponent(match[i]);
    }

    return true;
  }

  return false;
};

Layer.prototype.handle = function handle(err, req, res, next) {
  const fn = this.raw.handle?.bind(this.raw) || this.raw;

  try {
    if (err) {
      fn(err, req, res, next);
    } else {
      fn(req, res, next);
    }
  } catch (e) {
    next(e);
  }
};
