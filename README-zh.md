# Express-lite

[Express](https://github.com/expressjs/express) 是一个简洁而灵活的 Node.js Web 应用框架, 使用 Express 可以快速地搭建一个完整功能的网站. Express 的核心特性包括设置中间件来响应 HTTP 请求, 定义路由表用于执行不同的 HTTP 请求动作, 可以通过向模板传递参数来动态渲染 HTML 页面.

Express-lite 简化了 Express 的代码, 只保留了中间件和路由表等核心功能, 部分地方根据我的理解进行了重构. Express-lite 是一个用于学习的版本, 不能保证完全兼容 Express, 也不能保证在生产环境中正常工作.

## 支持

[v1.0.0](https://github.com/dhao1024/express-lite/tree/v1.0.0)
* [x] 中间件
* [x] 路由表注册
* [x] 处理含参数的路由表

[v1.1.0](https://github.com/dhao1024/express-lite/tree/v1.1.0)
* [x] 递归调用优化
* [ ] 处理含参数的请求(url)
* [ ] 处理请求头
* [ ] 模板渲染

## 与 Express 相比较

### 中间件

* 在 Express 中, 中间件(Layer对象)是对形如 `foo(req, res, next)` 的函数的包装. Express-lite 可以将任意对象包装成一个中间件, 并将原始对象保存在属性 `raw` 中, 调用时先检查原始对象的 `handle` 属性, 如果没有则将原始对象看作函数对象进行调用.
* Express 创建中间件时如果传入一个匿名函数, 则将中间件均命名为`<anouymous>`, 为了方便调试, Express-lite 会对匿名函数和没有 `name` 属性的对象进行编号, 将中间件命名为`<layer-${i++}>` 以便于区分.

### 路由器

* 在 Express 中, 路由器(Router对象)是比较复杂的中间件, 除了函数的主体部分以外, 还包括注册其他中间件和注册路由的功能, 路由器本身是一个函数对象. 在 Express-lite 中, 路由器是一个普通的对象, 可执行的部分仍然在属性 `handle` 中, 创建路由器对象是可以传入一个字符串作为路由器的名字, 如果缺省则自动进行编号命名.

### 路由表注册

* 和 Express 一样, 路由表注册和匹配由[path-to-regexp](https://github.com/pillarjs/path-to-regexp)提供, 但是 Express-lite 使用了较新的版本.
  + 不支持含 `*` 的路由表
  + 非严格模式下,  `'/foo/'` 不能匹配路径 `/foo`

### 其他未列出的差异

## 递归调用

中间件中每一次调用 `next()` 都是递归调用, 函数不能立即返回, 必须等到最内层函数返回时, 才能从内至外逐渐释放函数调用栈.

Express 有一个特点, 每次调用 `next()` 都是在函数的最后一句, 因此程序可以对其进行 `尾调用优化` . 很遗憾的是, 如果使用的是较新的 Node.js 版本, 已经不再支持尾调用优化了.

## 递归调用的改进

在 Express-lite 中, 消除了Router和Route对象中的递归调用, 改进后仍然兼容原来的大部分中间件( `next()` 在函数尾部均满足).

以 Router 对象为例, Router 对象添加了一个属性 `state` , 保存中间件的调用结果. Router 对象还添加了一个方法 `next()` , 将其传递给Layer对象, 当Layer对象调用 `next()` 时就会修改 Router.state 的值. 因此调用 Layer 对象是立即返回的, Router 对象通过检查 state 属性来获取 Layer 对象来判断应该遍历下一个中间件还是处理发生的错误.
