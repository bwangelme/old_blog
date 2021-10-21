---
title: "Redis 备份机制"
date: 2021-10-22T00:00:45+08:00
lastmod: 2021-10-22T00:00:45+08:00
draft: false
tags: [tips, redis]
author: "bwangel"
comment: true
---

<!--more-->

---

## Redis 的 AOF 和 RDB 备份机制

![RDB 和 AOF 介绍](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-02-19-224253.png)

RDB 比 AOF 恢复要快

+ AOF 存储的是写入指令，它恢复是重放写入指令。
+ RDB 恢复时是将文件直接写入内存，恢复速度更快。

RDB 是定时备份，AOF 的每条操作都会写入磁盘(中间有 linux 系统缓存, fsync 会同步系统缓存到磁盘中)，故 RDB 的写入速度要比 AOF 要高。

如果 AOF 和 RDB 备份都存在，那么 redis 优先会从 AOF 恢复数据文件。

### RDB 备份

配置文件中设置:

每条 save 是一个检查点，每隔 `<seconds>` 秒，检查是否有至少 `<changes>` 个key 发生了变化，如果有的话就执行一次备份。

```
# save <seconds> <changes>
save 900 1
save 300 10
save 60 10000
```

RDB 持久化的工作流程:

1. redis 根据配置的检查点，尝试去生成 rdb 快照文件
2. redis fork 一个子进程出来
3. 子进程尝试将数据 dump 到 rdb 快照文件中
4. 完成 rdb 文件的 dump 后，就用新文件替换掉之前的旧文件

如果是通过 `redis-cli shutdown` 的方式来关闭 redis server 的话，redis server 会在关闭之前会同步一次 rdb 文件。

### AOF 备份

配置:

`appendfsync` 表示多长时间执行一次 `fsync` 系统调用，将 os cache 数据写入到磁盘中，默认是 everysec，每秒写一次。

AOF ReWrite 过程:

1. redis fork 一个子进程
2. 子进程基于当前内存中的数据，构建日志，开始往一个新的临时的 aof 文件中写入日志
3. redis 主进程，接收到 client 端的写操作之后，
    1. 往旧的 aof 文件中写日志
    2. 开辟一个新的内存区域，在其中写入日志
4. 子进程写完新的日志文件之后，redis 主进程会将内存区域中的新日志再次追加到新的 aof 文件之中
5. 用新的日志文件，替换掉旧的日志文件
