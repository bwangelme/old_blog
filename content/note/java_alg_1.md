---
title: "《算法》第一章学习笔记"
date: 2020-10-29T09:17:19+08:00
lastmod: 2020-10-29T09:17:19+08:00
draft: false
tags: [笔记, algorithm]
author: "bwangel"
comment: true
---

> 第一章基础

<!--more-->
---

## 如果引用作者的代码

本书作者提供了一些基础类(例如 `StdIn`)，放在 [Github](https://github.com/kevin-wayne/algs4) 上，我们将代码下载下来后，通过 `mvn install` 命令安装在本地仓库中。

然后在我们的项目中配置好对 algs4 的依赖，就可以在我们的代码中引用作者提供的基础类了。

```xml
<dependency>
	<groupId>edu.princeton.cs</groupId>
	<artifactId>algs4</artifactId>
	<version>1.0.0.0</version>
</dependency>
```


## 1.4 算法分析

从许多程序中得到的另一个定量观察是运行时间和输入本身相对无关，它主要取决与问题规模。

TODO: 1.4.2.3 实验数据的分析

## 练习

+ 1.4.26
