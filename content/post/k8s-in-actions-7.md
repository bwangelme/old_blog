---
title: "《K8s in Actions》第七章学习笔记"
date: 2021-01-08T07:51:51+08:00
lastmod: 2021-01-08T07:51:51+08:00
draft: false
tags: [Kubenetes, 笔记]
author: "bwangel"
comment: true

---

> ConfigMap 和 Secret 配置应用程序
<!--more-->

---

## 配置容器化应用程序

配置应用程序的方法:

1. 向容器传递命令行参数
2. 为每个容器设置自定义的环境变量
3. 通过特殊类型的卷将配置文件挂载到容器中

## 向容器传递命令行参数

+ ENTRYPOINT 定义容器启动时被调用的可执行程序
+ CMD 指定传递给 ENTRYPOINT 的参数


TODO: 可配置化 fortune 镜像中的间隔参数
