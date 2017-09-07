---
title: 简单聊聊Flask中的request,g
date: 2017-01-22 23:40:08
tags: [Python, Flask]
draft: true
---

> 简单说了一下Flask中的应用上下文，请求上下文，以及 request,g 和 session 这三个变量。

<!--more-->

## 前言

　最近在了解Flask，一开始看到它的 request,g 和 session 的时候，感觉很迷惑，这是什么鬼，全局变量么，为什么能在每个请求中用，为啥每个请求中的值都不同，后来才慢慢了解到应用上下文和请求上下文的概念，才知道这三个变量是啥。故写下这篇文章，记录一下自己的了解。

## Thread Local

　要理解 flask 的上下文机制，我们首先要理解线程的私有数据。我们知道，一个进程可以有多个线程，它们是共享进程的地址空间的，也就是说整个进程的数据都是被所有线程共享的。而线程私有数据就是存储和查询某个线程相关的数据的一种机制，用来申请一片空间，保存只与某个线程相关的数据。关于这方面的更多内容，请参考《Unix环境高级编程》12.6节。

　我们可以用如下的Python代码，来验证线程的私有数据：

```py
#!/usr/bin/env python

import threading
from types import SimpleNamespace

local_data = threading.local()
global_data = SimpleNamespace()

global_data.foo = "main"
local_data.bar = "main"

class AnotherThread(threading.Thread):
    def run(self):
        global_data.foo = "hello"
        local_data.bar = "hello"
        print(global_data.foo, local_data.bar)

t = AnotherThread()
t.start()
t.join()

print(global_data.foo, local_data.bar)

## 程序输出
hello hello
hello main
```

　从程序的输出中我们可以看出，定义的全局变量已经被子线程给修改了，但是定义的线程私有数据并未被子线程给修改，每个线程都有自己的私有数据。

## Werkzeug 中的 LocalStack 和 LocalProxy

## Flask 中的应用

## 一个小例子
