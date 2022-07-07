---
title: "进程卡住如何 debug"
date: 2022-07-07T19:56:13+08:00
lastmod: 2022-07-07T19:56:13+08:00
draft: false
tags: [tips, linux, process]
author: "bwangel"
comment: true
---

<!--more-->

---

## 进程卡住如何 Debug

### 查看 CPU

利用 prom 指标查看 CPU 使用率，如果从某个时间点后就降低了，说明是阻塞在 IO 上了。

### 查看 IO

+ 查看进程当前建立的网络连接 (进入容器内执行)

```
lsof -i -a -p 1 | grep ESTABLISHED
```

### 利用 strace

+ 查看所有的 open, read 系统调用

```
sudo strace -e trace=open,read -p {pid}
```
