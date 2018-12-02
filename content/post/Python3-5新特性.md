---
title: "Python3.5新特性"
date: 2016-05-08 14:27:17
tags: [Python, 翻译]
---

__摘要__:

> 1. Python3.5的新特性，[原文地址](https://docs.python.org/3/whatsnew/3.5.html)
> 2. 用`async`和`await`等新语法来进行协程编程


<!--more-->

## 原文链接

[What’s New In Python 3.5](https://docs.python.org/3/whatsnew/3.5.html)

## PEP 492 - Coroutines with async and await syntax

通过添加`awaitabel`对象，协程函数，异步迭代器和异步内容管理器，PEP492极大地提升了在Python中进行协程编程的能力。

通过`async func`语法可以声明一个协程函数，如下所示:

```python
async def coro():
    return 'span'
```

在一个协程函数内部，新的`await`表达式可以用来暂停协程的执行，直到新的结果可用，任何对象都可以被await化，只要这个对象通过定义`__await__`函数实现了`awaitabel`协议

PEP492 也添加了`async for`语句来方便进行异步迭代器的迭代。

### 示例: 基本的Http客户端

```python
import asyncio

async def http_get(domain):
    reader, writer = await asyncio.open_connection(domain, 80)

    writer.write(b'\r\n'.join([
        b'GET / HTTP/1.1',
        b'Host: %b' % domain.encode('latin-1'),
        b'Connection: close',
        b'', b''
    ]))

    async for line in reader:
        print('>>>', line)

    writer.close()

loop = asyncio.get_event_loop()
try:
    loop.run_until_complete(http_get('baidu.com'))
finally:
    loop.close()
```

在上面的程序中，首先定义了一个事件循环和一个协程函数，协程函数跑在事件循环上，在协程函数内部，异步地去请求服务端的连接，连接成功建立以后，再向服务端发出Http请求，返回的Http相应被存储在reader这个异步迭代器中，然后再来通过`async for`来遍历出这个异步迭代器的所有结果。

程序的输入如下:

```
>>> b'HTTP/1.1 200 OK\r\n'
>>> b'Date: Sun, 08 May 2016 07:33:29 GMT\r\n'
>>> b'Server: Apache\r\n'
>>> b'Last-Modified: Tue, 12 Jan 2010 13:48:00 GMT\r\n'
>>> b'ETag: "51-47cf7e6ee8400"\r\n'
>>> b'Accept-Ranges: bytes\r\n'
>>> b'Content-Length: 81\r\n'
>>> b'Cache-Control: max-age=86400\r\n'
>>> b'Expires: Mon, 09 May 2016 07:33:29 GMT\r\n'
>>> b'Connection: Close\r\n'
>>> b'Content-Type: text/html\r\n'
>>> b'\r\n'
>>> b'<html>\n'
>>> b'<meta http-equiv="refresh" content="0;url=http://www.baidu.com/">\n'
>>> b'</meta>html>\n'
```

### 示例: 上下文管理器

除了异步迭代器之外，还有新的语法支持异步的上下文管理器(关于上下文管理器可以参考我的这篇文章[Python的with语句](http://www.bwangel.win/2016/04/25/Python%E7%9A%84with%E8%AF%AD%E5%8F%A5/))，示例程序如下:

```py
import asyncio

async def coro(name, lock):
    print('coro {}: waiting for lock'.format(name))
    async with lock:
        print('coro {}: holding the lock'.format(name))
        await asyncio.sleep(1)
        print('coro {}: releasing the lock'.format(name))

loop = asyncio.get_event_loop()
lock = asyncio.Lock()
coros = asyncio.gather(coro(1, lock), coro(2, lock))
try:
    loop.run_until_complete(coros)
finally:
    loop.close()
```

在上面的程序中，通过`asyncio.gather`函数将两个协程函数定义的协程对象生成一个future对象，然后通过一个事件循环去运行这个future对象。
在协程函数内部，主要就是异步的获取锁，并且和with语句结合，可以在获取以后自动释放锁。


程序的运行结果如下:

```
coro 1: waiting for lock
coro 1: holding the lock
coro 2: waiting for lock
coro 1: releasing the lock
coro 2: holding the lock
coro 2: releasing the lock
```

需要注意的是`async with`和`async for`必须运行在`async def`定义的协程函数内部。
协程函数必须运行在一个兼容的事件循环之上，例如`asyncio loop`
