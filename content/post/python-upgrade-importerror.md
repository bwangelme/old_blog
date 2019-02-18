---
title: "Python Upgrade Importerror"
date: 2017-12-05T22:33:57+08:00
draft: false
keywords: []
description: ""
tags: [Python, ImportError]
categories: []
author: ""
---

> + 记一次因 Python 升级导致的 ImportError

<!--more-->


我们有一个 Django 应用通过 uwsgi 跑在阿里云的 ECS 上，所用的系统是 Ubuntu 16.04，uwsgi 是通过 supervisord 来管理的，每个应用都在单独的 virtualenv 中运行，这就是大概的软件运行环境。

因为一些软件没有升级，阿里云一直提示存在安全漏洞，所以我就想把 ECS 上的系统升级一下。升级的过程并没有什么什么问题，毕竟用的阿里云自己维护的源，基本上不会出现什么版本依赖之类的问题。

# 出错场景

升级完成后重新启动 Django 应用，发现应用启动不起来，uwsgi 报错

```
from _ssl import HAS_SNI, HAS_ECDH, HAS_NPN, HAS_ALPN, HAS_TLSv1_3
ImportError: cannot import name 'HAS_TLSv1_3'
```

# 原因分析

## 从异常入手查找原因

抛出的异常意思是在`_ssl`模块中没有`HAS_TLSv1_3`的属性，于是我就去Python 文档中查询了一下这个属性，它的解释是这样的：

```
ssl.HAS_TLSv1_3
Whether the OpenSSL library has built-in support for the TLS 1.3 protocol.

New in version 3.6.3.
```

看到`New in version 3.6.3.`的字样，再去查系统的升级记录，我发现刚刚执行的升级中就把宿主机的 Python 从3.6.2升级到了3.6.3，此时我隐隐约约觉得就是因为此次升级导致了 uwsgi 启动时的报错。

但我升级的是宿主机的 Python，它又是如何影响到了 Virtualenv 中的 Python 呢？各位别急，我们接着往下挖。

## `HAS_TLSv1_3`的定义

我们接着再去看抛出异常的那行代码，它在 Python 的标准库的`ssl.py`的[118行](https://github.com/python/cpython/blob/v3.6.3/Lib/ssl.py#L118)，具体内容如下：

```
from _ssl import HAS_SNI, HAS_ECDH, HAS_NPN, HAS_ALPN, HAS_TLSv1_3
```

我们可以看到，抛出异常就是因为Python解释器从`_ssl`模块中导入`HAS_TLSv1_3`时，出现了导入异常。

而`_ssl`模块是用C语言编写的，它被编译进入了Python解释器中，它的代码位于 Python 源码的 [Modules/_ssl.c](https://github.com/python/cpython/blob/v3.6.3/Lib/ssl.py) 文件中。

在它的[5154-5206](https://github.com/python/cpython/blob/v3.6.3/Modules/_ssl.c#L5154-L5206)行，我们可以看到它对于`_ssl`模块的定义：

```c
static struct PyModuleDef _sslmodule = {
    PyModuleDef_HEAD_INIT,
    "_ssl",
    module_doc,
    -1,
    PySSL_methods,
    NULL,
    NULL,
    NULL,
    NULL
};

...

PyMODINIT_FUNC
PyInit__ssl(void)
{
    PyObject *m, *d, *r;
    ...
  
    // _ssl 模块在这里定义，指针m代表了_ssl模块
    m = PyModule_Create(&_sslmodule);
    if (m == NULL)
        return NULL;
    ...
```

而在它的[5642-5468](https://github.com/python/cpython/blob/v3.6.3/Modules/_ssl.c#L5462-L5468)行，我们可以看到`_ssl`模块中对于`HAS_TLSv1_3`属性的定义：

```c
#if defined(TLS1_3_VERSION) && !defined(OPENSSL_NO_TLS1_3)
    r = Py_True;
#else
    r = Py_False;
#endif
    Py_INCREF(r);
    // 下面这条语句向_ssl模块中添加了布尔值 HAS_TLSv1_3
    PyModule_AddObject(m, "HAS_TLSv1_3", r);
```

上述的代码主要就是判断当前系统是否支持 TLS 1.3版本，并向`_ssl`模块添加了一个布尔值`HAS_TLSv1_3`来表明当前系统是否支持 TLS 1.3版本。

## 错误复现

从上面的分析中我们可以看出，我们可以知道三件事情，

1. `HAS_TLSv1_3`这个布尔值是被编译进 Python 解释器中的，
2. 根据 [Python 文档](https://docs.python.org/3/library/ssl.html#ssl.HAS_TLSv1_3) 的说明，`HAS_TLSv1_3`是在 Python 3.6.3中新添加的。
3. 我们将宿主机的 Python 从3.6.2升级到了3.6.3，但是我们的 Virtualenv 仍然使用着 3.6.2 版本的 Python 解释器。

知道了以上三点，我们就可以复现出我们的错误场景，梳理出整个出错的流程：

+ uwsgi 启动，使用的是 Virtualenv 中的 3.6.2版本的 Python 解释器
+ Python 3.6.2 的解释器在某些第三方库中执行了`import ssl`的语句
+ 由于 Virtualenv 创建的时候并没有将标准库的`ssl.py`文件一并复制过来，所以 Python 3.6.2 的解释器去系统目录下寻找`ssl.py`文件并执行
+ Python 3.6.2 的解释器找到了系统目录下的`ssl.py`文件，也就是 Python 3.6.3 的系统库文件。
+ Python 3.6.2 的解释器执行了 Python 3.6.3的库文件`ssl.py`中的一条导入语句：
```py
from _ssl import HAS_SNI, HAS_ECDH, HAS_NPN, HAS_ALPN, HAS_TLSv1_3
```
+ Python 3.6.2 的解释器从解释器內建的模块`_ssl`中导入`HAS_TLSv1_3`
+ 由于 Python 3.6.2 的解释器中并没有定义`HAS_TLSv1_3`这个布尔值，程序抛出`ImportError`

上面这个出错流程也可以用下面这张图来概括:

![Import Error](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2019-02-18-2017-10-14-080329.jpg)

# 错误总结

看到这里，我想 Virtualenv 创建时没有复制系统库文件`ssl.py`过来，是不是因为我没有指定它的 [--always-copy](https://virtualenv.pypa.io/en/stable/reference/#cmdoption-always-copy) 属性，我特意指定了这个属性又来创建了一遍 Virtualenv，发现它还是没有复制`ssl.py`文件过来。

关于这个问题，我请教了公司的一位大佬。大佬说这样设计其实复合 Virtualenv 的定位，它只是做 Python 第三方库的隔离，并不做 Python 版本的隔离。

所以如果我们以后需要在同一个系统上安装多个 Python 版本的话，还是需要使用 [pyenv](https://github.com/pyenv/pyenv) 这样的工具，而不能指望 Virutalenv 的 [--python](https://virtualenv.pypa.io/en/stable/reference/#cmdoption-p) 选项。
