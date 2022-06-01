---
title: "说说 Python2 中的字符串编码"
date: 2016-11-09 07:39:38
lastmod: 2022-06-01 13:20:00
draft: false
tags: [Python]
---

__摘要:__

> + Python2 中 Str 和 Unicode 分别存了什么
> + raw_unicode_escape 编码的作用
> + Python2 中的一个经典编码问题

<!-- more -->

## Python2 中 Str 和 Unicode 分别存了什么

在 Python2 中，str 存储的是 ascii 编码的字节流，unicode 存储的是 Unicode 码点

```py
In [1]: '中'
Out[1]: '\xe4\xb8\xad'

In [2]: u'中'
Out[2]: u'\u4e2d'
```

例如上面的例子，我们分别输入了一个汉字 `中`，`str('中')` 显示的是 `\xe4\xb8\xad`，`unicode('中')` 显示的是 `\u4e2d`。

当我们用 str 存储汉字，在终端中输入时，Python 会根据我们系统的编码(通过 `locale.getdefaultlocale()` 获取)，将其自动 encode 成 ascii 编码的字节流。

我系统的编码是 `utf-8`，所以 `str('中')` 显示的就是 `中` 经过 utf-8 编码后的内容 `\xe4\xb8\xad`。

当我们用 unicode 存储汉字时，Python 会存储这个汉字对应的码点。所以 `unicode('中')` 显示的是 `\u4e2d`。

## raw_unicode_escape 编码是什么

raw_unicode_escape 编码的作用是将 unicode 码点变成 `\uxxxx` 形式的字节流。或者将 `\uxxx` 形式的字节流转换成 unicode 码点。

下面的

```py
In [10]: u'👷'.encode('raw_unicode_escape')
Out[10]: '\\U0001f477'

In [11]: s1 = u'👷'.encode('raw_unicode_escape')

In [12]: len(s1)
Out[12]: 10

In [13]: s2 = u'中'.encode('raw_unicode_escape')

In [15]: s2
Out[15]: '\\u4e2d'

# 注意 s2 的长度是6，它代表了6个字符，而不是一个码点
In [14]: len(s2)
Out[14]: 6

# 将 \u4e2d 字符串变成一个 unicode 码点
In [19]: '\u4e2d'.decode('raw_unicode_escape')
Out[19]: u'\u4e2d'
```

有时候我们想在正则表达式里面写入 unicode 码点，但是 `ur` 前缀已经在 python3 中废弃了，不建议使用，此时就可以用 `raw_unicode_escape` 将 str 解码成 unicode

这是一个匹配所有中日韩字符的正则

```py
In [18]: r'[\u4e00-\u9fff]+'.decode('raw_unicode_escape')
Out[18]: u'[\u4e00-\u9fff]+'
```

__TODO__: `raw_unicode_escape` 和 `unicode-escape` 这两种编码在 Python2 下的表现似乎是一样的，还没发现它们的区别

## str.encode 和 unicode.decode 发生了什么

正常来说，`str` 代表字节流，不应该有 `encode` 函数，`unicode` 代表文本，不应该有 `decode` 函数。但它们确实存在，而且表现还很迷惑。

```py
In [21]: '中'.encode()
---------------------------------------------------------------------------
UnicodeDecodeError                        Traceback (most recent call last)
<ipython-input-21-811e7325d0d9> in <module>()
----> 1 '中'.encode()

UnicodeDecodeError: 'ascii' codec can't decode byte 0xe4 in position 0: ordinal not in range(128)

In [22]: u'中'.decode()
---------------------------------------------------------------------------
UnicodeEncodeError                        Traceback (most recent call last)
<ipython-input-22-2792f6c33b1d> in <module>()
----> 1 u'中'.decode()

UnicodeEncodeError: 'ascii' codec can't encode character u'\u4e2d' in position 0: ordinal not in range(128)
```

例如上面那段代码，`str` 调用 encode 函数会抛出 `UnicodeDecodeError` 异常，`unicode` 调用 decode 函数会抛出 `UnicodeEncodeError` 异常。我个人理解的原因是:

> + `'中'.encode()` 实际上调用的是 `'中'.decode().encode()`
> + `u'中'.decode()` 实际上调用的是 `u'中'.encode().decode()`
> + __注意__: 这段内容属于我的个人猜测，目前未找到相关的代码或文章。

```py
S.encode([encoding[,errors]]) -> object
S.decode([encoding[,errors]]) -> object
```

上面是 `encode` 函数和 `decode`函数的签名，它们都有一个 `encoding` 参数，表示执行编解码操作时所用的编码。

这个参数可以用 `sys.getdefaultencoding()` 可以获取到，Python2 中它默认是 `ascii`。

`'中'.decode().encode()` 在调用 `decode` 时，使用 `ascii` 对字节流 `'\xe4\xb8\xad'` 进行解码，这是一个 utf-8 编码产生的字节流，所以就会抛出 `UnicodeDecodeError` 异常。

同理: `u'中'.encode().decode()` 在调用 `encode` 时，使用 `ascii` 对码点 `u'\u4e2d'` 进行编码，这个码点的范围超出了 128，ascii 编码失败，就会抛出 `UnicodeEncodeError` 异常。


## Python2 中的一个经典问题

接下来，我们来看一个写 Python2 的时候，经常出现的问题：

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

这是因为 Python 写入文件时，调用 `unicode.encode` 将 unicode 转换成了 str，`unicode.encode` 的默认 `encodeing` 参数是 `ascii`，编码中文时就会失败了。

### 解决方案1: 手动设置 encode 的编码参数

这种方案就是我们在写入文件的时候，不让 Python 自动转换字符串类型，而是我们手动用 `utf-8` 将 `unicode` 编码成 `str` 字符串，代码如下：

```py
#!/usr/bin/env python
# -*- coding: utf-8 -*-

data = u"中国汉字"

with open("./file.txt", 'w') as fd:
    fd.write(data.encode('utf-8'))
```

### 解决方案2: 更改 Python 的默认编码参数

这种方案，就是我们在程序的一开始，调用 `sys.setdefaultencoding('utf-8')`，将 encode 和 decode 函数的默认 `encoding` 参数设置为 utf-8

```py
#!/usr/bin/env python
# -*- coding: utf-8 -*-

# 我愿意称这三行为 魔幻三行
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

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
