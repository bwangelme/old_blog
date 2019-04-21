---
title: "ARTS 第四周"
date: 2019-04-14T20:02:02+08:00
lastmod: 2019-04-14T20:02:02+08:00
draft: false
tags: [ARTS, ARTS-LIST]
author: "bwangel"
comment: true
toc: true
---

> + 【2019年第15周】【2019/04/08 - 2019/04/14 】
> + A. LeetCode 151
> + R: Go Concurrency Patterns: Pipelines and cancellation
> + T: 
>    + Go 调度器的一个无法执行陷阱
>    + 关于线程同步操作的一道面试题
> + S: 
>    + 腾讯防水墙团队：浅谈业务安全前端对抗
>    + 《Go 语言核心36讲》之 条件变量 sync.Cond
>

<!--more-->

## Algorithm

+ [LeetCode 151题](/2019/04/14/leetcode-151/)

## Review

+ [Go Concurrency Patterns: Pipelines and cancellation](/2019/04/15/review-go-pipelines/)

这篇文章读起来略有些费劲，这周只读了一半，下周继续读完

## Tips

这周写了两篇文章:

+ [关于线程同步操作的一道面试题](/2019/04/13/go-sync-channel/)
+ [Go 调度器的一个无法执行陷阱](/2019/04/10/go-scheduler-pitfall/)

修改了一篇文章:

+ [线程同步操作面试题使用锁的解法](/2019/03/26/go-lock/)

## Share

### 腾讯防水墙团队：浅谈业务安全前端对抗

原文链接: https://mp.weixin.qq.com/s/JBKTuwP5HEjsNLVheppHfg

这篇文章整体是个广告文，但是感觉讲的以下内容有点价值:

> 首先需要给大家一个客观的认识，__类似 Uglify 的代码压缩并不是很好的代码保护手段，因此普遍认为代码压缩不属于代码保护的一部分，代码压缩只是一种代码优化__。前端代码保护大致有两个流派，一个是以语法树变换为基础的混淆保护，一个是以构建私有执行环境为思路的虚拟机保护，谷歌则属于后者。代码混淆的效果因混淆器的负责程度而不同，基础级别的混淆器混淆出来的代码也很容易被逆向，而虚拟机保护的抗逆向效果好，其原理是在 JavaScript 的执行环境之上再设计构建一个虚拟机，所有原有业务逻辑的 JavaScript 代码均转换为该虚拟机可识别的字节码，复杂度较高效果好。

代码压缩并不是代码保护，这点我是很赞同的。想起之前在 V2EX 上，很多人在那争论 `utf-8` 算不算加密算法。我觉得这是很搞笑的争论，并不是说把文本变成人类无法识别的数字就是加密了。

在我的理解中，加密需要保证以下几个特性:

1. 使用秘钥保证被保护的内容的安全，加密算法是否公开不会影响被保护内容的安全性。而且好的加密算法应该是公开的，这样才能让全世界的开发者一起来检验并提高安全性。
2. 密文不能透露出原文的的时间，内容频率等信息。例如经典的凯撒加密算法在现在完全不能使用，很容易通过分析字母频率来破解。


### 《Go 语言核心36讲》之 条件变量 sync.Cond

课程链接：https://time.geekbang.org/column/article/41588 (需要购买方可查看)

+ 条件变量的 Wait 方法执行的操作

  1. 将调用它的 Goroutine 加入当前条件变量的通知队列中
  2. 解锁当前条件变量的底层互斥锁
  3. 让当前 Goroutine 处于等待状态，当前 Goroutine 会阻塞在`Wait`那行代码上
  4. 如果通知到来，唤醒当前 Goroutine，并且锁定条件变量底层的互斥锁，Goroutine 会继续执行后面的代码

+ Wait 为什么要将底层的互斥锁解锁

  + `Wait`解锁遵循了互斥锁的重要原则，成对的锁定和解锁。
  + `Wait`解锁后，其他的 Goroutine 也好修改互斥资源，否则其他 Goroutine 无法获得锁，也无法修改互斥资源。
  + 如果是其他 Goroutine 解锁互斥锁，这样很容易造成多 Goroutine 解锁同一个锁的情况，这样会导致不可恢复的`panic`。

+ `Wait`为什么要使用`for`循环来判断临界条件。

  ```go
  c.L.Lock()
  for !condition() {
      c.Wait()
  }
  ... make use of condition ...
  c.L.Unlock()
  ```
 
  + 假设有多个 Goroutine 同时`Wait`一个`cond`的时候，某个 Goroutine 的`Broadcast`可能会唤醒多个 Goroutine，多个 Goroutine 都去针对`cond`底层的互斥锁上锁，只有一个 Goroutine 会上锁成功，其他 Goroutine 就会阻塞。
  等成功上锁的 Goroutine 执行完之后，其他的 Goroutine 不会再去检查条件了，而是直接上锁，这样就会导致第二次上锁的 Goroutine 获得的临界条件不是预期的值
  所以`Wait`操作要包裹在`for`循环之中。

  + 在多 CPU 核心的计算机系统中，即使没有收到条件变量的通知，调用其`Wait`方法的 Goroutine 也是可能被唤醒的。这是由计算机硬件层面决定的。
