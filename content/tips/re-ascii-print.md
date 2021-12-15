---
title: "匹配所有可打印 Ascii 字符的正则"
date: 2021-12-15T19:16:45+08:00
lastmod: 2021-12-15T19:16:45+08:00
draft: false
tags: [tips, 正则表达式]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

`[ -~]` 可以匹配所有的可打印 ascii 字符

```
In [1]: import re

In [2]: p = re.compile('[ -~]')

In [3]: p.match('中文')

In [4]: p.match('ドウバン')

In [5]: p.match('^&#^&@#abcdefdjskla')
Out[5]: <re.Match object; span=(0, 1), match='^'>
```

它的原理就是匹配 ASCII 码表中所有从 `空格(0x20)` 到 `-(0x7E)` 的字符

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-12-15-191941.png)

## 参考链接
