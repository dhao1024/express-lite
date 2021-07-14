# Express-lite

[Express](https://github.com/expressjs/express) is a minimaliest and flexible `Node.js` web application framework, and Express can quickly build a full-featured website. The core features of Express include adding middleware to pass HTTP requests one after another, registering routing tables to respond to HTTP requests, and dynamically rendering the HTML page base on template.

Express-lite simplifies the code of Express, only keeps the core code related to middleware and router, and some code is refactored according to my understanding. Express-lite is a version used to learn, which cannot guarantee fully compatibility with Express, does not guarantee proper work in the production environment.

## Support

v1.0.0
* [x] Middleware
* [x] Routing table registration
* [x] Register routing tables with parameters
* [ ] Recursive call optimization
* [ ] Process HTTP requests URL with query
* [ ] Process HTTP requests headers
* [ ] Template rendering

## Compare with Express

### Middleware

* In Express, the middleware (Layer object) is a wrapper of function such as `foo(req, res, next)`. And in Express-lite, the middleware is a wrapper of any object, and save the original object in attribute `raw`. When Layer object is called, check the original object's attribute `handle`, if it is not defined the original object will be called.
* In Express, when Layer get an anonymous function, Layer will be named `<anouymous>`, and in Express-lite, Layer is named `<Layer-${i++}>` to distinguish.

### Router

* In Express, the router (Router object) is a complicated middleware, except for executable code, also includes the method of registering other middleware and routing tables, and the router itself is a function object. In Express-lite, the router is a normal object, the executable code is still in the attribute `handle`, When you create a router object, you can pass a string parameter as the name of the router, if the default is `<Router-${i++}>`.

### Routing table registration

* Like Express, routing table registration and matching is provided by [path-to-regexp](https://github.com/pillarjs/path-to-regexp), but Express-lite is using a newer version.
  + Not support routing tables with `*`
  + in Non-Strict mode,  `'/foo/'` can't match the path` /foo`

### Other differences not listed

## Recursion call

Each time the middleware calls `next()` is a recursive call, the function cannot return immediately, and must wait until the inner function returns to release the function call stack.

Express has a feature that each call `next()` is in the last line of the function( `trail call` ), so the program can be optimized automaticlly if it is supported. Unfortunately, if you use a new Node.js version, it is no longer supported to optimize the tail call.
