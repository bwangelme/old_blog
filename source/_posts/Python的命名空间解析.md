---
title: Python的命名空间解析
date: 2016-08-03 22:29:41
tags: Python
---

__摘要__:
> 1. 什么是命名空间
> 2. 命名空间有哪些
> 3. 变量查找原则
> 4. 分析一个UnboundLocalError的例子

<!-- more -->

## 什么是命名空间

首先说什么是命名空间呢！我们知道，在Python中，一切都是对象，然后通过name去引用变量。例如我们执行了一条语句`a = 3`,Python做的工作就是让name`a`去引用一个Int对象`3`。这种name和对象的对应关系都存储在一个字典中，而这个字典，就叫做命名空间。任何一个模块，类，实例，函数，都有其命名空间，这个命名空间可以通过`__dict__`来访问。比如下面这段代码：


```python
import sys
   
m = sys.modules[__name__]
   
print(m.__dict__ is globals())
a = 3
   
globals().get('a')
```

    True
    3



在上面的例子中，我们首先通过`sys.modules`获取了当前运行的模块，然后通过`__dict__`成员获取了当前模块的命名空间，然后发现`globals`函数返回的就是当前模块的命名空间。当我们执行了`a = 3`语句以后，可以看到，当面模块的命名空间中多了一个`a`成员，其值为3。

## 命名空间有哪些

前面我们讲到，每个类，函数，实例，模块都有其命名空间，可以通过`__dict__`成员来访问，如下面代码所示：


```python
import sys
   
main_module = sys.modules[__name__]
   
module_member = 'module'
class C:
    class_member = 'class'
   
c = C()
c.instance_member = 'instance'
    
def func():
    func_member = 'function'
    fls = sys._getframe(0).f_locals
    # fls = locals()
    print('fls and locals() are same object? %s' % (fls is locals()))
    print(fls['func_member'])
    
print(main_module.__dict__['module_member'])
print(C.__dict__['class_member'])
print(c.__dict__['instance_member'])
func()
```

    module
    class
    instance
    fls and locals() are same object? True
    function


在上面的代码中，我们分别访问了，模块，类，实例，函数的命名空间，并在其中取出了我们命名的变量。其中，访问函数的命名空间有些特殊，我们是通过`_getframe`函数访问了当前栈帧，然后在栈帧中找到了当前函数的命名空间。当然这个函数的命名空间也可以通过`locals`函数访问到。

## 变量查找原则

从上面的例子中，我们了解到，命名空间其实就是存储name和对象的对应关系的，那么当我们通过一个name来获取一个对象的时候，其查找命名空间的顺序是怎样的呢？在Python中遵循着LEGB的查找原则。

LEGB的意思就是`Local -> Enclosing Function -> Global -> Builtins`

遇到一个name的时候，Python解释器首先会去Local本地命名空间中查找，然后再去其所在函数的作用域中查找，如果还没找到，就回去Global全局命名空间中查找，最后会去`__builtin__`这个模块中去查找，例如下面的一段代码：


```python
x = 1234
__builtin__.s = 'Hello, World!'
def test():
    y = 'abc'
    print(x)
    print(y)
    print(s)
    
test()
```

    1234
    abc
    Hello, World!


在上面的代码中，x是`builtins`命名空间中的name，y是`local`命名空间中的name，s是`Global`命名空间中的name，它们都能够被正确找到并打印出来。

## 分析一个UnboundLocalError例子

在最后，我们来分析这样一段代码：


```python
x = 1234
def test():
    print(x)
    x = 'abc'
    
test()
```


    ---------------------------------------------------------------------------
    
    UnboundLocalError                         Traceback (most recent call last)
    
    <ipython-input-45-9f45a812fe7a> in <module>()
          4     x = 'abc'
          5
    ----> 6 test()
    
    
    <ipython-input-45-9f45a812fe7a> in test()
          1 x = 1234
          2 def test():
    ----> 3     print(x)
          4     x = 'abc'
          5
    
    
    UnboundLocalError: local variable 'x' referenced before assignment

在上面的函数中，我们要打印一个name`x`，它首先会去local本地命名空间中查找，没有找到。然后去当前函数`test`的作用域中查找，找到了。此时Python解释器就会发现`x`这个name还没有添加到local本地命名空间中，就被引用了。所以就会抛出一个异常，说`x`还未被赋值就被引用了。如果我们把代码改成下面这种形式，发现就可以正常运行了：


```python
x = 1234
def test():
    print(x)
    
test()
```

    1234


为什么删除了x的赋值语句，这个函数就能正常运行了呢？
这是因为此时Python解释器查找命名空间的顺序变了。解释器首先会去查找local本地命名空间，发现没有，然后去查找函数`test`的作用域，发现也没有，接着再去查找Global全局命名空间，此时找到了，就会打印出x的值。


```python
import dis
    
x = 1234
def test_right():
    print(x)
    
dis.dis(test_right)
    
print('-' * 20)
    
x = 1234
def test_error():
    print(x)
    x = 'abc'
    
dis.dis(test_error)
```

      5           0 LOAD_GLOBAL              0 (print)
                  3 LOAD_GLOBAL              1 (x)
                  6 CALL_FUNCTION            1 (1 positional, 0 keyword pair)
                  9 POP_TOP
                 10 LOAD_CONST               0 (None)
                 13 RETURN_VALUE
    --------------------
     13           0 LOAD_GLOBAL              0 (print)
                  3 LOAD_FAST                0 (x)
                  6 CALL_FUNCTION            1 (1 positional, 0 keyword pair)
                  9 POP_TOP
    
     14          10 LOAD_CONST               1 ('abc')
                 13 STORE_FAST               0 (x)
                 16 LOAD_CONST               0 (None)
                 19 RETURN_VALUE
    

通过查看这两个函数的反汇编出来的代码可以看到，这两个访问x的时候，一个是通过`LOAD_GLOBAL`指令，访问的全局命名空间，另外一个则是通过`LOAD_FAST`指令访问的本地命名空间。通过这个，可以部分地证明我们上面的猜想。
