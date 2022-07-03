---
title: "K8s Pod 如何结束"
date: 2022-07-03T14:44:36+08:00
lastmod: 2022-07-03T14:44:36+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

k8s 停止 Pod 的过程

1. 将 Pod 的状态设置为 `Terminating`，将 Pod 从 service 的 endpoints 列表中移除。
2. 执行 [preStopHook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#hook-details)
3. 发送 SIGTERM 信号给进程。(注意，k8s 不会等待 preStopHook 结束后再发送信号，发送 SIGTERM 和 执行 preStopHook 是同时进行的)
4. 等待 Pod 正常退出，等待的时间由 `terminationGracePeriod` 设置
5. 如果等待超时，会发送 SIGKILL 信号给进程。
6. 清理 k8s 中存储的 Pod 信息。

## 参考链接

- [Kubernetes best practices: terminating with grace](https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-terminating-with-grace)
