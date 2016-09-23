---
title: "Python concurrent.futures 文档翻译"
date: 2016-09-23 11:19:16
tags: [Python, 翻译]
---

__摘要__:

> 本文主要是对 Python3 标准库 [concurrent.futures](https://docs.python.org/3/library/concurrent.futures.html) 文档的翻译
<!-- more -->

concurrent.futures 模块为异步执行可调用的对象提供了一个高级的接口。

异步执行可以通过线程来实现，使用 [ThreadPoolExecutor](https://docs.python.org/3/library/concurrent.futures.html#concurrent.futures.ThreadPoolExecutor) 模块，或者使用 [ProcessPoolExecutor](https://docs.python.org/3/library/concurrent.futures.html#concurrent.futures.ProcessPoolExecutor) 模块通过分离进程来实现。两种实现都有同样的接口，他们都是通过抽象类 [Executor](https://docs.python.org/3/library/concurrent.futures.html#concurrent.futures.Executor) 来定义的。

## Executor 对象

> `class concurrent.futures.Executor`

> 这是一个抽象类，用来提供方法去支持异步地执行调用，它不应该被直接调用，而是应该通过具体的子类来使用。

> `submit(fn, *args, **kwargs)`
>> 可调用对象的调度器，`fn`参数将会以`fn(*args, **kwargs)`的形式来调用，同时返回一个 Future 对象代表了可调用对象的执行情况。

>> ```
with ThreadPoolExecutor(max_workers=1) as executor:
     future = executor.submit(pow, 323, 1235)
     print(future.result())
```

> `map(func, *iterables, timeout=None, chunksize=1)`

>> 和`map(func, *iterables)`函数的作用基本相同，除了`func`是被异步执行的，而且几个对于`func`调用可能是同时执行的。这个函数返回的迭代器调用`__next__()`方法的时候，如果在`timeout`秒内结果不可用，那么迭代器将会从原始调用的函数向`Executor.map()`抛出一个`concurrent.futures.TimeoutError`的异常。`timeout`既能是一个整数，也能是一个浮点数。如果`timeout`没有指定的话或者等于 None 的话，那么等待时间就没有限制。如果调用函数抛出了一个异常，那么当迭代器取到这个函数的时候，异常将会被抛出。
>> 当使用`ProcessPoolExecutor`的时候，这个方法将`iterables`切成许多块，然后将这些内容作为分离的任务提交到进程池中。每个块的大概的尺寸能够通过`chunksize`(大于0的正整数)的参数来指定。当`iterables`非常大的时候，和`chunksize`默认等于1相比，将`chunksize`设置为一个很大的值，将会显著地提升性能。在使用`ThreadPoolExecutor`的情况下，`chunksize`的大小没有影响。

>> Python 3.5新增功能：添加了`chunksize`参数

> `shutdown(wait=True)`

>> 告诉执行器，当当前阻塞的 futures 执行完了以后，它应该释放所有它使用的资源。在`shutdown`函数之后再来调用`Executor.submit()`和`Executor.map()`将会抛出`RuntimeError`

>> 如果`wait`等于 True 的话，这个方法不会立即返回，而直到所有阻塞的 futures 都返回，而且和这个执行器所有相关的资源都被释放以后，这个函数才会返回。 如果`wait`设置为 False ，那么这个方法会立刻返回，而和这个执行器所有相关的资源只有等到所有阻塞的 futures 都执行完以后才会被释放。而无论`wait`参数的值是什么，整个 Python 程序都会等到所有阻塞的 futures 执行完毕以后才会退出。

>> 通过`with`语句，可以避免明确地来调用这个方法，它在执行完以后将会自动关闭`Executor`。(调用 Executor.shutdown() 时`wait`会被设置为True，这将会等待所有 future 执行完毕)

>> ```
import shutil
with ThreadPoolExecutor(max_workers=4) as e:
    e.submit(shutil.copy, 'src1.txt', 'dest1.txt')
    e.submit(shutil.copy, 'src2.txt', 'dest2.txt')
    e.submit(shutil.copy, 'src3.txt', 'dest3.txt')
    e.submit(shutil.copy, 'src4.txt', 'dest4.txt')
```
