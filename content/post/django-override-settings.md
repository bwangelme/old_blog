---
title: Django的override_settings修饰器浅析
date: 2017-06-25 20:17:07
tags: [Python,Django]
---

> 1. Django的Settings模块代码说明
> 2. Django的`override_settings`修饰器分析

<!--more-->

## 前言

前两天刚刚看了Django settings的实现，今天又发现了测试工具中有个`override_settings`修饰器，于是就想从它下手来分析一下Django的`settings`。

本篇文章主要分析的是`override_settings`作为修饰器的实现，其作为上下文管理器的部分并未详细分析。

## Django的settings说明

在分析这个修饰器之前，我们先来了解一下Django的`settings`是如何实现的， Django的`settings`的代码存放在`django/conf/__init__.py`中，其中主要有三个类，`LazySettings`，`Settings`和`UserSettingsHolder`。

### Settings

`Settings`类实现了Django配置的载入和存储功能，在它的`__init__`函数中，首先从`django/conf/global_settings.py`文件中导入Django默认的配置，然后再从`DJANGO_SETTINGS_MODULE`环境变量所指定的配置文件中导入我们项目自定义的配置，然后逐项地检查并添加配置。

需要注意的是，`Settings`会把我们自定义的配置的名称存放到`Settings._explicit_settings`集合中，`Settings.is_overriden`函数就是通过检查`Settings._explicit_settings`集合，来查看某项配置是否被我们自定义的配置给覆盖掉了。

### LazySettings

`LazySettings`是`Settings`类的一个代理，或者可以认为是对`Settings`的一层包裹，它的主要功能就是`Lazy`，或者叫做懒载入。它把`Settings`类的实例存放在它的私有变量`_wrapped`中，初始化的时候，它默认将`_wrapped`设置为空，只有当从`LazySettings`中取值的时候(会调用`LazySettings.__getattr__`函数)，它才会调用`_setup`函数，实例化一个`Settings`对象，并从中取出对应的配置项。

我们平常在代码中使用的`django.conf.settings`对象，就是这个类的实例。

### UserSettingsHolder

`UserSettingsHolder`类和上面两个类有些不同，它也是用来存储用户的配置项的，只不过它并不会从`django/conf/global_settings.py`文件中读取Django默认的配置，它只是单纯地将用户传入的配置存储起来，以供读取。

```py
def __init__(self, default_settings):
    """
    Requests for configuration variables not in this class are satisfied
    from the module specified in default_settings (if possible).
    """
    self.__dict__['_deleted'] = set()
    self.default_settings = default_settings
```

上面就是`UserSettingsHolder`构造函数，从中我们可以看到，它接收一个`default_settings`参数，它主要就是从这个参数中获取并存储用户要设置的配置，并不存储Django默认的配置。


## override_settings修饰器的分析

了解完Django的`settings`的实现以后，我们再来看一下`override_settings`修饰器。

我们在使用`override_settings`作为修饰器的时候，通常的形式是这样的:

```py
@override_settings(DEBUG=False)
def test_some_feature(self):
    pass
```

上面的代码中修饰器的部分，我们可以使用下面这种方式来理解它:

```py
test_some_feature = override_settings(DEBUG=False)(test_some_feature)
```

从上面的形式可以看出，修饰器语法真正调用的是`override_settings`类的`__call__`方法，所以我们需要去关注一下`override_settings`的`__call__`方法。但是这个方法在`override_settings`类中并没有实现，它是在它的父类`TestContextDecorator`中实现的。

### TestContextDecorator

#### `__call__`方法

`TestContextDecorator`类的`__call__`方法如下所示:

```py
def __call__(self, decorated):
    if isinstance(decorated, type):
        return self.decorate_class(decorated)
    elif callable(decorated):
        return self.decorate_callable(decorated)
    raise TypeError('Cannot decorate object of type %s' % type(decorated))
```

从代码中我们可以看出，这个函数的功能主要就是对被修饰的对象进行了一下鉴别，如果修饰的是类，则调用`decorate_class`函数，如果修饰的是其他的可调用对象，则调用`decorate_callable`函数。

#### decorate_class

接着我们来看一下`decorate_class`函数，它的代码如下：

```py
def decorate_class(self, cls):
    if issubclass(cls, TestCase):
        decorated_setUp = cls.setUp
        decorated_tearDown = cls.tearDown

        def setUp(inner_self):
            -> context = self.enable()
            -> if self.attr_name:
            ->     setattr(inner_self, self.attr_name, context)
            decorated_setUp(inner_self)

        def tearDown(inner_self):
            decorated_tearDown(inner_self)
            -> self.disable()

        cls.setUp = setUp
        cls.tearDown = tearDown
        return cls
    raise TypeError('Can only decorate subclasses of unittest.TestCase')
```

从上面的代码可以看出，`decorate_class`函数的针对`TestCase`类的`setUp`和`tearDown`函数添加了一些额外的代码，即我用`->`符号标记的部分。

这些代码的主要功能就是在`TestCase`类初始化的时候调用`TestContextDecorator.enable`函数，再以`self.attr_name`的值作为名称，把`enable`函数的返回值插入到`TestCase`类的实例中。同时在`TestCase`类销毁的时候调用`TestContextDecorator.disable`函数。

我们接着再去查看`TestContextDecorator.enable`和`TestContextDecorator.disable`函数，我们发现它们是在`override_settings`子类中实现的，那我们对于`decorate_class`的分析就到这里，`enable`和`disable`函数在后面分析到`override_settings`子类的时候会继续分析。


#### decorate_callable

> __注意__:
> 这个函数的代码涉及到了Python的上下文管理器(`with`语句)的部分知识，如果你可以自己动手写一个上下文管理器的话，继续阅读即可。
> 如果你对于上下文管理器还有些疑问的话，请参考我的另一篇文章: [PEP 343: Python的with语句](/2016/04/25/Python%E7%9A%84with%E8%AF%AD%E5%8F%A5/)

分析完了`decorate_class`函数，我们接着回到`TestContextDecorator.__call__`方法，接着分析被修饰对象是可调用对象的那一种情况，也就是`TestContextDecorator.decorate_callable`函数。`decorate_callable`函数的代码如下所示:

```py
def decorate_callable(self, func):
    @wraps(func)
    def inner(*args, **kwargs):
        with self as context:
            if self.kwarg_name:
                kwargs[self.kwarg_name] = context
            return func(*args, **kwargs)
    return inner
```

可以看到，`decorate_callable`函数其实就是一个修饰器，它的主要功能就是将`TestContextDecorator`的实例作为一个上下文管理器进行了调用，需要注意的是，`return`语句是被包裹在`with`语句内的，也就是说，被修饰的函数执行完了以后，才会接着执行上下文管理器的`__exit__`函数。同时，它还会使用`self.kwarg_name`的值作为参数名字，将上下文管理器的返回值(也就是`__enter__`函数的返回值)传入被修饰的函数中。

既然`decorate_callable`将`TestContextDecorator`当做一个上下文管理器来使用，我们就需要关注一下它的`__enter__`和`__exit__`函数，这两个函数的代码如下所示:

```py
def __enter__(self):
    return self.enable()

def __exit__(self, exc_type, exc_value, traceback):
    self.disable()
```
可以看到，这两个函数的功能，基本上也是调用`enable`和`disable`函数。

### override_settings

分析完了`override_settings`的父类，我们接着来分析这个类本身。从上面的分析中我们可以看到，`override_settings`对于被修饰的类或者函数基本上就是做两件事，类或者函数初始化之前调用`enable`函数，并将`enable`函数的返回值传递到被修饰的类或者函数中。然后再在被修饰的类或者函数退出的时候调用`disable`函数。所以，我们将关注点集中到`override_settings`类的`enable`和`disable`函数上就好了。

首先来说`override_settings.enable`函数，它的代码如下所示:

```py
def enable(self):
    # Keep this code at the beginning to leave the settings unchanged
    # in case it raises an exception because INSTALLED_APPS is invalid.
    # 注意self.options其实就是`override_settings`类的构造函数中传入的关键字参数kwargs
    if 'INSTALLED_APPS' in self.options:
        try:
            apps.set_installed_apps(self.options['INSTALLED_APPS'])
        except Exception:
            apps.unset_installed_apps()
            raise
    # 这个settings._wrapped就是真实保存的设置
    # UserSettingsHolder就是
    override = UserSettingsHolder(settings._wrapped)
    for key, new_value in self.options.items():
        setattr(override, key, new_value)
    self.wrapped = settings._wrapped
    settings._wrapped = override
    for key, new_value in self.options.items():
        setting_changed.send(sender=settings._wrapped.__class__,
                              setting=key, value=new_value, enter=True)
```

可以看到`enable`函数的功能就是在原有的`settings`配置上，用我们在`options`中传入的配置覆盖掉原来的配置，并针对修改的配置项发出信号。同时将原来的配置保存到`self.wrapped`变量中。

接着我们再来看`override_settings.disable`函数，它的代码如下:

```py
def disable(self):
    if 'INSTALLED_APPS' in self.options:
        apps.unset_installed_apps()
    settings._wrapped = self.wrapped
    del self.wrapped
    for key in self.options:
        new_value = getattr(settings, key, None)
        setting_changed.send(sender=settings._wrapped.__class__,
                              setting=key, value=new_value, enter=False)
```

这个函数的功能也很简单，将`self.wrapped`中保存的配置还原，并针对更改的配置发出信号。

## 总结

OK，至此，对于`override_settings`的分析就结束了，它的功能也比较简单，就是在一个作用域中修改配置，并在这个作用域结束的时候将配置还原，如果它修饰的作用域是一个函数的话，由于函数不像类有构造和析构函数，它就使用Python的上下文管理器来实现类的构造和析构函数的功能。
