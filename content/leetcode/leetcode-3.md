---
title: "Leetcode 第3题"
date: 2019-06-19T23:03:47+08:00
lastmod: 2019-06-19T23:03:47+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
---

> + [LeetCode 3题](https://leetcode.com/problems/longest-substring-without-repeating-characters/)

<!--more-->
---

## 题目描述

https://leetcode.com/problems/longest-substring-without-repeating-characters/

## 解题思路

这个题可以用动态规划的思路来解。

+ 字符串的长度为N,
+ 字符串用`S(N)`表示
+ `S(N)`中__不含重复字符的最长子串__用`NoRepeatSub(N)`表示
+ `NoRepeatSub(N)`的长度用`L(N)`表示

令 `S(N) = S(N-1) + char`

+ `char`不在`S(N-1)`中，`L(N) = L(N-1) + 1`
+ `char`在`S(N-1)`中:
  + `char`在`NoRepeatSub(N)`中, `L(N) = L()`

## 代码

https://github.com/bwangelme/LeetCode-Go/tree/master/l3
