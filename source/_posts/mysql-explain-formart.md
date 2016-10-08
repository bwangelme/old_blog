---
title: "[未完成] MySQL EXPLAIN 语句输出格式"
date: 2016-10-08 20:05:03
tags: [翻译, MySQL]
---

__摘要__:

> 1. MySQL EXPALIN 输出格式
> 2. 本文参考了 [EXPLAIN Output Format](http://dev.mysql.com/doc/refman/5.7/en/explain-output.html#explain_filtered)
<!-- more -->

## 输出列说明

### filtered(JSON name: filtered)

filtered 列代表着将要被表条件过滤的行数的百分比。rows 列代表了将要被检查的行数的百分比，而 `rows * filtered / 100` 代表了将要和前一个表连接起来的行数。在 MySQL 5.7.3 之前，如果你使用了 `EXPALIN EXTEND` 这列才会显示。而在 MySQL 7.3 中，扩展格式是被默认开启了的，所以 `EXTEND` 关键字也没那么必要了。
