---
title: "Glob 语法解析"
date: 2021-10-18T11:38:23+08:00
lastmod: 2021-10-18T11:38:23+08:00
draft: false
tags: [tips, glob]
author: "bwangel"
comment: true

---

Glob 语法

<!--more-->

---

## Tips

通配符|描述|例子|匹配|不匹配
---|---|---|---|---
`*`|匹配任意数量的任何字符，包括无|`Law*`|Law, Laws, Lawyer|GrokLaw, La, aw
?|匹配任何 单个 字符|?at|Cat, cat, Bat, bat|at
[abc]|匹配括号中给出的一个字符|[CB]at|Cat, Bat|cat, bat
[a-z]|匹配括号中给出的范围中的一个字符|Letter[0-9]|Letter0, Letter1 … Letter9|Letters, Letter, Letter10
[!abc]|匹配括号中未给出的一个字符|[!C]at|Bat, bat, cat|Cat
[!a-z]|匹配不在括号内给定范围内的一个字符|Letter[!3-5]|Letter1…|Letter3 … Letter5, Letterxx

+ Gitignore

git 的 .gitignore 文件可以使用 glob 模式匹配， 另外还有一些规则：

所有空行或者以 # 开头的行都会被 Git 忽略
匹配模式可以以 / 开头防止递归
匹配模式可以以 / 结尾指定目录
要忽略指定模式以外的文件或目录，可以在模式前加上惊叹号 ! 取反

+ Python

Python 有进行 glob 匹配的标准库， 使用也很简单：

```py
# -*- coding: utf-8 -*-
import glob

# glob 只有两个函数， 功能差不多， 只不过一个返回列表， 一个返回迭代器

glob.glob('*.org')  # 返回所有后缀名为 .org 的文件

glob.iglob('*/')  # 返回匹配所有目录的迭代器
```


## 参考链接

+ [Glob 语法及解析](https://rgb-24bit.github.io/blog/2018/glob.html)
