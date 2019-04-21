---
title: "ARTS 第二周"
date: 2019-04-02T21:50:47+08:00
lastmod: 2019-04-02T21:50:47+08:00
draft: false
tags: [ARTS, ARTS-LIST]
author: "bwangel"
comment: true
toc: true
aliases:
  - /2019/04/02/arts-第二周/
---

> + 【2019年第13周】【2019/03/25 - 2019/03/31 】
> + A. LeetCode 8
> + R: The Go Memory Model
> + T: 一条面试题引发的关于 Go 语言中锁的思考
> + S: go reentrant lock(可重入锁) 简单实现

<!--more-->

## Algorithm

+ [Leetcode 8](/2019/04/02/leetcode-%E7%AC%AC8%E9%A2%98/)

## Review

+ [The Go Memory Model](https://golang.org/ref/mem)

这篇文章讲述了 Go 的内存模型。虽然名称叫`Memory Model`，但是我感觉讲的内容并不多。主要讲得就是 Go 中的可见性原则，即一个读操作如果查看变量的值。

这个感觉理解起来比较简单，需要记住的就是如果一个读操作和一个写操作可能同时发生的话，那么读操作可能读取的是旧的值。此时就需要使用同步原语执行同步操作。

可用的同步原语有: `Channel`, `Lock` 和 `Once`。

## Tips

+ [一条面试题引发的关于 Go 语言中锁的思考](/2019/03/26/%E4%B8%80%E6%9D%A1%E9%9D%A2%E8%AF%95%E9%A2%98%E5%BC%95%E5%8F%91%E7%9A%84%E5%85%B3%E4%BA%8E-go-%E8%AF%AD%E8%A8%80%E4%B8%AD%E9%94%81%E7%9A%84%E6%80%9D%E8%80%83/)

## Share

+ [go reentrant lock(可重入锁) 简单实现](https://blog.csdn.net/u012233832/article/details/82501839)

Go 语言中自身并不提供可重入锁，而且 [Go 官方也不愿意添加可重入锁的支持](https://github.com/golang/go/issues/24192)。

上述文章中使用 `sync.mutex` 和 `sync.cond` 实现了简单的可重入锁。主要实现思路就是锁中加一个 Goroutine 的 ID 和 `sync/cond` 同步条件。对于一个已经加锁的锁来说，如果是拥有者 Goroutine 上锁能够正常上锁。如果是其他 Goroutine 上锁的时候，则会利用`cond.wait`执行阻塞操作，直到其他 Goroutine 解锁后唤醒当前 Goroutine。
