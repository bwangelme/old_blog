---
title: 说说 Python 中的字符串编码
date: 2016-11-09 07:39:38
tags: ['python']
---

__摘要:__
> 1. Python2 中的字符串
> 2. Python3 中的字符串
> 3. Python2 中的一个经典问题

<!-- more -->

## Python3 中的字符串

要想搞清楚 Python 中的字符串，我觉得还是从3开始说起比较好，3中的字符串的概念变得清晰了很多，先搞懂了3，我们看起2中的那些弯弯绕来或许就会更容易一些吧。

### Str 和 Bytes

Python3 中正式将这两个概念区分开了，Str 表示的是字符串，拥有编码类型，Bytes 表示的是字节流，没有编码类型。

而`S.encode(encoding='utf-8', errors='strict') -> bytes`函数，就是将字符串 S 以编码`encoding`来识别，然后将之编码成`Bytes`。

而`bytes.decode(self, /, encoding='utf-8', errors='strict')`函数，则是以编码`encoding`来识别字节流bytes，同时将之解码成字符串`Str`。

### 指定编码和实际编码

好吧，`制定编码`和`实际编码`这两个术语是否存在我也不确定，这是我自创的，但是我这不是瞎创造新名字，是为了和大家解释其中的概念。

当我们创建一个新的字符串的时候，字符串会有一个`指定编码`，既 Python 认为这个字符串是以什么编码来存储的，这个指定编码我们可以用`sys.getdefaultencoding()`函数来获取到，比如下面这样：

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

不过有一点需要大家注意，Python2 中默认的指定编码是`ascii`，而系统的默认编码通常都不会是这个(比如我的 Linux 是`utf-8`)，Python2 在这里就默默地挖下了一个大坑了。

### Str 和 Unicode

## Python2 中的一个经典问题
