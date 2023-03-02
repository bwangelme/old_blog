---
title: "Pod 状态笔记"
date: 2023-03-02T09:31:14+08:00
lastmod: 2023-03-02T09:31:14+08:00
draft: false
tags: [tips, k8s]
author: "bwangel"
comment: true
---

---

## Pod 状态计算细节

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com/2023-03-02-093104.png)

## Pod 的 QoS 分类

> request 是最低资源需求，limit 是最高资源需求

QoS 类别|描述
---|---
Guaranteed(确保)|Pod 的资源 request 和 limit 相同
Burstable(可破裂)| Pod 的资源 request 小于 limit
BestEffort(尽力而为)| Pod 的资源没有设置任何 request 和 limit

当计算节点上存在内存/磁盘压力时，k8s 会按照 `BestEffort -> Burstable -> Guaranteed` 的顺序一次驱逐 pod.

CPU 是可以压缩的资源，当 CPU 存在压力时，k8s 不会驱逐 pod.

通常情况下，Burstable 是最好的 QoS 策略，对于一些重要的核心 pod，可以设置为 Guaranteed, 确保它最后被驱逐。
