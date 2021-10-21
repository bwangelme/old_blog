---
title: "Redis 集群简介"
date: 2021-10-21T23:40:12+08:00
lastmod: 2021-10-21T23:40:12+08:00
draft: false
tags: [tips, redis]
author: "bwangel"
comment: true
---

<!--more-->

---

## 为什么要有 Redis 集群

redis 单机最多只能支持 1万 到 几万不等的 QPS (根据操作的不同 serve 能力也不同)。如果我们想要支撑更高的 QPS，就需要配置 Redis 集群。

## Redis 集群是为了解决什么问题

Redis 集群可以通过读写分离的设置，支持大规模读多写少的操作场景( QPS 达到百万级)。写多的操作场景单纯配置 Redis 集群是无法支持的，我们还需要更改客户端实现，像 kafka 客户端一样通过队列合并写入操作。

## Redis Replication 是如何工作的

![](https://tva1.sinaimg.cn/large/008i3skNly1gvnd81kfq3j60er0dhjs002.jpg)

Redis 集群的架构图如上所示。

+ Client 将数据写入到 Master 节点后就立刻返回了，Slave 节点从 Master 同步数据过来，Client 不会确认数据是否同步到了 Slave 节点中。
+ 2.8 以后， Slave 会周期性地确认自己复制的数据量
+ Slave 节点也可以连接其他 Slave 节点
+ Slave 节点做复制的时候，不会阻塞 Master 节点，也不会阻塞自己，它会用旧的数据集 Serve，当复制完成时，会删除旧的数据集，加载新的数据集，此时会短暂地停止对外服务。(时间在毫秒到秒之间)
+ Slave 节点主要应用在读多写少场景下的读写分离操作上，扩容 Slave，可以提高集群的 __读__ 吞吐量。

## Redis 集群数据备份的配置

Redis 集群做持久化的时候，需要配置 Master 节点的持久化。因为以下原因：

假设我们配置了 Slave 节点的持久化，而没有配置 Master 节点。当 Master 节点宕机重启后，它会直接认为自己的数据是空的，同时将这个状态同步到 Slave，从而导致集群的数据消失。

尽管 Master 挂掉以后，Sentinel 会切换 Master，但这有时间成本，如果在 Sentinel 发现之前 Master 就重启了，一样会造成数据丢失。
