---
title: Werkzeug 的 wsgi-app 说明
date: 2017-01-23 17:31:00
tags: [Python, Werkzeug]
---

> 1. 简要说明了一下WSGI
> 2. 分析了Werkzeug的一个官方例子
<!--more-->

## WSGI

为了简化 Web 程序的开发，我们把 Web 程序分成了『Web服务器』，『中间件』和『Web应用程序』三部分。把一些枯燥，重复的工作(例如，解析 HTTP 请求，构造 HTTP 响应)交给 Web 服务器去做，把业务逻辑相关的工作放到 Web 应用程序中（例如判断表单是否合法，将表单输入存入数据库等），而中间件则是针对 Web 应用程序的装饰器，可以让我们在 Web 应用程序之外对 Web 请求或者响应做一些特殊的处理。

WSGI（Python Web Server Gateway Interface）是一种协议，规定了『Web服务器』，『Web应用程序』，『中间件』这三者之间进行通信的方式。

  在 WSGI 中， Web 服务器会得到一个可调用的 app 参数(即 Web 应用程序)。每次它接收到这个 HTTP 请求以后就会调用一次这个 app ，然后将返回值作为 HTTP 响应体输出出去。在 WSGI 中，Web 应用程序是这样定义的：

```py
def simple_app(environ, start_response):
    """Simplest possible application object

    environ: 包含了 HTTP 请求的相关信息
    start_response: 一个用来发送 HTTP 响应包头部的函数
    return: HTTP 响应包的包体
    """
    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)
    return ['Hello world!\n']
```

## Werkzeug

Werkzeug 是一个 WSGI 实用程序库，它实现了 Web 服务器的功能，定义了一些通用的中间件，并对一些常用功能进行了封装，让我们可以在它的基础上定义自己的 Web 应用程序。

## 简单分析一个官方例子

  OK，说完了 Werkzeug，我们再来看用 Werkzeug 编写 Web 应用程序的一个官方例子。这个例子的代码可以在[Github](https://github.com/pallets/werkzeug/tree/master/examples/shortly)上找到，所以我们这里并不会贴出全部代码，只分析其中的关键部分。

  首先来从它的主函数入手，我们可以看到这里的 app ，就相当于是我们的 Web 应用程序，而 werkzeug 的`run_simple`函数则为我们提供了 Web 服务器的功能。在这里， Web 服务器每收到一个 Web 请求，就会调用一次 app ，并从中获取 HTTP 响应并输出。

```py
if __name__ == '__main__':
    from werkzeug.serving import run_simple
    app = create_app()
    run_simple('127.0.0.1', 5000, app, use_debugger=True, use_reloader=True)
```

  接着我们来看一下这个`app`调用的时候发生了什么，

```py
class Shortly:
    ...

    def dispatch_request(self, request):
        adapter = self.url_map.bind_to_environ(request.environ)
        try:
            endpoint, values = adapter.match()
            return getattr(self, 'on_' + endpoint)(request, **values)
        except NotFound as e:
            return self.error_404()
        except HTTPException as e:
            return e

    def wsgi_app(self, environ, start_response):
        request = Request(environ)
        response = self.dispatch_request(request)
        return response(environ, start_response)

    def __call__(self, environ, start_response):
        return self.wsgi_app(environ, start_response)

def create_app(redis_host='localhost', redis_port=6379, with_static=True):
    app = Shortly({
        'redis_host':       redis_host,
        'redis_port':       redis_port
    })
    if with_static:
        app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
            '/static':  os.path.join(os.path.dirname(__file__), 'static')
        })
    return app
```

从上面可以看出，`app`调用的时候，基本上就在调用`wsgi_app`函数，这个函数具体的工作流程如下:

+ 首先将 Web 服务器传过来的`environ`变量封装成请求对象，然后根据这个请求对象去分发请求。
+ 请求分发
    + 就是根据URL路由map去定位这个请求对应的`endpoint`（`endpoint`相当于flask中的视图函数）
    + 调用这个`endpoint`去获取响应对象。
+ 最后在`wsgi_app`函数中，调用响应对象，此时 HTTP 响应才真正从Web应用程序发送到了Web服务器。

此外，我们还可以看到，`app`创建好了以后，还调用了一个`SharedDataMiddleware`中间件，从中间件的调用方式可以看出，它接收一个可调用对象的参数，返回一个可调用对象，这就相当于就是一个装饰器，对『Web应用程序』进行装饰。
而`SharedDataMiddleware`这个中间件的功能就是检查请求的URL，如果请求的URL符合`/static`的模式，直接返回一个文件作为响应，不再将这个请求传递给Web应用程序。
