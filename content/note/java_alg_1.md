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

## 如何引用作者的代码

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

对增长数量级常见假设的总结:

描述|增长的数量级|典型的代码|说明|举例
---|---|---|---|---
常数级别|1| `a = b + c;` | 普通语句 | 将两个数相加
对数级别| logN | ![](https://passage-1253400711.cos.ap-beijing.myqcloud.com/2020-11-06-235529.png) | 二分策略 | 二分查找
线性级别| N | ![](https://passage-1253400711.cos.ap-beijing.myqcloud.com/carbon.png) | 循环 | 找出最大元素
线性对数级别| N logN | ![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2020-11-07-001924.png) | 分治 | 归并排序
平方级别 | $N^2$ | ![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2020-11-07-000548.png) | 双层循环 | 检查所有元素对
立方级别 | $N^3$ | ![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2020-11-07-001013.png) | 三层循环 | 检查所有三元组
指数级别 | $2^N$ | 请见第六章 | 穷举查找 | 检查所有子集

## 练习

+ 1.4.26
