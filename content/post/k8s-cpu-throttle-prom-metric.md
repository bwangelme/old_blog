---
title: "K8S 中观察 CPU Throttling 情况的指标"
date: 2022-08-16T23:14:25+08:00
lastmod: 2022-08-16T23:14:25+08:00
draft: false
tags: [kubernetes, prom]
author: "bwangel"
comment: true

---

<!--more-->
---

## 观察容器 CPU THrottling 的指标

k8s 中为每个 Pod 提供了限制 CPU 资源的选项，当 POD 使用的 CPU 资源超出设置的 limit 时，会发生 Throttling 的情况，即进程被分配的 CPU 时间片被夺走了。

cAdvisor 提供了三个关于 CPU 运行时间的指标

name|desc|解释
---|---|---
container_cpu_cfs_throttled_periods_total|Number of throttled period intervals|容器被 Throttled 的 CPU 时间片数
container_cpu_cfs_throttled_seconds_total|Total time duration the container has been throttled|容器被 Throttled 的 CPU 时间(单位是秒)
container_cpu_cfs_periods_total|Number of elapsed enforcement period intervals|容器被分配的，应该执行的 CPU 时间片书

以上三个指标都是 prometheus 中的 counter 类型，即只会增加的绝对值，它们的数值对于维护者的观察意义也不大。

我们常用的指标是

$$
\frac{rate(container-cpu-cfs-throttled-periods-total[5m])}{rate(container-cpu-cfs-periods-total[5m])}
$$

它表示 CPU 被 Throttling 的时间片占总分配的时间片的比重。我们以此来判断某个容器的 CPU 资源是否不足。

## 指标的去重

以上三个指标针对每个 Pod 都有 N+1 个，

1. pod 的总指标
2. pod 中每个容器的指标

所以计算时，我们需要设置 `{container=""}` 或 `{image=""}` 来只保留 pod 的指标

## 指标加上 Pod label

以上的三个指标，他们中的 label 都是和容器相关的(`pod`, `container`, `image`)，我们需要根据 pod 的 label 来对指标进行聚合，观察某个 deployment 或某个 k8s job 的 CPU Throttling 情况，此时，我们就需要用到 `kube_pod_label` 指标，来和上述指标进行相乘。

`kube_pod_label` 是 [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) 提供的指标，它将 k8s label 转换成 prometheus 指标，每个 pod 上的 k8s label 都在 prom 指标中变成 `label_xx` 的形式。例如我们假设某个 pod 有 app 和 owner 两个 k8s label，那么它的 prom 指标如下

```
kube_pod_labels{
    cluster="local", container="kube-state-metrics", endpoint="http",
    instance="172.19.2.101:8080", job="kube-state-metrics", label_app="http-bin",
    label_owner="xyd", namespace="default",
    pod="http-bin-867bc77ld45d", prometheus="monitoring/kube-prom-kube-prometheus-prometheus",
    uid="7b9c5473-1455-454d-b5a3-69f08dc99bb1"
}
```

```
rate(container_cpu_cfs_throttled_periods_total{pod="http-bin-867bc77ld45d", image=""}[5m])
    * on(pod) group_left(label_app, label_owner)
kube_pod_labels{namespace="default", pod="http-bin-867bc77ld45d"}
```

上面的计算公式中，

- `* on(pod)` 表示左边的指标 `container_cpu_cfs_throttled_periods_total` 和右边的指标 `kube_pod_labels` 根据相同的 `pod` label，对 value 进行相乘。
- `group_left(label_app, label_owner)` 表示将右边指标的 `label_app`, `label_owner` 添加到左边指标中，生成一个新指标
- 如果写成 `group_right(label_app, label_owner)`，表示以右边的指标为基准，将 `label_app`, `label_owner` 添加上，生成一个新指标
- 注意新指标的值是左右两个指标相乘，`kube_pod_labels` 的 value 始终是1, 所以新指标的值和 `container_cpu_cfs_throttled_periods_total` 相同
- 如果针对同一个 pod label, `container_cpu_cfs_throttled_periods_total` 有多个，那么就只能写 `group_left(label_app, label_owner)`
    - 如果写 `group_right(label_app, label_owner)`，prom 不知道如何将多个 `container_cpu_cfs_throttled_periods_total` 聚合起来，就会报错
    ```
    Error executing query: found duplicate series for the match group {pod="http-bin-867bc77ld45d"} on the left hand-side of the operation: [{...}, {...}];many-to-many matching not allowed: matching labels must be unique on one side
    ```

为 cpu throttled 指标加上 pod label 后，我们再根据 k8s app sum 一下，就得到我们最终想要的结果了

```
sum(
    rate(container_cpu_cfs_throttled_periods_total{namespace="default", image=""}[5m])
        * on(pod) group_left(label_app, label_owner)
    kube_pod_labels{namespace="default"}
) by (label_app, label_owner)
  /
sum(
    rate(container_cpu_cfs_periods_total{namespace="default", image=""}[5m])
        * on(pod) group_left(label_app, label_owner)
    kube_pod_labels{namespace="default"}
) by (label_app, label_owner)
```

上述指标按 `label_app` 和 `label_owner` 这两个维度，求和了一下符合筛选标签的所有 pod 的 CPU Throttling 时间片的百分比。

