---
title: 简单聊聊Python中的wraps修饰器
date: 2017-05-09 10:40:54
tags: [Python]
---

__摘要__:

> Python 中的wraps修饰器分析


<!--more-->

# 预备知识

在了解`wraps`修饰器之前，我们首先要了解`partial`和`update_wrapper`这两个函数，因为在`wraps`的代码中，用到了这两个函数。

## partial

首先说`partial`函数，在[官方文档](https://docs.python.org/3/library/functools.html#functools.partial)的描述中，这个函数的声明如下：`functools.partial(func, *args, **keywords)`。它的作用就是返回一个`partial`对象，当这个`partial`对象被调用的时候，就像通过`func(*args, **kwargs)`的形式来调用`func`函数一样。如果有额外的__位置参数(*args)__或者__关键字参数(**kwargs)__被传给了这个`partial`对象，那它们也都会被传递给`func`函数，如果一个参数被多次传入，那么后面的值会覆盖前面的值。

个人感觉这个函数很像C++中的`bind`函数，都是把某个函数的某个参数固定，从而构造出一个新的函数来。比如下面这个例子：

```python
from functools import partial

def add(x:int, y:int):
    return x+y

# 这里创造了一个新的函数add2，只接受一个整型参数，然后将这个参数统一加上2
add2 = partial(add, y=2)

add2(3)  # 这里将会输出5
```

这个函数是使用C而不是Python实现的，但是官方文档中给出了Python实现的代码，如下所示，大家可以进行参考：

```python
def partial(func, *args, **keywords):
    def newfunc(*fargs, **fkeywords):
        newkeywords = keywords.copy()
        newkeywords.update(fkeywords)
        return func(*args, *fargs, **newkeywords)
    newfunc.func = func
    newfunc.args = args
    newfunc.keywords = keywords
    return newfunc
```

## update_wrapper

接下来，我们再来聊一聊`update_wrapper`这个函数，顾名思义，这个函数就是用来更新修饰器函数的，具体更新些什么呢，我们可以直接把它的源码搬过来看一下：

```python
WRAPPER_ASSIGNMENTS = ('__module__', '__name__', '__qualname__', '__doc__',
                       '__annotations__')
WRAPPER_UPDATES = ('__dict__',)
def update_wrapper(wrapper,
                   wrapped,
                   assigned = WRAPPER_ASSIGNMENTS,
                   updated = WRAPPER_UPDATES):
    for attr in assigned:
        try:
            value = getattr(wrapped, attr)
        except AttributeError:
            pass
        else:
            setattr(wrapper, attr, value)
    for attr in updated:
        getattr(wrapper, attr).update(getattr(wrapped, attr, {}))
    wrapper.__wrapped__ = wrapped
    return wrapper
```

大家可以发现，这个函数的作用就是从__被修饰的函数(wrapped)__中取出一些属性值来，赋值给__修饰器函数(wrapper)__。为什么要这么做呢，我们看下面这个例子。

### 自定义修饰器v1

首先我们写个自定义的修饰器，没有任何的功能，仅有文档字符串，如下所示：

```python
def wrapper(f):
    def wrapper_function(*args, **kwargs):
        """这个是修饰函数"""
        return f(*args, **kwargs)
    return wrapper_function

@wrapper
def wrapped():
    """这个是被修饰的函数"""
    print('wrapped')

print(wrapped.__doc__)  # 输出`这个是修饰函数`
print(wrapped.__name__)  # 输出`wrapper_function`
```
从上面的例子我们可以看到，我想要获取`wrapped`这个被修饰函数的文档字符串，但是却获取成了`wrapper_function`的文档字符串，`wrapped`函数的名字也变成了`wrapper_function`函数的名字。这是因为给`wrapped`添加上`@wrapper`修饰器相当于执行了一句`wrapped = wrapper(wrapped)`，执行完这条语句之后，`wrapped`函数就变成了`wrapper_function`函数。遇到这种情况该怎么办呢，首先我们可以手动地在`wrapper`函数中更改`wrapper_function`的`__doc__`和`__name__`属性，但聪明的你肯定也想到了，我们可以直接用`update_wrapper`函数来实现这个功能。

### 自定义修饰器v2

我们对上面定义的修饰器稍作修改，添加了一句`update_wrapper(wrapper_function, f)`。
```python
from functools import update_wrapper

def wrapper(f):
    def wrapper_function(*args, **kwargs):
        """这个是修饰函数"""
        return f(*args, **kwargs)
    update_wrapper(wrapper_function, f)  # <<  添加了这条语句
    return wrapper_function

@wrapper
def wrapped():
    """这个是被修饰的函数"""
    print('wrapped')


print(wrapped.__doc__)  # 输出`这个是被修饰的函数`
print(wrapped.__name__)  # 输出`wrapped`
```

此时我们可以发现，`__doc__`和`__name__`属性已经能够按我们预想的那样显示了，除此之外，`update_wrapper`函数也对`__module__`和`__dict__`等属性进行了更改和更新。

# wraps修饰器

OK，至此，我们已经了解了`partial`和`update_wrapper`这两个函数的功能，接下来我们翻出`wraps`修饰器的源码：

```python
WRAPPER_ASSIGNMENTS = ('__module__', '__name__', '__qualname__', '__doc__',
                       '__annotations__')
WRAPPER_UPDATES = ('__dict__',)
def wraps(wrapped,
          assigned = WRAPPER_ASSIGNMENTS,
          updated = WRAPPER_UPDATES):
    return partial(update_wrapper, wrapped=wrapped,
                   assigned=assigned, updated=updated)
```

没错，就是这么的简单，只有这么一句，我们可以看出，`wraps`函数其实就是一个修饰器版的`update_wrapper`函数，它的功能和`update_wrapper`是一模一样的。我们可以修改我们上面的自定义修饰器的例子，做出一个更方便阅读的版本。

## 自定义修饰器v3

```python
from functools import wraps

def wrapper(f):
    @wraps(f)
    def wrapper_function(*args, **kwargs):
        """这个是修饰函数"""
        return f(*args, **kwargs)
    return wrapper_function

@wrapper
def wrapped():
    """这个是被修饰的函数
    """
    print('wrapped')

print(wrapped.__doc__)  # 输出`这个是被修饰的函数`
print(wrapped.__name__)  # 输出`wrapped`
```

至此，我想大家应该明白`wraps`这个修饰器的作用了吧，就是将 __被修饰的函数(wrapped)__ 的一些属性值赋值给 __修饰器函数(wrapper)__ ，最终让属性的显示更符合我们的直觉。

# 参考链接

1. [python3 functools.wraps](https://docs.python.org/3/library/functools.html#functools.wraps)
2. [python装饰器和functools模块](http://blog.jkey.lu/2013/03/15/python-decorator-and-functools-module/)
3. [Github - cpython functools源码](https://github.com/python/cpython/blob/6f0eb93183519024cb360162bdd81b9faec97ba6/Lib/functools.py)
