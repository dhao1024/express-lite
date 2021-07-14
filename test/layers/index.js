export default {};

export function echo(msg = 'express') {
  return (req, res) => {
    res.end(msg);
  };
}

export function reflect(attr = 'url') {
  return (req, res) => {
    const [a, b] = attr.split('.');
    if (b) {
      res.end(req[a][b]);
    } else {
      res.end(req[a]);
    }
  };
}

export function error(tip = 'error') {
  return () => {
    throw new Error(tip);
  };
}

export function errorCatcher() {
  return (err, req, res, next) => {  //eslint-disable-line
    res.end(err.message);
  };
}

export function signal(sig) {
  return (req, res, next) => {
    next(sig);
  };
}

function next_() {
  return (req, res, next) => {
    next();
  };
}
export { next_ as next };
