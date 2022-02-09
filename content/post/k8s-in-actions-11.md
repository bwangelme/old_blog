---
title: "《K8s in Actions》第十一章杂记"
date: 2022-01-26T23:08:47+08:00
lastmod: 2022-01-26T23:08:47+08:00
draft: false
tags: [kubernetes, 杂记]
author: "bwangel"
comment: true

---

<!--more-->
---

## 了解 K8S 架构

![K8S 架构图](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2022-01-27-000255.png)

K8S 系统组件之间只能通过 API Server 通信，它们之间不会直接通信。API Server 是和 etcd 通信的唯一组件。

检查控制平面组件的状态

```shell
ø> k get componentstatuses
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS      MESSAGE                                                                                       ERROR
scheduler            Unhealthy   Get "http://127.0.0.1:10251/healthz": dial tcp 127.0.0.1:10251: connect: connection refused
controller-manager   Healthy     ok
etcd-0               Healthy     {"health":"true","reason":""}
```

__乐观并发控制__

数据中包含一个版本，每次更新时版本会 +1。

写入时，检查数据库中的版本和被写入的版本之间的差是否等于1，如果不等于，则证明期间该数据被修改过，会拒绝写入。

## API 服务器做了什么

1. 认证插件 __Authentication Plugin__
2. 授权插件 __Authorization Plugin__
3. 准入控制插件 __Admission Control Plugin__

以上每种类型的插件都有多个，API Server 会按顺序执行

K8S 客户端发送的请求，通过以上三个插件的认证，并完成 __资源认证__ 后。API Server 会将对象信息存储到 etcd 中。然后返回一个响应给客户端。

除此之外，API Server 没有做额外的工作。例如，当创建一个 ReplicaSet 资源的时候，它不会去创建 Pod，也不会去管理服务的节点，那是 Controller Manager (控制器管理器) 的工作。

## 调度器

![调度器结构图](https://passage-1253400711.cos.ap-beijing.myqcloud.com/2022-01-26-234210.png)

__默认调度算法__

1. 过滤所有节点
   1. 调度器给节点下发一组配置好的预测函数，这些函数执行完以后。决定该 Pod 能否在当前节点上调度。
2. 选择完节点后，调度器再对节点进行排序，选择一个最合适的节点

__选择调度器__

可以在集群内运行多个调度器

pod 通过 `schedulerName` 属性选择调度器。未设置该属性的 Pod 使用默认调度器进行调度。

## 控制器管理器中运行的控制器

控制器执行一个调和循环，将实际的状态调整为期望状态(在资源 spec 中定义)。然后将新的实际状态写入资源的 status 部分。

因为控制器订阅 API Server 的事件，这不能保证它不会再某些时间漏掉。控制器需要定期执行重新列举操作，确保不会丢掉什么。

> 如何阅读控制器的源码
> 
> 控制器的源码违约 pkg/controller 中
> 
> 每个控制器通常有一个构造器，内部会创建一个 `Informer`。它是个监听器，每次 API 对象有更新就会被调用。
> 
> 接着，可以看 worker 方法，每次控制器工作时会调用 worker，实际函数保存在 syncHandler 或类似的字段里，该字段也会在构造器里初始化。

## 控制器如何协作

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com/2022-02-09-235435.png)

## 了解运行中的 Pod 是什么

Pod 是多个容器的集合，它们共享相同的命名空间。

K8S 创建 Pod 时会创建基础容器 Pause，后续的用户自定义容器都会使用 Pause 容器提供的命名空间。

Pause 容器的生命周期和 Pod 绑定，从 Pod 被调度直到被删除的期间， Pause 容器会一直运行。
如果 Pod 运行期间 Pause 容器被删除了，kubelet 会重建 Pod 中的所有容器。

## 问题

### scheduler 组件挂掉了