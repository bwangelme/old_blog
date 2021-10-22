---
title: "Redis 主从同步细节"
date: 2021-10-22T21:57:55+08:00
lastmod: 2021-10-22T21:57:55+08:00
draft: false
tags: [tips, redis]
author: "bwangel"
comment: true
---

<!--more-->

---

## Redis Replication 复制示意图

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2021-10-22-143417.png)

### Full Resynchronization

1. master 用子线程生成 rdb 快照文件
2. master 生成快照文件的同时会将随后的操作指令写在内存缓存中
3. master 将 rdb 文件发送给 slave
4. slave 将 rdb 文件落盘
5. slave 从 rdb 文件恢复数据
6. master 在 slave 恢复成功后将内存缓存的指令发送给 slave

### 断点重传

1. master 和 slave 都会保存 replica offset
2. slave 启动后会去寻找 replica offset，如果找到了，master 会将后续指令发过来
3. 如果找不到，master 会开启 full resynchronization

## 无盘化复制

两个相关选项:

- repl-diskless-sync

开启此选项后，rdb 文件在 master 上不会落盘，会直接发送给 slave

- repl-diskless-sync-delay

开启无盘化复制后，新的 Slave 连接无法复用之前已经开始的复制任务，只能等待新的复制任务。`repl-diskless-sync-delay` 设置复制任务在收到 Slave 的请求多久后开始，以等待更多的 Slave 连接，一起发送 rdb 数据。

## 过期 key 处理

Slave 不会主动过期 key，master 在将 key 过期后，会发送 DEL 指令给 Slave

