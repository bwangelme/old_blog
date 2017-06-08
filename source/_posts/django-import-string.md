layout: title
title: Django中import_string的实现
date: 2017-06-08 07:17:28
tags: ['django', 'python']
---

__摘要__:

> 1. importlib.import_module 函数的功能
> 2. import_string 函数的实现

<!-- more -->

## 前言

今天开始来读 Django 的代码，首先想在 Django 内部设置一个logger用来打印调试日志，结果发现在Django内部，DEBUG日志显示不出来，然后我就想这肯定是Django配置日志的时候，根据logger的名字，来确定了一定的日志级别。

于是我就想看看Django的日志是如何配置的，顺着`manage.py`中的`execute_from_command_line`一路往下找，就找到了`django.utils.log.configure_logging`函数，在这个函数中，第一个就遇到了`import_string`函数，虽然一眼就能看出，这个函数的功能就是通过字符串来导入相应的函数的，但还是忍不住想要看一下它的实现，千里之行，始于足下，阅读Django源码的过程，就从这个11行的函数开始吧。

## Python的`import_module`函数

函数声明: `importlib.import_module(name, package=None)`

1. 从[文档](https://docs.python.org/3/library/importlib.html#importlib.import_module)中可以看出，这个函数的主要功能就是导入指定的包或者模块,它并不能导入模块中的类或者函数。
2. 这个函数还支持相对导入，如果要使用相对导入的话，需要设置第二个参数`package`来确认执行相对导入时的当前路径。
3. 如果你想要在运行时动态导入的话，比如新创建一个Python文件再来导入，需要调用`importlib.invalidate_caches`函数，来确保让导入系统能够发现新的模块。

## Django的`import_string`函数

`import_string`函数的代码如下所示：

```python
def import_string(dotted_path):
    try:
        module_path, class_name = dotted_path.rsplit('.', 1)
    except ValueError as err:
        raise ImportError("%s doesn't look like a module path" % dotted_path) from err

    module = import_module(module_path)

    try:
        return getattr(module, class_name)
    except AttributeError as err:
        raise ImportError('Module "%s" does not define a "%s" attribute/class' % (
            module_path, class_name)
        ) from err
```

从代码中我们可以看出，这个函数其实很简单，就是首先将要导入的路径名分割成模块名和类名，然后再来从模块中获得到类这个属性，然后就完成了。照着这个思路来看，其实我们导入一个函数也是可以的。
