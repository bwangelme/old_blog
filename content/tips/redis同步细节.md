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

## 完整的复制流程

1. slave 启动，获取 master 节点的信息，包括 (master run_id)
2. slave 内部有定时任务，每秒检查是否有新的 master 节点，如果发现，就和 master 建立 socket 连接
3. slave 节点发送 PSYNC 命令给 master
4. 口令认证，如果 master 设置了 requirepass，slave 节点必须发送 master auth 的口令过去认证
5. master node 执行一次全量复制，将所有数据发送给 slave node
6. master node 后续持续将写命令，异步地发送给 slave node

## offset

master 和  slave 都会维护一个累加的 offset，master 还会维护每个 slave 的offset，用于沟通数据的差异。

## backlog

master 中有 backlog，默认大小是 1M，主要用于全量复制中断时，做增量复制用的

## run id

master run id 发生变化时， slave 会重新做全量复制

## Redis Replication 复制示意图

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2021-10-22-143417.png)

### Full Resynchronization

1. master 执行 bgsave，用子进程生成 rdb 快照文件
2. master 生成快照文件的同时会将随后的操作指令写在内存缓存中
3. master 将 rdb 文件发送给 slave node，如果发送时间超过 repl-timeout （默认是 60s），那么 slave node 就会认为复制失败，可以适当调大这个参数.
4. `client-output-buffer-limit slave 256M 64M 60`，如果在复制过程中，内存缓存区持续消耗超过 64M，或一次性超过 256M，那么停止复制，复制失败。
5. slave 将 rdb 文件落盘
6. slave 从 rdb 文件恢复数据，回复的同时基于旧数据 serve
7. 如果 slave 开启了 aof 备份，那么恢复成功后会立即执行 BGREWRITEAOF，重写 AOF
8. master 在 slave 恢复成功后将内存缓存的指令发送给 slave

### 增量复制

1. 复制过程中，如果因为网络中断复制失败了，slave 重新连接上 master 后，就会触发增量复制。
2. slave 启动后会去寻找 replica offset，如果找到了，master 会将 backlog 中存储的数据发送过来。
3. 如果找不到，master 会开启 full resynchronization

## 无盘化复制

两个相关选项:

- repl-diskless-sync

开启此选项后，rdb 文件在 master 上不会落盘，会直接发送给 slave

- repl-diskless-sync-delay

开启无盘化复制后，新的 Slave 无法复用之前已经开始的复制任务，只能等待新的复制任务。`repl-diskless-sync-delay` 设置复制任务在收到 Slave 的请求多久后开始，以等待更多的 Slave 连接，一起发送 rdb 数据。

## 过期 key 处理

Slave 不会主动过期 key，master 在将 key 过期后，会发送 DEL 指令给 Slave

