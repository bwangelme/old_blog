---
title: "《微服务》学习笔记"
date: 2020-11-23T23:04:35+08:00
lastmod: 2020-11-23T23:04:35+08:00
draft: false
tags: [笔记, ]
author: "bwangel"
comment: true
---

> 学习笔记

<!--more-->
---

## API Gateway 和 BFF

`BFF`: `Backend for frontend` 组装 JSON 数据，不操作数据库，尽量不参与业务逻辑
`API Gateway`: BFF 更上一层，做限流，帐号鉴权(鉴权分为两部分，认证(确定用户id)和鉴定(确定权限)) API Gateway 做认证

鉴权: JWT

## gRPC

gRPC 基于 HTTP/2.0，可以在单条 TCP 连接上复用。

__服务而非对象、消息而非引用__

+ 支持主动健康检查的接口

## 服务发现

+ 服务注册

1. 服务启动成功后自动注册到注册中心
2. 外挂注册，容器中的其他进程检查服务提供者的 healty check 接口，检查成功后，将服务信息发布到 Discover 上。

### 平滑下线 (graceful shutdown)

1. 服务收到一个推出信息, `SIG_QUIT` 信号
2. 服务向注册中心发送一个注销请求，将自己从注册中心删除掉。
3. 服务将自己的健康检查接口标记为失败
4. 服务等待两个 health check 的心跳周期
5. 等请求数，连接数归0时，服务自动推出，如果服务长时间没有推出，发布框架发送 `SIG_KILL` 强制结束服务

### 客户端发现 (Client Side)

服务启动时，将网络地址写到注册中心的注册表上，服务结束时，会从注册中心的注册表上删除。注册中心会有一个心跳机制，定时检查服务的状态，更新注册表。

客户端需要连接服务器时，会从注册中心拉到服务的所有地址，然后用一个负载均衡算法去连接服务器。

### 服务端发现 (Server Side)

客户端通过向负载均衡器向服务发送请求，这个负载均衡器会查询注册中心的服务注册表，并将请求路由到可用的服务实例上。(Consul Template + Nginx, kubernetes + etcd)

### Service Mesh

将 LB 放到 Pod 中，客户端和 LB 之间走进程间通信。

### 注册中心的选型

CAP 理论
一致性算法: Raft, Paxos
注册中心: Consul, Zookeeper, etcd, eureka, nacos

注册中心Feature:

1. 服务健康检查
2. 多数据中心
3. kv存储服务
4. 一致性算法
5. cap
6. 使用接口(多语言能力)
7. watch 支持
8. 自身监控
9. 安全

## 多集群

指的是单个机房内的多集群。
L0 服务，一旦故障影响巨大，考虑同一个业务部署多个集群。
多集群，多份缓存如何清理缓存: 一个 Daemon 订阅 MySQL Binlog，然后广播到所有集群的 Worker 上。
业务正交: 两个业务查询的数据完全不同。

因为业务正交，导致相同业务的不同集群的缓存完全不同，这样在底层业务集群A挂掉时，上层业务A访问底层业务集群B时，会出现大量的缓存 miss，对数据库造成较大压力。
此时就需要分久必合了，将这两个集群从逻辑上统一成一个，不同上层业务随机地访问不同集群，从而使缓存的差异性降低。

如果一个底层业务被太多的上层业务依赖，那就可能使这个底层业务的某些节点连接数非常高，即使在空闲时段，处理 health check 也会消耗大量的资源。此时就需要在上层业务的客户端中均匀地分配节点，尽可能使每个节点的连接数均匀。

+ 节点分配算法

```py
# 每个客户端节点挑选 2~100 个节点进行连接
# backends 表示所有的服务端节点
def Subset(backends, client_id, subset_size):
    # subset_count 表示一个节点集合的节点数量
    subset_count = len(backends) / subset_size

    round = client_id / subset_count
    random.seed(round)
    random.shuffle(backends)

    subset_id = client_id % subset_count

    start = subset_id * subset_size
    return backends[start:start + subset_size]
```

## 多租户

流量在进入的时候根据 http header 进行染色。注册中心路由的时候，根据流量的颜色标签，寻找对应颜色节点。

### 数据

数据库和 Redis 要根据流量的不同，写入不同的数据库。kafka 要根据流量标签，写入不同的 topic。

短信，推送网关，要根据不同的流量标签，决定是否真的执行操作，还是仅记录日志。
