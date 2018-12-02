---
title: Gevent 的 KeyError
date: 2016-09-14 15:21:40
tags: [Python, gevent, stackoverflow, 翻译]
---

__摘要__:

> 1. 本文翻译自 StackOverFlow 上的一篇[答案](http://stackoverflow.com/questions/8774958/keyerror-in-module-threading-after-a-successful-py-test-run)
> 2. 本文主要解释了`gevent`的猴子补丁和一个`KeyError`之间的关系

<!--more-->

## 错误描述

在包含有`gevent.monkey.patch_thread()`( gevent 的猴子补丁)的程序中，运行时会报出下面的错误：

```py
Exception KeyError: KeyError(140468381321488,) in <module 'threading' from '/usr/lib/python2.7/threading.pyc'> ignored
```

解决答案: [KeyError in module 'threading' after a successful py.test run](http://stackoverflow.com/questions/8774958/keyerror-in-module-threading-after-a-successful-py-test-run)

## 原文翻译

我观察了同样的主题，然后决定去精确地描述一下到底发生了什么。让我们一起来看一下我的发现，我希望这在以后能够帮助到其他人。

### 简短的回答

它的确和`threading`模块的猴子补丁有关。事实上，我能够轻易地开启这个异常，通过在猴子补丁线程之前导入`threading`模块。下面这两行代码就足够了：

```python
import threading
import gevent.monkey; gevent.monkey.patch_thread()
```

上面的代码执行的时候，就报出了 "忽略了一个`KeyError`" 的信息：

```sh
(env)czajnik@autosan: python test.py
Exception KeyError: KeyError(139924387112272,) in <module 'threading' from '/usr/lib/python2.7/threading.pyc'> ignored
```

如果你交换一下`import`行的顺序，这个错误信息就会消失了。

### 详细的回答

我可以在这里停止我的调试，但是我觉得它值得让我去了解，造成问题的准确的原因是什么？

第一步是去寻找打印这个忽略了异常的信息的代码。这对于我来说找到这个有点困难（在 python 标准库中 grep 查找`Exception .*ignored`没有返回任何东西），但是 grep CPython 的源码，我最终在[ Python/error.c ](http://svn.python.org/projects/python/tags/r27/Python/errors.c)文件中找到了一个函数叫做`void PyErr_WriteUnraisable(PyObject *obj)`，它的注释非常有趣，

```c
/* Call when an exception has occurred but there is no way for Python
   to handle it.  Examples: exception in __del__ or during GC. */
```

我决定去检查谁调用了它，这个利用了`gdb`的一点功能来实现的，最终得到了如下的C调用栈，
```
#0  0x0000000000542c40 in PyErr_WriteUnraisable ()
#1  0x00000000004af2d3 in Py_Finalize ()
#2  0x00000000004aa72e in Py_Main ()
#3  0x00007ffff68e576d in __libc_start_main (main=0x41b980 <main>, argc=2,
    ubp_av=0x7fffffffe5f8, init=<optimized out>, fini=<optimized out>,
    rtld_fini=<optimized out>, stack_end=0x7fffffffe5e8) at libc-start.c:226
#4  0x000000000041b9b1 in _start ()
```
现在我们可以清楚地看到异常是在[Py_Finalize](https://docs.python.org/3/c-api/init.html#Py_Finalize)执行的时候抛出的，这个调用负责关闭Python解释器，释放已经申请的内存等等。它仅仅在退出前调用。

下一步是去查看`Py_Finalize()`的代码（它存放在[ Python/pythonrun.c ](http://svn.python.org/projects/python/tags/r27/Python/pythonrun.c)）。  它做的非常靠前的一个调用是`wait_for_thread_shutdown()`，这个函数非常值得去看一下，因为我们知道问题是关于线程的。

这个函数反过来调用了`threading`模块中的`_shutdown()`可调用对象，非常好，我们现在可以返回Python代码了。

查看`threading.py` ,我发现了如下有趣的部分：

```python
class _MainThread(Thread):
    def _exitfunc(self):
        self._Thread__stop()
        t = _pickSomeNonDaemonThrad()
        if t:
            if __debug__:
                self._note("%s: waiting for other threads", self)
        while t:
            t.join()
            t = _pickSomeNonDaemonThread()
        if __debug__:
            self._note("%s: exiting", self)
        self._Thread__delete()

# Create the main thread object,
# and make it available for the interpreter
# (Py_Main) as threading._shutdown.

_shutdown = _MainThread().exitfunc
```

很明显，`threading._shutdown()`函数调用的作用就是join所有的非服务化(non daemon)的线程，然后删除主线程（这意味着它确切做了什么）。我决定去给`threading.py`打一点补丁，用`try / except`包裹整个`_exitfunc()`函数体，用`traceback`模块来打印出系统调用栈。这个给出了如下的追踪情况：

```
Traceback (most recent call last):
  File "/usr/lib/python2.7/threading.py", line 785, in _exitfunc
    self._Thread__delete()
  File "/usr/lib/python2.7/threading.py", line 639, in __delete
    del _active[_get_ident()]
KeyError: 26805584
```

现在我们知道了异常抛出的精确位置了，在`Thread__delete()`方法内。

接下来的故事在阅读一会`threading.py`的代码后就变得很明显。`_active`字典将所有已创建的线程的线程ID(由`_get_indent()`函数返回)映射到对应的线程实例上。当`threading`模块载入的时候，` _MainThread`类的实例总是会被创建，而且会被添加到`_active`字典中。（甚至没有创建其他线程的时候主线程实例也会创建）。

问题是当一个`_get_ident()`方法被`gevent`的猴子补丁打过补丁，原来映射的方法`thread.get_ident()`被猴子补丁替换成了`green_thread.get_ident()`。明显两个函数调用返回的主线程ID并不相同。

现在，如果一个`threading`模块在猴子补丁之前被载入，调用`_get_ident()`会返回主线程实例创建的时候添加到`_active`中的ID。而打上猴子补丁以后就会返回另外一个值，在调用`_eixtfunc()`的时候，就会在`del _active[_get_ident()]`语句上抛出异常。

与上面的情况相反，如果猴子补丁在`threading`模块载入之前被打上了，所有的就都会正常。因为`_MainThread`实例被添加到`_active`中和`_get_ident()`都是在打补丁之后调用的，这样在清理线程的时候就会返回同样的线程ID。就是这样了。

为了确保以正确的顺序导入模块，我在我的电脑中添加了如下的代码片段，仅仅在打上猴子补丁之前调用：

```python
import sys
if 'threading' in sys.modules:
    raise Exception('threading module loadded before patching!')
import gevent.monkey; gevent.monkey.patch_thread()
```

希望我的调试经历能够对你有用！
