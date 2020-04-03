---
title: "Leetcode 第65题"
date: 2020-04-03T12:37:29+08:00
lastmod: 2020-04-03T12:37:29+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
---

> + [LeetCode 65题](https://leetcode.com/problems/valid-number/)

<!--more-->
---

## 题目描述

Validate if a given string can be interpreted as a decimal number.

Some examples:

```
"0" => true
" 0.1 " => true
"abc" => false
"1 a" => false
"2e10" => true
" -90e3   " => true
" 1e" => false
"e3" => false
" 6e-1" => true
" 99e2.5 " => false
"53.5e93" => true
" --6 " => false
"-+3" => false
"95a54e53" => false
```

Note: It is intended for the problem statement to be ambiguous. You should gather all requirements up front before implementing one. However, here is a list of characters that can be in a valid decimal number:

+ Numbers 0-9
+ Exponent - __"e"__ (注意只支持小写e，不支持大写E)
+ Positive/negative sign - "+"/"-"
+ Decimal point - "."

Of course, the context of these characters also matters in the input.

Update (2015-02-10):
The signature of the C++ function had been updated. If you still see your function signature accepts a const char * argument, please click the reload button to reset your code definition.

## 解题思路

__一定要写单元测试，一定要写单元测试，一定要写单元测试__

这个题你可能本地测得十分正确，但一提交，发现 LeetCode 准备了各种稀奇古怪的输入，结果是提交失败，代码又得改，所以一定要写单元测试，这样能够节省大量的时间。

接下来我们开始分析这道题，就像题目中描述的那样，这道题非常具有迷惑性。一开始以为就是判断个数字，用正则就可以了，后来发现各种复杂的情况太多了，用正则处理不了，得上[状态机](https://zh.wikipedia.org/wiki/%E6%9C%89%E9%99%90%E7%8A%B6%E6%80%81%E6%9C%BA)。

状态机的设计思路就是画个表格，输入的字符作为列(即状态机中的 Action)，在本题中共有四种情况，`数字`, `指数符号`, `正负符号`, `小数点`。行的话就是状态机的`状态`，首先加上起始状态，然后根据输入的情况，酌情添加。表格能够正确处理所有的有效输入后，再去除重复的行(状态)。

最终我设计出来的状态机表格是这样的

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2020-04-03-041334.png)

使用 Graphivz 画出来的效果图是这样的

+ S0 为起始状态，绿色的状态表示输入为有效数字，其他的状态表示解析失败

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2020-04-03-163625.jpg)

## 代码

代码及测试在 [Github@LeetCode](https://github.com/bwangelme/LeetCode-Go/tree/master/l65) 上