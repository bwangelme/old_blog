---
title: "PEP 343: Python的with语句"
date: 2016-04-25 21:04:33
tags: [Python, 翻译]
author: "bwangel"
comment: true
aliases:
  - /2016/04/25/python的with语句/
---

__摘要__:

> 1. Python的with语句用法以及相关的上下文管理协议
> 2. 如何自己写一个上下文管理器对象，如何利用`contextlib`来写一个上下文管理器对象
> 3. 原文地址: [PEP 343: The 'with' statement](https://docs.python.org/release/2.5/whatsnew/pep-343.html)


<!--more-->

## With语句的通常用法

with语句是一个新的控制流结构, 它的基本结构如下:

```py
with expression [as variable]:
    with-block
```

`expression`应该是可求值的，而且它的求值结果应该是一个支持上下文管理协议的对象。

这个对象可能返回一个值，这个值可以绑定到一个命名变量variable（注意variable并不是表达式结果的赋值）。

`variable`能够在`with-block`语句执行前运行一些构造代码，且在`with-block`语句执行后运行一些析构代码，甚至就算`with-block`语句抛出异常了，析构代码一样能够运行。

一些Python标准对象已经支持上下文管理协议，且能够和`with`一起使用，例如`File`对象:

```py
with open('/etc/passwd', 'r') as f:
    for line in f:
        print line
        ... more processing code ...
```

在这个语句执行后，文件对象f将会是关闭状态，就算for循环抛出了一个一场，只是部分执行了`with-block`的代码。

`threading`模块的锁和条件变量也支持`with`语句:

```py
lock = threading.Lock()
with lock:
    # 原子操作的代码
    ...
```

这个锁在`with-block`代码执行之前被锁定，而且在`with-block`语句执行完以后总是被释放。

`decimal`中新的`localcontext()`函数使保存和重置当前十进制环境变得很容易，它封装了计算所需的精度和圆整度:

```py
from decimal import Decimal, Context, localcontext

# 显示默认的28位精度
v = Decimal('578')
print(v.sqrt())

with localcontext(Context(prec=16)):
    # 这个块中的所有代码都会是16位的精度
    # 在这个代码块结束以后，原始的精度将会被重置回来
    print(v.sqrt())
```

## 自己动手写一个上下文管理器
在底层实现上, `with`语句还是相当复杂的，大多数人仅仅在公司中和已存在的对象一起使用`with`语句, 且不需要知道这些实际细节。
所以如果你喜欢的话，可以跳过这节剩下的部分。
如果需要写一个新的对象，且需要理解底层实现的细节，那么就应该继续阅读下去。

关于上下文管理协议在高等级的角度上来解释就是:

   + 表达式是可求值的，而且应该返回一个对象叫做上下文管理器(`context manager`)。上下文管理器必须有`__enter__()`和`__exit__()`方法。
   + 上下文管理器的`__enter__()`方法是可调用的。这个方法的返回值被赋值给`VAR`。如果语句后面没有跟随`as VAR`的话，这个值会被简单的丢弃。
   + 在`BLOCK`中的代码将会被执行。
   + 如果`BLOCK`中的代码抛出一个异常，`__exit__(type, value, traceback)`方法将会被调用，并且异常的细节将会被当作参数传入进去，这里的异常细节和`sys.exc_info()`返回的值一样。方法的返回值控制着异常是否会被重新抛出：任何`False`的返回值将会导致异常重新抛出，而`True`返回值使异常不会重新抛出。你将不会想要重新抛出异常，因为如果你在自己的代码中使用`with`语句的话，将不会意识到有任何的出错情况。
   + 如果`BLOCK`代码中没有抛出异常，那么`__exit__()`方法仍然会被调用，只不过`type`,`value`, `traceback`参数将都会是`None`

让我们来看一个例子。我不会给出所有的细节代码，仅仅会给出一些必要的代码来表示一个支持事务功能的数据库对象。

(对于不熟悉数据库的人们来说，事务就是一组数据库的改变打包到了一起，事务可以是`committed`，代表着所有的更改都被写入到了数据库中，也可以是`rolled back`, 代表所有的更改都被丢弃，数据库没有变化. 关于更多关于事务的信息可以参看任何数据库相关的书籍。)

让我们假设这里有一个对象代表了数据库连接，我们的目标是让用户能够以下面的方式来写代码:

```py
db_connection = DatabaseConnection()
with db_connection as cursor:
    cursor.execute('insert into ...')
    cursor.execute('delete from')
    # ... more operations ...
```
如果with块中的代码被完美地执行了的话，事务应该被提交，否则如果with块中的代码抛出异常的话，事务应该被回滚。

我假设`DatabaseConnection`对象应该有如下的基础接口。

```py
class DatabaseConnection:
    # Database interface
    def cursor(self):
        """返回一个cursor对象，而且开启一个新的事务
        """
    def commit(self):
        """提交当前事务
        """
    def rollback(self):
        """回滚当前事务
        """
```

`__enter__()`方法是很容易写的，仅仅需要开启一个新的事物。对于这个应用程序游标结果对象应该是一个有用的接口，所以这个方法应该返回它，用户能够增加一个游标到with语句块中，并绑定到一个变量上。

```py
class DatabaseConnection:
    ...
    def __enter__(self):
        # code to start a new transaction
        cursor = self.cursor()
        return cursor
```

`__exit__()`方法是最复杂的，因为这里需要做大部分的工作。这个方法必须去检查是否有异常发生。如果没有异常的话，事务被提交，如果有异常的话，事务被回滚。

在如下的代码中，异常将会放在函数的末尾，返回默认值`None`. `None`就是`False`,所以异常就会被自动重新抛出。如果你希望的话，你可以做的更精确，在标记的位置添加一条return语句。

```py
class DatabaseConnection:
    ...
    def __exit__(self, type, value, tb):
        if tb is None:
            # No execption, so commit
            self.commit()
        else:
            # Exception occurred, so rollback
            self.rollback()
            # return False
```

## contextlib模块

新的`contextlib`模块提供了一些有用的方法和修饰器去写能够和`with`语句一起使用的对象。

这个叫做`contextmanager`的修饰器, 它允许你去写一个生成器函数而不是定义一个新的类。这个生成器应该精确地`yield`一个值，在`yield`之前的代码将会被当作`__enter__()`函数执行，且yield的返回值将会被当作`__enter__()`函数的返回值，将会被绑定到`with`语句后`as`后的变量上(如果as后这个变量存在的话)。yield之后的代码将会被当作`__exit__()`函数来执行，任何抛出的异常将会由`yield`语句来重新抛出。

我们上一节的数据库例子可以使用这个修饰器，以如下的方式来写：

```py
from contextlib import contextmanager

@contextmanager
def db_transaction(connection):
    cursor = connection.cursor()
    try:
        yield cursor
    except:
        connection.rollback()
        raise
    else:
        connection.commit()

db = DatabaseConnection()
with db_transaction(db) as cursor:
    ...
```

`contextlib`模块也有一个`nested(mgr1, mgr2, ...)`函数来绑定许多个上下文管理器，这样的话你就不需要写嵌套的`with`语句了。在下面这个例子中，单个with语句获得了线程锁，并且开启了一个事务。

```py
lock = threading.Lock()
with nested (db_transaction(db), lock) as (cursor, locked):
```

最后，closing函数返回了一个对象，它能够绑定到一个变量上，在函数块的末尾，自动调用`object.close()`方法

```py
import urllib, sys
from contextlib import closing

with closing(urllib.urlopen('http://www.baidu.com')) as f:
    for line in f:
        sys.stdout.write(line)
```

## 参考

[PEP 343, The 'with' statement](http://www.python.org/peps/pep-0343.html)
[contextlib文档](https://docs.python.org/release/2.5/lib/module-contextlib.html)
