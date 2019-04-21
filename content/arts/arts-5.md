---
title: "ARTS 第五周"
date: 2019-04-21T23:15:09+08:00
lastmod: 2019-04-21T23:15:09+08:00
draft: false
tags: [ARTS, ARTS-LIST]
author: "bwangel"
comment: true
toc: true
---

> + 【2019年第16周】【2019/04/15 - 2019/04/21 】
> + A. LeetCode 338
> + R: urfave/cli Introduction
> + T: Go import
> + S: EDDYCJY/blog

<!--more-->

## Algorithm

+ [Leetcode 338题](/2019/04/21/leetcode-338/)

## Review

+ [urfave/cli Introduction](https://github.com/urfave/cli/tree/v1.20.0#overview)
+ [Review 笔记](/2019/04/21/go-cli/)

## Tips

### Go import 的说明

+  `package xxx`中`xxx`指的是其他地方访问包里程序实体时使用的名字。
+  代码库的文件路径是其他地方`import`时使用的名字

https://github.com/bwangelme/Golang_Puzzlers/tree/dev/src/puzzlers/article3/q2

例如这个例子，`demo5.go`中 import 使用的名字是 `puzzlers/article3/q2/libiary` ，代码中访问程序实体使用的名字是 `lib.Hello(name)`

## Share

+ [带入gRPC：gRPC及相关介绍](https://github.com/EDDYCJY/blog/blob/master/golang/gRPC/2018-09-23-%E5%B8%A6%E5%85%A5gRPC%E4%B8%80-gRPC%E5%8F%8A%E7%9B%B8%E5%85%B3%E4%BB%8B%E7%BB%8D.md)

感觉 [EDDYCJY/blog](https://github.com/EDDYCJY/blog) 中的Gin系列和gRPC系列讲的挺不错。
