---
title: 说说 Python 中的字符串编码
date: 2016-11-09 07:39:38
tags: ['python']
---

__摘要:__
> + Python3 中的字符串
> + Python2 中的字符串
> + Python2 中的一个经典编码问题

<!-- more -->

## Python3 中的字符串

要想搞清楚 Python 中的字符串，我觉得还是从3开始说起比较好，3中的字符串的概念变得清晰了很多，先搞懂了3，我们看起2中的那些弯弯绕来或许就会更容易一些吧。

### Str 和 Bytes

Python3 中正式将这两个概念区分开了，Str 表示的是字符串，拥有编码类型，Bytes 表示的是字节流，没有编码类型。

而`S.encode(encoding='utf-8', errors='strict') -> bytes`函数，就是将字符串 S 以编码`encoding`来识别，然后将之编码成`Bytes`。

而`bytes.decode(self, /, encoding='utf-8', errors='strict')`函数，则是以编码`encoding`来识别字节流bytes，同时将之解码成字符串`Str`。

### 指定编码和实际编码

好吧，`指定编码`和`实际编码`这两个术语是否存在我也不确定，这是我自创的，但是我这不是瞎创造新名字， 而是为了和大家解释其中的概念。

当我们创建一个新的字符串的时候，字符串会有一个`指定编码`，既 Python 认为这个字符串是以什么编码来存储的，Python 默认的指定编码我们可以用`sys.getdefaultencoding()`函数来获取到，比如下面这样：

```py
In [5]: import sys

In [6]: sys.getdefaultencoding()
Out[6]: 'utf-8' # 可以看出 Python3 中字符串的指定编码是utf-8
```

但是呢，字符串的实际编码并不是说 Python 指定了哪个就是哪个了，这个和系统的默认编码有关，可以通过`locale.getdefaultlocale()`函数获取到，比如下面这样：

```py
In [7]: import locale
In [8]: locale.getdefaultlocale()
Out[8]: ('en_US', 'UTF-8')
```

这里可以看出，我的 Ubuntu 中，默认语言是`en_US`，默认的编码是`UTF-8`。

## Python2 中的字符串

### 指定编码和实际编码

Python2 中的字符串也有指定编码和实际编码，和上文中的一样，这里就不在赘述。

不过有一点需要大家注意，Python2 中默认的指定编码是`ascii`，而系统的默认编码通常都不会是这个(比如我的 Ubuntu 是`utf-8`)，Python2 在这里就默默地挖下了一个大坑了。

### Str 和 Unicode

Python2 中的字符串，有两种。`str`和`unicode`。但是 Python2 中很坑爹的一点就是它没有表示字节流的对象，所以就由`str`来友情客串了这个角色，但是`str`又不能抛弃自己作为字符串的本职工作，所以就造成了一种很坑爹的状况，`str`既是字符串，又是字节流！文件或者网络IO的时候，要使用`str`对象(其字节流属性)，但是`str`对象本身又是有编码类型的(其字符串属性)。

### encode 和 decode

#### encode() 函数

Python2 中的`encode`和`decode`函数和 Python3 中的有些不同，`encode`函数的声明是这样的：`S.encode([encoding[,errors]]) -> object`，这个函数的作用是将`str`或者`unicode`编码成`str`，其中`encoding`参数指定的是编码结果字符串的编码类型，如果`encoding`没有指定的话，那么编码结果字符串的编码类型取`sys.getdefaultencoding()`。

例如下面这个例子：

```py
>>> u = u"中国汉字"
>>> s = u.encode('gb2312')
```

这条语句的意思就是将`unicode`编码成`str`，指定返回的`str`对象的编码是 gb2312。

这里有一个经典的问题，比如我写下面这样的语句，

```py
>>> u = u"中国汉字"
>>> s = u.encode()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
UnicodeEncodeError: 'ascii' codec can't encode characters in position 0-3: ordinal not in range(128)
```

这里它会抛出一个`UnicodeEncodeError`错误，这是因为第二条语句返回的是一个`str`对象，它的编码类型取`sys.getdefaultencoding()`，默认值为`ascii`，而`ascii`编码类型是不支持中文的，所以就会抛出一个编码错误。

#### decode() 函数

`decode()`函数的声明是这样的`S.decode([encoding[,errors]]) -> string or unicode`，它的作用是将一个`str`对象解码成`unicode`对象? 其中`encoding`参数设置的是被解码字符串的编码类型。而返回的`unicode`对象的默认编码是 utf-8。

## Python2 中的一个经典问题

接下来，我们来看一个我以前写 Python2 的时候，经常出现的问题：

```py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
   
data = u"中国汉字"
   
with open("./file.txt", 'w') as fd:
    fd.write(data)
```

在这个例子中，我想向一个文件中写入一个 Unicode 字符串，但是却抛出了编码问题，

```py
➜ /tmp/encoding $ python2 test.py
Traceback (most recent call last):
  File "test.py", line 7, in <module>
    fd.write(data)
UnicodeEncodeError: 'ascii' codec can't encode characters in position 0-3: ordinal not in range(128)
```

这是因为 Python 写入文件的时候将 Unicode 自动转换成了 Str，然后这个 Str 的指定编码为`ascii`，但是实际内容却是以`utf-8`来编码的汉字，结果就是抛出编码异常了。

### 解决方案1: 手动编码 Unicode

这种方案就是我们在写入文件的时候，不让 Python 自动转换字符串类型，而是我们手动编码成`Str`字符串，并设置该`Str`字符串的编码类型为`utf-8`。代码如下：

```py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
   
data = u"中国汉字"
   
with open("./file.txt", 'w') as fd:
    fd.write(data.encode('utf-8'))
```

### 解决方案2: 更改 Python 默认的指定编码

这种方案，就是我们在程序的一开始，就设置 Python 的`Str`字符串指定编码为`utf-8`，然后`encode()`得到的`Str`对象就是`utf-8`编码类型了。这个，我们要在我们文件的一开始添加上__魔幻三行__：

```py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
   
import sys
reload(sys)
sys.setdefaultencoding('utf-8')     # setdefaultencoding  在被初始化的时被 site.py 掉了
   
data = u"中国汉字"
   
with open("./file.txt", 'w') as fd:
    fd.write(data.encode())
```

当然，更好的方法是将 Python 指定编码设置为系统默认语系的编码，如下所示：

```py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
   
import sys, locale
c = locale.getdefaultlocale()
reload(sys)
sys.setdefaultencoding(c[1])
   
data = u"中国汉字"
   
with open("./file.txt", 'w') as fd:
    fd.write(data.encode())
```

## 最后的废话

至此，大家可以看到 Python2 中的字符串搞得是有多坑爹，连 Python 官方自己都看不下去了， 2020年就要彻底抛弃它了。所以大家还是踊跃的投入 Python3 的怀抱吧！到此，文章正文就结束了，由于我的水平也一般，文中难免也有错漏之处，欢迎大家踊跃打脸，但是借用鸟哥的一句话，[类似“太烂了！”这样无聊中伤的意见我看还是算了](https://github.com/openresty/nginx-tutorials/blob/master/zh-cn/00-Foreword01.tut#L51-L52)。
