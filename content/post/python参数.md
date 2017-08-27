---
title: 'Python参数'
date: 2016-04-10 10:56:54
tags: [IntermediatePython, Python]
---

__摘要__:

> 1. IntermediatePython的学习笔记
> 2. Python的三种参数


<!--more-->

## 猴子补丁

猴子补丁: 在程序运行时修改某些代码，例如下面这样：

```
import someclass

def get_info(self, *args):
    return "Test Data"

someclass.get_info = get_info
```

## Python的三种参数

`*args`表示非键值对可变数量的参数列表
`**kwargs`表示传递参数为不定长度的键值对
`fargs`表示普通的位置参数

```
some_func(fargs, *args, **kwargs)
```

调用的时候，关键字参数必须放在最后，否则会报错(参见下边的实例)。

```python
>>> def show_args(arg1, arg2, *args, **kwargs):
...     print("arg1 == {0}".format(arg1))
...     print("arg2 == {0}".format(arg2))
...     for item in args:
...         print("arg == {0}".format(item))
...     for key, value in kwargs.items():
...         print("{0} == {1}".format(key, value))
...
>>> # show_args("1", "2", myarg="4", "3")  # 会报错的代码
>>> show_args("1", "2", "3", myarg="4")
arg1 == 1
arg2 == 2
arg == 3
myarg == 4
```
