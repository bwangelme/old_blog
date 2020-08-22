---
title: "Review 《Using pipelining to speedup Redis queries》"
date: 2020-08-22T17:22:37+08:00
lastmod: 2020-08-22T17:22:37+08:00
draft: false
tags: [翻译, Redis]
author: "bwangel"
comment: true
---

> + 原文地址: https://redis.io/topics/pipelining

<!--more-->
---

IMPORTANT NOTE: While the client sends commands using pipelining, the server will be forced to queue the replies, using memory. So if you need to send a lot of commands with pipelining, it is better to send them as batches having a reasonable number, for instance 10k commands, read the replies, and then send another 10k commands again, and so forth. The speed will be nearly the same, but the additional memory used will be at max the amount needed to queue the replies for these 10k commands.


Pipelining is not just a way in order to reduce the latency cost due to the round trip time, it actually improves by a huge amount the total operations you can perform per second in a given Redis server. This is the result of the fact that, without using pipelining, serving each command is very cheap from the point of view of accessing the data structures and producing the reply, but it is very costly from the point of view of doing the socket I/O. This involves calling the read() and write() syscall, that means going from user land to kernel land. The context switch is a huge speed penalty.


```sh
# 执行性能测试
8400 (lazywork) ~/Github/Golang/GoDemo (master)
ø> go run redis_pipelining.go                                                                                                                                                                                                            18:25:16 (08-22)
Start WithPipelining
WithPipelining Running 10000 times cost 9.596085ms
Start WithoutPipelining
WithoutPipelining Running 10000 times cost 263.630767ms
```
