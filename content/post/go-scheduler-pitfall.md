---
title: "Go 调度器的一个无法执行陷阱"
date: 2019-04-10T22:18:53+08:00
lastmod: 2019-04-10T22:18:53+08:00
draft: false
tags: [Go, AtomicInteger]
author: "bwangel"
comment: true

---

> __注意__: 这篇文章的答案可以有正确的结果，但解题思路是不对的，正确的思路请参考 [关于线程同步操作的一道面试题](/2019/04/13/go-sync-channel/)

<!--more-->

## 2020年03月16日补充说明

Go 1.14 加入了基于信号的抢占式调度，这个问题在 go 1.14 上已经复现不了了。参考 [go1.14基于信号的抢占式调度实现原理](http://xiaorui.cc/archives/6535)

## 背景说明

前两天遇到了这样一道题目:

> 编写一个程序，开启 3 个线程A,B,C，这三个线程的输出分别为 A、B、C，每个线程将自己的 输出在屏幕上打印 10 遍，要求输出的结果必须按顺序显示。如：ABCABCABC....

__注意__: 

+ 输出要在各自的线程中输出，不能在主线程中输出

## 错误答案

当时想到一种思路是使用 Go `atomic` 包中提供的原子操作来完成上述功能。
即每个`Goroutine`原子性地获得`i`的值，如果符合`i % 3 == threadNum`的条件，则执行操作，否则作自旋。代码如下：

```go
package main

import (
	"fmt"
	"sync/atomic"
)

var (
	end = make(chan struct{})
	i   int32
)

func threadPrint(threadNum int32, threadName string) {

	for {
		v := atomic.LoadInt32((*int32)(&i))
		if v >= 30 {
			break
		}

		if v%3 == threadNum {
			fmt.Printf("%d: %s\n", i, threadName)
			atomic.AddInt32((*int32)(&i), int32(1))
		} else {
			continue
		}
	}
	end <- struct{}{}
}

func main() {
	names := []string{"A", "B", "C"}

	for idx, name := range names {
		go threadPrint(int32(idx), name)
	}

	for _ = range names {
		<-end
	}
}
```

这个程序当时跑的是没有问题的。我把答案发到 V2EX 论坛上之后， V友 @whoisghost 指出了[问题](https://www.v2ex.com/t/552620#r_7143228)

> 把 names 再追加 “ D ”, "E", 把 3 => 5, 30 => 50, 还能正常运行吗？

我照着它的说明试了一下，发现程序会阻塞起来。后来我去查了一下资料，才了解到 Go 的调度器中还有一个隐藏的陷阱。在了解这个陷阱之前，我们需要先了解一下操作系统的线程调度器和 Go 的调度器。

## 操作系统线程调度器

操作系统线程调度器的执行逻辑如下:

  + 操作系统的调度器维护了一组线程的信息，这些线程分别处于`running`, `runnable`, `non-runnable`的状态。
  + 当一个线程在一个 CPU 核心上运行超过一个时间片以后，它就会被系统时钟中断给中断掉。
  + 被中断的线程会保存它的上下文信息，并执行中断处理函数。
  + 中断处理函数会将执行权转交给操作系统的调度器，操作系统的调度器会调取其他的线程来这个 CPU 核心上运行。

## Go 调度器

Go 语言中使用`Goroutine`来实现并发，`Goroutine`类似于线程，但它又是非常轻量的。一个创造成千上万个`Goroutine`的程序很常见，但是创造成千上万个线程的程序却很少见。

`Goroutine`是在用户层实现的，当 Go 程序启动的时候，Go 的运行时会创建`GOMAXPROCS`个系统级线程，然后`Goroutine`就被它在这`GOMAXPROCS`个系统级线程上调度。

Go 语言实现了一个协同式的，部分中断调度器(Golang implements a co-operative partially preemptive scheduler.)。它没有基于时钟中断来实现调度，但调度器可以在系统级线程上并行地运行多个 Goroutine。

在`runtime`提供的构造体，库，系统调用函数中，Go 添加了钩子函数，这些钩子函数能够协同式地启动 Go 的调度器。
Go 通过这种方式来将执行权切换到 Go 调度器，从而避免通过时钟中断来将执行权切换到 Go 调度器。`runtime`提供的这些函数也成为了进入 Go 调度器的入口。
但是如果我们在`Goroutine`中没有调用 `runtime` 的任何函数会发生什么情况呢？

## 代码错误原因简析

在上述代码中，我们启动了5个 Goroutine，在我的电脑上`GOMAXPROCS` 是4。
也就是说有4个`Goroutine`会各自占用一个系统级线程进行自旋操作，但因为它们没有调用`runtime`中的函数，所以它们并不会主动将执行权交给 Go 调度器。
这样始终有一个`Goroutine`无法获得执行的机会，整个程序也就被阻塞住了。

## 解决方案

在生产环境中，我们遇到上述错误的机会很少。因为我们的程序基本都会执行`runtime`中提供的一些功能，例如`channel`，`系统调用`, `fmt.Sprint`, `Mutex`, `time.Sleep`等。

例如如果我们在上述代码第加入一句`time.Sleep(0)`，程序就不会阻塞了，因为`time.Sleep`中包含的钩子函数启动了 Go 调度器，第五个 goroutine 有了执行的机会。

{{< highlight go "linenos=table,linenostart=21" >}}
		if v%3 == threadNum {
			fmt.Printf("%d: %s\n", i, threadName)
			atomic.AddInt32((*int32)(&i), int32(1))
		} else {
			time.Sleep(0) // 加入这条语句
			continue
		}
{{< / highlight >}}

如果我们在生产环境中遇到了这个问题的话，正确的做法应该是加入一句 [runtime.Gosched()](https://golang.org/pkg/runtime/#Gosched)，如下所示:

{{< highlight go "linenos=table,linenostart=21" >}}
		if v%3 == threadNum {
			fmt.Printf("%d: %s\n", i, threadName)
			atomic.AddInt32((*int32)(&i), int32(1))
		} else {
			runtime.Gosched() // 加入这条语句
			continue
		}
{{< / highlight >}}

这样当`Goroutine`自旋的时候，就会主动地去启动 Go 调度器，让其他`Goroutine`获得执行的机会。

## 参考链接

+ [A pitfall of golang scheduler](http://www.sarathlakshman.com/2016/06/15/pitfall-of-golang-scheduler)

