---
title: "《K8S in Actions》第六章学习笔记"
date: 2020-10-11T14:47:13+08:00
lastmod: 2020-10-11T14:47:13+08:00
draft: true
tags: [Kubernetes, 笔记]
author: "bwangel"
comment: true

---

> 卷: 将磁盘挂载到容器
<!--more-->
---

## 介绍卷

Kubenetes 的卷是 Pod 的一个组成部分，因此像容器一样在 Pod 的规范中就定义了。它们不是独立的 Kubenetes 对象，也不能单独创建或删除。

卷被绑定到 pod 的生命周期中，只有 pod 存在时才会存在，但取决于卷的类型，即使在 pod 和卷消失之后，卷的文件也可能保持原样，并可以挂载到新的卷中。


