---
title: "Redis 主从同步细节"
date: 2021-10-22T21:57:55+08:00
lastmod: 2021-10-22T21:57:55+08:00
draft: false
tags: [redis]
author: "bwangel"
comment: true
---

> 介绍了 Redis 的主从同步流程及一些配置选项

<!--more-->

---

## 完整的复制流程

1. slave 启动，获取 master 节点的信息，包括 (master run_id)
2. 如果 slave 中可以找到此 master 的数据，发送 `PSYNC {master run id} {slave offset}` 指令给 master，请求开始部分复制。
3. 如果 slave 找不到 master 的数据，发送 `PSYNC ? -1` 指令给 master，请求全量复制。
4. 口令认证，如果 master 设置了 `requirepass`，slave 节点必须发送 `masterauth` 设置的口令去认证
5. master node 执行一次全量复制/部分复制，将数据同步到 slave 上。
6. master node 后续持续将写命令，异步地发送给 slave，同时会将命令写入到先进先出的队列 backlog 中

主从复制的流程图如下

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2021-10-22-143417.png)

## 复制过程中的参数说明

+ offset (复制偏移量)

master 和  slave 都会维护一个累加的 offset，master 还会维护每个 slave 的offset，用于沟通数据的差异。

`role`命令可以查看复制偏移量

```sh
# master role
127.0.0.1:6379> role
1) "master"  # 服务器的角色
2) (integer) 98  # master 的复制偏移量
3) 1) 1) "127.0.0.1"  # slave host
      2) "6380"   # slave port
      3) "98"     # slave 的复制偏移量

# slave role
127.0.0.1:6380> role
1) "slave"  # 服务器的角色
2) "localhost"  # master host
3) (integer) 6379  # master port
4) "connected"  # 和 master 的连接状态
5) (integer) 112  # slave 的复制偏移量
```

连接状态有以下几种值:

状态|描述
---|---
"none"|主从服务器尚未建立连接
"connect"|主从服务器正在握手。
"connecting"|主从服务器成功建立了连接。
"sync"|主从服务器正在进行数据同步。
"connected"|主从服务器已经进入在线更新状态。
"unknown"|主从服务器连接状态未知。

+ run id

master run id 发生变化时， slave 会重新做全量复制

使用 `info server` 可以查看当前 Redis Server 的 run id

### Full Resynchronization (全量复制)

1. master 执行 bgsave，用子进程生成 rdb 快照文件
2. master 生成快照文件的同时会将随后的操作指令写在内存缓存中
3. master 将 rdb 文件发送给 slave node，如果发送时间超过 `repl-timeout` （默认是 60s），那么 slave node 就会认为复制失败，可以适当调大这个参数.
4. `client-output-buffer-limit slave 256M 64M 60`，如果在复制过程中，内存缓存区持续消耗超过 64M，或一次性超过 256M，那么停止复制，复制失败。
5. slave 将 rdb 文件落盘
6. slave 从 rdb 文件恢复数据，恢复的同时基于旧数据 serve
7. 如果 slave 开启了 aof 备份，那么恢复成功后会立即执行 BGREWRITEAOF，重写 AOF
8. master 在 slave 恢复成功后将内存缓存的操作指令发送给 slave

> __在数据同步时复用 rdb 文件__
>
> 1. 如果 master 在收到 replicaof 指令之前已经执行过一次 bgsave 命令，且数据库在执行 bgsave 之后没有任何变化，那么 master 将会直接向 slave 发送已经生成的 rdb 文件
> 2. 如果 master 在生成 rdb 文件期间，又有多个 slave 请求同步数据，那么 master 会把请求同步的 slave 全部放到队列中，等 rdb 文件生成后，一起发送给队列中的所有 slave

## 在线更新

master 和 slave 执行完全量复制后，

1. master 会将收到的写指令发送给 slave 执行，让两边数据同步
2. master 对每个 slave 都会维护一个先进先出的队列，存储 slave 收到的写指令。可以通过 `repl-backlog-size` 设置这个队列的大小

## 部分复制 (partial resynchronization)

0. 在 redis 2.8 之前，如果 slave 断开连接后又重新建立连接，slave 会请求重新执行一次全量同步，这样非常浪费资源
1. redis 2.8 之后，添加了部分复制的功能
2. 第一次全量复制完成后，master 每次向 slave 发送的指令都会存储到 backlog 中
3. 如果 slave 因为网络原因短暂地断开了连接， slave 重新连接后会发送 replica offset 到 master 中
4. master 如果在 backlog 中找到了 replica offset，master 会将 backlog 中存储的剩余数据发送过来。
5. 如果找不到，master 会开始进行全量复制

> backlog 的容量越大，master 所能容忍的 slave 断线时间也就越长，可以通过 `repl-backlog-size` 选项更改 backlog 的大小。

## 无盘化复制

两个相关选项:

- repl-diskless-sync

开启此选项后，rdb 文件在 master 上不会落盘，会直接发送给 slave，slave 上还是会进行落盘，redis 目前无法做到完全不依靠硬盘实现主从复制。

- repl-diskless-sync-delay

开启无盘化复制后，新的 Slave 无法复用之前已经开始的复制任务，只能等待新的复制任务。`repl-diskless-sync-delay` 设置复制任务在收到 Slave 的请求多久后开始，以等待更多的 Slave 连接，一起发送 rdb 数据。

## 降低数据不一致出现的概率

### 因 master 挂掉出现数据不一致

1. master 将数据同步到 slave 是异步进行的，如果 master 还有部分数据未同步，就挂掉了。哨兵发现 master 不正常，及时切换了 master，但旧 master 中未同步的数据就会丢失掉了。
2. 设置 `min-slaves-max-lag 10` 选项，表示如果超过10秒 slave 没有和 master 通信过，master 就认为 slave 和自己的数据差别太大，不再接收写操作。这样 master 挂掉后可以少丢失一些数据。

### 因集群脑裂出现数据不一致

1. 因为网络原因，集群短暂地分裂成两个，两个 master 都接收数据。网络恢复后，节点少的 master 会重新变成 slave，此时这个 master 上写的数据就会丢失。
2. 设置 `min-slaves-to-write 3` 选项，表示如果 slave 个数小于3，master 就不再接收写操作，小集群的 master 不写数据，集群恢复后，也不会造成数据丢失。

## 过期 key 处理

如果设置了 `slave-read-only=yes`， Slave 不会主动过期 key，master 在将 key 过期后，会发送 DEL 指令给 Slave
