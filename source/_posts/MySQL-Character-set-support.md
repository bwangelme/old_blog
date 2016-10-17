---
title: "[未完成]MySQL Character set support"
date: 2016-10-02 08:42:48
tags: [MySQL, 翻译]
---

__摘要__:

> 1. 本文是对MySQL文档 [Character Set Support](https://dev.mysql.com/doc/refman/5.7/en/charset.html) 的翻译

<!-- more -->

## 字符集(character set)和排序规则(collation)概要

一个字符集是一组符号和编码的集合。一个排序规则是一组字符集中用来比较字符的规则的集合。让我们使用一个假想的字符集的例子来分别区分它们。

假设我们有四个字母：A, B, a, b。我们给每个字母赋值一个数字，A = 0, B = 1, a = 2, b = 3。字母 __A__ 是一个符号，数字0是字母 __A__ 的编码，四个字母和它们编码的集合叫做__字符集__(character set)。

假设我们想要比较两个字符串值，A 和 B。做这个最简单的方式就是去查看它们的编码，A 是0，B 是1。因为0比1小，所以我们说 A 比 B 小。刚刚我们所做的事情是将一个排序规则(collation)应用到我们的字符集上。排序规则(collation)是一组规则(比较编码)的集合(在这个例子中仅有一个规则)。我们称这个所有可能的排序规则中最简单的排序规则为二进制排序规则(binary collation)。

但是如果我们想说大写字母和小写字母是等价的，那该怎么排序呢？那么我们将会有至少两个规则：

1. 将小写字母 a 和 b 等价成大写字母 A 和 B。
2. 然后比较它们的编码。

我们称这个为不区分大小写的排序规则。它比起二进制排序规则来要复杂一些。

在现实生活中，大多数的字符集都有许多字符；并不仅仅是 A 和 B 而是包括所有的字母，有时还会包括多字母和东方书写系统中成千上万个字符和许多相关的特殊字符和标点符号。同样在现实生活中，大多数的排序规则都有许多条规则，并不仅仅是区分大小写对于多字符映射(比如德语排序规则中的两个规则之一就是Ö = OE)也会区分口音(口音是和字符相关的一个标记例如德语中的Ö)。

MySQL 能为你做这些事情：

+ 使用各种各样的字符集来存储字符串。
+ 使用各种各样的排序规则来比较字符串。
+ 在同一台服务器上，在同一个的数据库，甚至是在同一个表中，混合使用不同字符集不同排序规则的字符串。
+ 在任何等级上开启特殊的字符集和排序规则。

为了能够有效地使用这些特性，你必须要知道哪些字符集和排序规则是可用的，如何改变默认的排序规则，以及它们是如何影响到字符串操作符和相关函数的行为的。

## MySQL中的字符集和排序规则

MySQL 服务器支持多种字符集。使用__INFORMATION\_SCHEMA.CHARACTER_SETS__表或者__SHOW CHARACTER_SET__语句能够列出所有的可用字符集。下面的例子列出了一部分字符集，如果想要查看完整的信息，请参看[ Section 11.1.14, “Character Sets and Collations Supported by MySQL” ](https://dev.mysql.com/doc/refman/5.7/en/charset-charsets.html)。

    mysql> SHOW CHARACTER SET;
    +----------+---------------------------------+---------------------+--------+
    | Charset  | Description                     | Default collation   | Maxlen |
    +----------+---------------------------------+---------------------+--------+
    | big5     | Big5 Traditional Chinese        | big5_chinese_ci     |      2 |
    ...
    | latin1   | cp1252 West European            | latin1_swedish_ci   |      1 |
    | latin2   | ISO 8859-2 Central European     | latin2_general_ci   |      1 |
    ...
    | utf8     | UTF-8 Unicode                   | utf8_general_ci     |      3 |
    | ucs2     | UCS-2 Unicode                   | ucs2_general_ci     |      2 |
    ...
    | utf8mb4  | UTF-8 Unicode                   | utf8mb4_general_ci  |      4 |
    ...

一个给定的字符集至少有一个排序规则，而大多数的字符集都有多个。通过__INFORMATION\_SCHEMA.COLLATIONS__表或者__SHOW COLLATION__语句可以列出一个字符集所有可用的排序规则。例如，使用下面的语句可以列出 _latin1_ 字符集(cp1252 西欧)所有的排序规则。

    mysql> SHOW COLLATION WHERE Charset = 'latin1';
    +-------------------+---------+----+---------+----------+---------+
    | Collation         | Charset | Id | Default | Compiled | Sortlen |
    +-------------------+---------+----+---------+----------+---------+
    | latin1_german1_ci | latin1  |  5 |         | Yes      |       1 |
    | latin1_swedish_ci | latin1  |  8 | Yes     | Yes      |       1 |
    | latin1_danish_ci  | latin1  | 15 |         | Yes      |       1 |
    | latin1_german2_ci | latin1  | 31 |         | Yes      |       2 |
    | latin1_bin        | latin1  | 47 |         | Yes      |       1 |
    | latin1_general_ci | latin1  | 48 |         | Yes      |       1 |
    | latin1_general_cs | latin1  | 49 |         | Yes      |       1 |
    | latin1_spanish_ci | latin1  | 94 |         | Yes      |       1 |
    +-------------------+---------+----+---------+----------+---------+

*latin1* 的排序规则有如下含义。

| Collation | Meaning |
|-----------|---------|
| latin1_bin| 根据 latin1 的编码进行二进制排序 |
| latin_danish_ci | 丹麦/挪威 |
| latin1_general_ci | 多语言(西欧) |
| latin1_general_cs | 多语言(ISO 西欧)，区分大小写 |
| latin1_german1_ci | 德语 DIN-1 (字典顺序) |
| latin1_german2_ci | 德语 DIN-2 (电话簿顺序) |
| latin1_spanish_ci | 现代西班牙语 |
| latin1_swedish_ci | 瑞典/芬兰 |


排序规则有如下的特点：

 * 两个不同字符集不能有同样的排序规则
 * 每个字符集有一个排序规则称为默认排序规则(*default collation*)。例如，__latin1__ 和 __utf8__ 的默认排序规则分别是 __latin1\_swedish\_ci__ 和 __utf8\_general\_ci__ 。__INFORMATION\_SHCEMA.CHARACTER\_SETS__ 表和 __SHOW CHARACTER\_SET__ 语句表明了每个字符集的默认排序规则。 __INFORMATION\_SHCEMA.COLLATIONS__ 表和 __SHOW COLLATION__ 语句有一列表明每个排序规则是不是它所属字符集的默认排序规则。(是的话值为*YES*，否则值为空)。
 * 排序规则的名字是以它们相关联的字符集的名字作为起始值，后面跟着一个或多个的后缀来表明其他的排序规则特性。如果想要了解更多的排序规则命名规范，请参考[ Section 11.1.3, “Collation Naming Conventions” ](https://dev.mysql.com/doc/refman/5.7/en/charset-collation-names.html)。

当一个字符集有多个排序规则的时候，对于一个给定的应用程序来说哪个排序规则是最适合的可能并不清晰。为了避免选择一个不合适的排序规则，请使用一些代表数据值来执行一些比较，来确认给定的排序规则将值排序的方式是否符合你的期望。

[Collation-Charts.Org](http://www.collation-charts.org/)是一个很有用的网站，用来展示一个排序规则和另外一个排序规则的比较信息。

## 排序规则命名规范

MySQL 排序规则的命名遵循如下的规范：

+ 一个排序规则的名字使用和它相关联的那个字符集的名字作为开始，后面跟着一个或者多个后缀表示排序规则的其他特性。例如，*utf8_general_ci* 和 *latin1_swedish_ci* 分别是 *utf8* 和 *latin1* 字符集的排序规则。
+ 某个语言特定的排序规则包括了语言名。例如，*utf8_turkish_ci* 和 *utf8_hungarian_ci* 分别使用土耳其和匈牙利的的规则来为 *utf8* 字符集排序字符。
+ 一个排序规则可能是区分大小写或者不区分大小写的，也有可能是二进制排序的。对于二进制排序的排序规则，字符比较基于字符的二进制编码值。下面的表格表示了这些排序特性使用的后缀。

> __表格 11.1 排序规则大小写区分的后缀__

> Suffix | Meaning
> -------|--------
> _ai | 不区分口音
> _as | 区分口音
> _ci | 不区分大小写
> _cs | 区分大小写
> _bin | 二进制排序

> 对于没有指定口音的非二进制排序规则，它是由区分大小写来决定的。那就意味着，如果一个排序规则名字中没有包含 *_ai* 或者 *_as* ，名字中的 *_ci* 就暗示着 *_ai*，而 *_cs* 就暗示着 *_as*。

> 例如，*latin1_general_ci* 是不区分大小写的(同时也暗示着不区分口音)。*latin1_general_cs* 是区分大小写的(同时也暗示着区分口音), *latin1_bin* 使用二进制编码的值。

+ 对于 Unicode 字符集，排序规则名字中可能包含着一个版本号，用来表示这个排序规则基于的 UCA(Unicode Collation Algorithm) 的版本。基于 UCA 的排序规则的名字中没有版本号的话，意味着使用了 UCA 加权键 4.0.0 版本。例如：
  + *utf8_unicode_520_ci* 是基于 [UCA 5.2.0 加权键](http://www.unicode.org/Public/UCA/5.2.0/allkeys.txt)。
  + *utf8_unicode_ci* (名字中不含版本号) 是基于 [UCA 4.0.0 加权键](http://www.unicode.org/Public/UCA/4.0.0/allkeys-4.0.0.txt)。
+ 对于 Unicode 字符集来说，*xxx_general_mysql500_ci* 排序规则保留了5.1.24之前的的原始排序规则 *xxx_general_ci* ，同时也允许 MySQL 5.1.24 之前创建的表进行升级。想要了解更多信息，请参考 [ Section 2.11.3, “Checking Whether Tables or Indexes Must Be Rebuilt” ](http://dev.mysql.com/doc/refman/5.7/en/checking-table-incompatibilities.html) 和 [ Section 2.11.4, “Rebuilding or Repairing Tables or Indexes” ](http://dev.mysql.com/doc/refman/5.7/en/rebuilding-tables.html)
