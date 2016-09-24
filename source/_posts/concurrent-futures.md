---
title: "[未完成]Python concurrent.futures 文档翻译"
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

>> ```python
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

>> ```python
import shutil
with ThreadPoolExecutor(max_workers=4) as e:
    e.submit(shutil.copy, 'src1.txt', 'dest1.txt')
    e.submit(shutil.copy, 'src2.txt', 'dest2.txt')
    e.submit(shutil.copy, 'src3.txt', 'dest3.txt')
    e.submit(shutil.copy, 'src4.txt', 'dest4.txt')
```

## ThreadPoolExecutor

`ThreadPoolExecutor`是`Executor`的子类，使用一个线程池去异步地执行调用。

当一个 Future 关联的调用等待另外一个 Future 的执行结果的时候，死锁就有可能发生，例如下面的例子：

```python
import time

def wait_on_b():
    time.sleep(5)
    print(b.result())  # b 永远不会完成，因为它等待着 a 的结果
    return 5

def wait_on_a():
    time.sleep(5)
    print(a.result()) # a 永远不会完成，因为它等待着 b 的结果
    return 6

executor = ThreadPoolExecutor(max_workers=2)
a = executor.submit(wait_on_b)
b = executor.submit(wait_on_a)
```

和这个例子：

```python
def wait_on_future():
    f = executor.submit(pow, 5, 2)
    # 这个也永远不会完成，因为线程池里面最多只能有一个线程，而它现在正在执行着这个函数。
    print(f.result())

executor = ThreadPoolExecutor(max_workers=1)
executor.submit(wait_on_future)
```

> `class concurrent.futures.ThreadPoolExecutor(max_workers=None)`

>> 一个`Executor`的子类，使用线程池中最多`max_workers`个线程去异步地执行回调。
>> Python 3.5中的改变：如果`max_workers`参数为None或者没有给定，那么它将会被默认设置成为机器的CPU核数乘5。这里假设`ThreadPoolExecutor`经常被用来执行IO密集型的工作而不是CPU密集型的工作，工作者的个数应该比`ProcessPoolExecutor`的工作者的个数要多。

### ThreadPoolExecutor 例子

```python
import concurrent.futures
import urllib.request

URLS = ['http://www.foxnews.com/',
        'http://www.cnn.com/',
        'http://europe.wsj.com/',
        'http://www.bbc.co.uk/',
        'http://some-made-up-domain.com/']

# 获取一个单页，同时报告URL和内容
def load_url(url, timeout):
    with urllib.request.urlopen(url, timeout=timeout) as conn:
        return conn.read()

# 我们可以通过with语句来确保线程能够被及时地清理
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    # Start the load operations and mark each future with its URL
    future_to_url = {executor.submit(load_url, url, 60): url for url in URLS}
    for future in concurrent.futures.as_completed(future_to_url):
        url = future_to_url[future]
        try:
            data = future.result()
        except Exception as exc:
            print('%r generated an exception: %s' % (url, exc))
        else:
            print('%r page is %d bytes' % (url, len(data)))
```

## ProcessPoolExecutor

`ProcessPoolExecutor` 类是`Executor`的一个子类，它使用一个进程池来异步地执行调用。`ProcessPoolExecutor`使用`multiprocessing`模块，它允许去避免全局解释器锁，但同时也意味着仅仅只有`pickable`(译者注：这里这个单词的含义我还没理解)对象能够被执行和返回。

`__main__`模块必须能够被作为工作者的子模块导入。这意味着`ProcessPoolExecutor`将不会在交互式的解释器中工作。

从一个已添加到Executor中的可调用对象中调用`Executor`或者`Future`的方法将会导致死锁。

> `class concurrent.futures.ProcessPoolExecutor(max_workers=None)`

>> 一个`Executor`的子类来异步地执行调用，最多将会使用进程池中`max_workers`个工作进程。如果`max_workers`是`None`或者没有给出的话。它默认将会使用机器CPU的个数来作为最大进程数的值。如果`max_workers`小于或者等于0，那么将会抛出一个`ValueError`
>> 3.3版本中的改变：当一个工作进程被突然终止了后，将会抛出一个`BrokenProcessPool`的错误。以前的情况是，行为是未定义的但是 Executor 上的操作或者他自己的 future 将会被冻结或者导致死锁。

### ProcessPoolExecutor 的例子

```python
import concurrent.futures
import math

PRIMES = [
    112272535095293,
    112582705942171,
    112272535095293,
    115280095190773,
    115797848077099,
    1099726899285419]

def is_prime(n):
    """(译者注) 判断素数的程序

    这里对 sqrt_n 做一点解释：

    假设 n 不是素数，那么有 n = x * y( x != 1 and y != 1)
    因为 n = x * y， 所以 x <= sqrt(n) or y <= sqrt(n)
    所以 i in [2, sqrt(n)]; i表示能够被 n 整除的数
    所以如果 i not in [2, sqrt(n)]; 那么n是素数

    在这个程序中我们在一开始就判断过2，所以循环从3开始，且跳过所有偶数
    """
    if n % 2 == 0:
        return False

    sqrt_n = int(math.floor(math.sqrt(n)))
    for i in range(3, sqrt_n + 1, 2):
        if n % i == 0:
            return False
    return True

def main():
    with concurrent.futures.ProcessPoolExecutor() as executor:
        for number, prime in zip(PRIMES, executor.map(is_prime, PRIMES)):
            print('%d is prime: %s' % (number, prime))

if __name__ == '__main__':
    main()
```

## Future 对象

Future 类封装了一个可调用对象的异步执行过程，Future 对象是通过`Executor.submit()`函数来创建的。

> `class concurrent.futures.Future`

>>  封装了一个可调用对象的异步执行过程。Future 实例是通过`Executor.submit()`方法来创建的，而且不应该被直接创建，除非用来测试。

>> `cancel()`
>>> 尝试去取消相关回调，如果这个回调正在被执行，而且不能被取消，那么这个方法将会返回`False`，否则这个方法将会取消相应的回调并且返回`True`

>> `cancelled()`
>>> 如果相关回调被成功取消了，那么这个方法将会返回`True`

>> `running()`
>>> 如果相关回调当前正在被执行而且无法取消，那么将会返回`True`

>> `done()`
>>> 如果相关的回调被成功地取消或者已经运行完毕那么将返回`True`

>> `result(timeout=None)`
>>> 返回由相关回调产生的结果。如果这个回调还没有被完成那么这个方法将会等待`timeout`秒。如果这个回调在`timeout`秒内还没有返回，一个`concurrent.futures.TimeoutError`的异常将会被抛出。`timeout`能够被设置成一个整数或者一个浮点数。如果`timeout`没有被设置或者其值为`None`，那么等待时间将没有限制。

>>> 如果这个 future 在完成之前被取消了，那么将会抛出一个`CancelledError`的异常。
>>> 如果相关的回调抛出了一个异常，那么这个方法也会相应地抛出这个异常。

>> `exception(timeout=None)`
>>> 返回由相关回调抛出的异常。如果相关回调还没有被完成那么这个方法将会等待`timeout`秒。如果相关回调在`timeout`秒内还没有被完成，那么将会抛出一个`concurrent.futures.TimeoutError`的异常。`timeout`能够被设置成一个整数或者一个浮点数。如果`timeout`没有被设置或者其值为`None`，那么等待时间将没有限制。

>>> 如果这个 future 在完成之前被取消了，那么将会抛出一个`CancelledError`的异常。
>>> 如果相关回调被完成了且没有抛出异常，None将会被返回。

>> `add_done_callback(fn)`
>>> 将可调用对象`fn`连接到这个 future 上，`fn`将会在 future 被取消或者结束运行时被调用，而且仅有相关 future 这一个参数。
>>> 添加的可调用对象将会以它们被添加的顺序来调用，而且总是在添加它们的那个进程的所属的线程中调用(译者注，可以参考[这段代码](https://gist.github.com/bwangel23/8c4bd585f6e54c6ec6de336dd73abbe3))。如果相关调用`fn`抛出了一个`Exception`子类的异常，它将会被记录和忽略。如果相关调用`fn`抛出了一个`BaseException`子类的异常，那么行为是未定义的。
>>> 如果相关的 future 已经被完成了或者取消了，`fn`将会被立刻调用。

>> 如下的`Future`方法意味着可以在单元测试或者`Exectuor`的实现中使用。

>> `set_running_or_notify_cancel()`
