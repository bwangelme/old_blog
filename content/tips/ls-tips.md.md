---
title: "ls Tips"
date: 2022-08-16T23:10:06+08:00
lastmod: 2022-08-16T23:10:06+08:00
draft: false
tags: [tips, linux]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

__ls 按照修改时间排序__

- `-t` 按照修改时间排序
- `-r` 逆序排序

```sh
xuyundong@Macmini:~/Github/blog$ ls -lt content/tips/
-rw-rw-r-- 1 xuyundong xuyundong  800 8月  16 23:13 ls-tips.md.md
-rw-rw-r-- 1 xuyundong xuyundong 2644 8月  16 23:05 docker-registry.md
-rw-rw-r-- 1 xuyundong xuyundong 1990 8月  11 22:01 stty.md

xuyundong@Macmini:~/Github/blog$ ls -lrt content/tips
-rw-rw-r-- 1 xuyundong xuyundong 1990 8月  11 22:01 stty.md
-rw-rw-r-- 1 xuyundong xuyundong 2644 8月  16 23:05 docker-registry.md
-rw-rw-r-- 1 xuyundong xuyundong  897 8月  16 23:11 ls-tips.md.md
```

## 参考链接
