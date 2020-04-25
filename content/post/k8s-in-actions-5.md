---
title: "《K8S in Actions》 第五章学习笔记"
date: 2020-04-22T21:44:44+08:00
lastmod: 2020-04-22T21:44:44+08:00
draft: false
tags: [Kubernetes, 笔记]
author: "bwangel"
comment: true

---

> 服务：让客户端发现 Pod 并与之通信

<!--more-->
---

## 介绍服务

K8S 服务是一种 __为一组功能相同的 Pod 提供单一不变的接入点__ 的资源。

+ kubia-svc.yaml