---
title: "Cluster Pods"
date: 2022-07-13T20:23:33+08:00
lastmod: 2022-07-13T20:23:33+08:00
draft: false
tags: [tips, k8s, prom]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

+ 统计集群中运行 pod 的数量

```
sum(kube_pod_status_phase{phase="Running"})
```

`kube_pod_container_status_ready` 指标有 `namespace`, `cluster`, `phase` Label 可以对指标进行筛选，其他的看起来都是 prom 相关的

phase 有五种: Pending|Running|Succeeded|Failed|Unknown

+ 统计处于 Running 和 Succeeded 状态的 Pod，某些 Job 执行成功后是 Succeed 状态

```
sum(kube_pod_status_phase{phase=~"Running|Succeeded"})
```

+ 按 namespace 统计集群中运行 pod 的数量，并按逆序排序

```
sort_desc(sum(kube_pod_status_phase{phase="Running"}) by (namespace))
```

## 参考链接

- [Pod Metrics](https://github.com/kubernetes/kube-state-metrics/blob/master/docs/pod-metrics.md)
