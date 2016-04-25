---
title: Python的with语句
date: 2016-04-25 21:04:33
tags: Python
---

参考文档: [PEP 343: The 'with' statement](https://docs.python.org/release/2.5/whatsnew/pep-343.html)

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

## `contextlib`模块
