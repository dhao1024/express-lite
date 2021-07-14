import debug from 'debug';

export default {};

export const METHODS = [
  'get', 'post', 'head', 'options',
  'patch', 'put', 'delete', 'connect', 'trace',
].concat('all');

export function signature(layer) {
  const handle = layer.raw.handle || layer.raw;
  const argNames = ['err', 'req', 'res', 'next'];
  let args;

  if (handle.length > 4) {
    args = 'bad arguments';
  }
  if (handle.length === 4) {
    args = argNames.join(', ');
  }
  args = argNames.slice(1, handle.length + 1).join(', ');

  return `${layer.name}(${args})`;
}

export function errorFormat(err) {
  if (err === 'route') {
    return '(route)';
  }
  if (err === 'router') {
    return '(router)';
  }
  if (err) {
    return '(err)';
  }
  return '';
}

let indentSize = 0;

export function createDebug(namespace = 'express', indentStyle = '   ') {
  const _debug = debug(namespace);

  function debugWithIndent(...args) {
    args.splice(1, 0, indentStyle.repeat(indentSize));
    args.splice(0, 1, `%s${args[0]}`);

    _debug(...args);
  }

  debugWithIndent.enter = function enter(...args) {
    debugWithIndent(...args);
    indentSize++;
  };

  debugWithIndent.exit = function exit(...args) {
    if (indentSize > 0) indentSize--;
    debugWithIndent(...args);
  };

  debugWithIndent.reset = function reset() {
    indentSize = 0;
  };

  return debugWithIndent;
}
