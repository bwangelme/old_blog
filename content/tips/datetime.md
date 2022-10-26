---
title: "日期和时间格式"
date: 2022-10-26T11:32:14+08:00
lastmod: 2022-10-26T11:32:14+08:00
draft: false
tags: [tips, datetime]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

- ISO 8601 定义了大量的日期/时间格式，为了简化开发 & 减少 bug, [w3 规范](https://www.w3.org/TR/NOTE-datetime)定义了一个通用的时间格式
    - `YYYY-MM-DDThh:mm:ss.STZD`
        - YYYY/MM/DD 四位数年份/月/日
        - T 表示后面跟了一个时间
        - hh:mm:ss 两位数的时分秒
        - S 一位或多位小数表示秒的一部分，最小是1, 最大不限制
        - TZD 时区指示符
- W3 规范规定 TZD 可以有两种形式
    1. 表示一个 UTC 时间，TZD 可以写成一个 `Z`, 例如 `1994-11-05T13:15:30Z` 表示 utc 时间
    2. 表示本地时间, TZD 写成 `+HH:MM` 或 `-HH:MM`，表示当地时间相对 utc 时间的偏移量, 例如 `1994-11-05T13:15:30+08:00` 表示东八区时间，即北京时间
- 协调世界时的缩写为UTC。国际电信联盟希望协调世界时能够在所有语言有单一的缩写。英语和法语区的人同时希望各自的语言缩写－CUT (Coordinated Universal Time) 和 TUC (Temps Universel Coordonné) 能够成为国际标准，结果最后妥协使用UTC。


## 参考链接

- [Date and Time Formats](https://www.w3.org/TR/NOTE-datetime)
- [关于时间格式 2016-08-9T10:01:54.123Z 20160809100154.123Z 处理方法](https://blog.csdn.net/hsany330/article/details/70332483)
- [协调世界时](https://zh.m.wikipedia.org/zh-hans/%E5%8D%8F%E8%B0%83%E4%B8%96%E7%95%8C%E6%97%B6#cite_ref-29)
