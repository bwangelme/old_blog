---
title: "线程同步操作面试题使用锁的解法"
date: 2019-03-26T21:56:43+08:00
lastmod: 2019-03-26T21:56:43+08:00
draft: false
tags: [Go, 锁, ARTS]
author: "bwangel"
comment: true
aliases:
  - /2019/03/26/一条面试题引发的关于-go-语言中锁的思考/
---

> __注意__: 这篇文章的思路是不正确的，正确的思路请参考 [关于线程同步操作的一道面试题](/2019/04/13/go-sync-channel/)

<!--more-->

## 前言

前两天在 V2ex 上看到了一篇博文，[《一条经典面试题引发的思考》](http://samray.me/%E4%B8%80%E6%9D%A1%E7%BB%8F%E5%85%B8%E9%9D%A2%E8%AF%95%E9%A2%98%E5%BC%95%E5%8F%91%E7%9A%84%E6%80%9D%E8%80%83)，感觉很有意思，我就用 Go 把它的答案实现了一遍。

## 问题描述及一个错误解法

问题如下:

> 编写一个程序，开启 3 个线程A,B,C，这三个线程的输出分别为 A、B、C，每个线程将自己的 输出在屏幕上打印 10 遍，要求输出的结果必须按顺序显示。如：ABCABCABC.... 

一个错误解法如下:

{{< highlight go "linenos=table,hl_lines=13 17" >}}
package main

import (
	"fmt"
	"sync"
)

var mu sync.Mutex
var index int
var endSignal = make(chan struct{})

func echoRoutine(routineIndex int, routineName string) {
	for index < 30 {
		mu.Lock()
		if index%3 == routineIndex {
			fmt.Println(index, routineName)
			index++
		}
		mu.Unlock()
	}

	endSignal <- struct{}{}
}

func main() {
	routineNames := []string{"A", "B", "C"}

	for idx, name := range routineNames {
		go echoRoutine(idx, name)
	}

	for _ = range routineNames {
		<-endSignal
	}
	//Output:
	//0 A
	//1 B
	//2 C
	//3 A
	//4 B
	//5 C
	//6 A
	//7 B
	//8 C
	//9 A
	//10 B
	//11 C
	//12 A
	//13 B
	//14 C
	//15 A
	//16 B
	//17 C
	//18 A
	//19 B
	//20 C
	//21 A
	//22 B
	//23 C
	//24 A
	//25 B
	//26 C
	//27 A
	//28 B
	//29 C
	//30 A
	//31 B
}

{{< / highlight >}}

从上面的输出可以看到，程序还额外输出了两次 A 和 B。首先说结论，这是因为检查条件`index < 30` __没有加锁__。为了理解这个错误，首先我们需要了解一下 Go 的内存模型。

## Go 语言的内存模型

首先说什么是 Go 的内存模型，在官方文档中是这样定义的:

> The Go memory model specifies the conditions under which reads of a variable in one goroutine can be guaranteed to observe values produced by writes to the same variable in a different goroutine.

Go 语言的内存模型规定了一个 Goroutine 可以看见另外一个 Goroutine 修改同一个变量的值的条件，这类似于 Java 内存模型中 __内存可见性__ 问题。

### Happens Before 原则

在 Go 语言中，编译器和处理器会对执行的指令进行重排序。Go 语言会保证的是，在单个 Goroutine 内，重排序后的执行效果和未进行重排序(即在代码中定义的执行顺序)的执行效果是一样。但是在多个 Goroutine 的运行环境下，由于重排序的原因，一个 Goroutine 观察到的执行顺序可能和另外一个 Goroutine 观察到的不一样。例如一个 Goroutine 执行`a = 1; b = 2`，另一个 Goroutine 可能会在`a`被赋值之前先观察到`b`被赋值了。

为了规范读和写的操作，Go 定义了 __happens before__ 原则。对于变量读写操作，我们可以将其称作是事件。事件之间的顺序可以定义为三种，E1 发生在 E2 之前，E1 发生在 E2 之后，E1 和 E2同时发生。

在单个 Goroutine 内，__happens before__ 顺序就是程序执行的顺序，如果下面两个条件都被满足的话，变量`v`的读取事件`r`，可以观察到变量`v`的写入事件`w`。

1. `r`没有在`w`之前发生。
2. 在`w`之后，`r`之前，没有另外一个变量`v`的写入事件`w'`发生。

总的来说，在单个 Goroutine 的环境下，读事件`r`会观察到最近的一个写事件`w`。

在多个 Goroutine 的运行环境下，如果需要让`v`的读取事件`r`观察到其写入事件`w`。需要满足更严格的条件：

1. `w`发生在`r`之前
2. 任何针对共享变量`v`的写入事件都发生在`w`之前或者`r`之后。

因为在多个 Goroutine 的运行环境下，读写事件可能并行地发生，所以第一点更严格了一些，要求`w`必须在`r`之前发生，两者不能同时发生，且它们之间没有其他的写事件`w'`。
因此在多个 Goroutine 访问一个共享变量`v`的时候，我们必须使用[同步事件](https://golang.org/ref/mem#tmp_3)去建立一个 __happens before__ 条件来让读事件观察到目标写事件。

此外，还需要注意的是：

1. 在变量`v`发生写事件之前，它被初始化成对应类型的零值。
2. 大于一个机器字的变量的读写事件，会表现成 __未指定顺序__ 的多次机器字大小的读写操作。

## 正确答案 V1

了解了 Go 内存模型中的 __Happens Before__ 原则之后，我们接着再来分析上述的错误代码。

+ 在 B Goroutine 输出完28之后，A, B, C 都会再循环了一次。
+ 接着会由 C 先来执行输出操作。由于 C 执行第17行`i++`的写操作和 A 和 B 执行第13行`index < 30`读操作是并行发生的，所以 A 和 B 可能读取到的值是29并进入循环。
+ 因为此时 A 和 B 都已经进入循环了，所以会出现多输出一次的情况。
+ A 和 B 进入循环后，由于锁的存在，它们能够获取到正确的`index`的值，所以最后多输出的结果是30和31。

理解了这个错误之后，我们可以把代码稍微改一下，将`index < 30`这个比较操作也置于锁的保护中，就能够得到正确的结果了。

```go
package main

import (
	"fmt"
	"sync"
)

var i int
var mu sync.Mutex
var endSignal = make(chan struct{})

func threadPrint(threadNum int, threadName string) {
	for {
		mu.Lock()
		if i >= 30 {
			mu.Unlock()
			break
		}

		if i%3 == threadNum {
			fmt.Printf("%d: %s\n", i, threadName)
			i++
		}
		mu.Unlock()
	}

	endSignal <- struct{}{}
}

func main() {
	names := []string{"A", "B", "C"}

	for idx, name := range names {
		go threadPrint(idx, name)
	}

	for _ = range names {
		<-endSignal
	}
}
```

## 正确答案 V2 -- 公平锁

上述代码是得到的结果是正确的，但是还存在一些问题。我们想要的执行顺讯是有序的，
但每次解锁的时候，都是 A, B, C 三个 Goroutine 上去抢锁资源。有时候某个 Goroutine 抢到了锁资源，但是其并不符合执行要求(`i%3 != threadNum`)。它就会将锁释放，然后让大家重新再来抢。

这样的争抢索锁资源造成了时间上的浪费，执行了一些不必要的操作。

为了避免这些浪费，我们可以参考 Java 中的公平锁，让解锁的顺序和上锁的顺序匹配，每次只有一个 Goroutine 获得锁资源，大家不必每次都去争抢锁资源。


```go
package main

import (
	"fmt"
	"log"
	"sync"
)

const endNum = 30

type FairLock struct {
	mu        *sync.Mutex
	cond      *sync.Cond
	isHold    bool
	holdCount int
}

func NewFairLock() sync.Locker {
	mu := new(sync.Mutex)
	cond := sync.NewCond(mu)

	return &FairLock{
		holdCount: 0,
		isHold:    false,
		mu:        mu,
		cond:      cond,
	}
}

func (fl *FairLock) Lock() {
	fl.mu.Lock()
	defer fl.mu.Unlock()

	if !fl.isHold {
		fl.holdCount++
		fl.isHold = true
		return
	}

	fl.holdCount++
	for fl.isHold {
		fl.cond.Wait()
	}
	fl.isHold = true
}

func (fl *FairLock) Unlock() {
	fl.mu.Lock()
	defer fl.mu.Unlock()

	if !fl.isHold {
		log.Fatal("unlock of UnLocked mutex")
	}

	if fl.holdCount > 1 {
		fl.cond.Signal()
	}
	fl.isHold = false
	fl.holdCount--
}

var (
	end = make(chan struct{})
	i   int
)

func threadPrint(threadNum int, threadName string, locker sync.Locker) {
	for i < endNum {
		locker.Lock()
		if i >= endNum {
			locker.Unlock()
			continue
		}
		if i%3 != threadNum {
			locker.Unlock()
			continue
		}

		fmt.Printf("%d: %s\n", i, threadName)
		i += 1
		locker.Unlock()
	}
	end <- struct{}{}
}

func main() {
	mu := NewFairLock()
	names := []string{"A", "B", "C"}

	for idx, name := range names {
		go threadPrint(idx, name, mu)
	}

	for _ = range names {
		<-end
	}
}
```

__注意__： 由于可见性的原因，需要在`70~72`行上锁之后加一个判断，保证`i`的值是最新的值。

经 V友 @hheedat 的[提醒](https://www.v2ex.com/t/552620#r_7183057)，`cond.Wait`操作需要放在 `for` 循环中，因为阻塞的 Goroutine 可能会被误唤醒。

Go 的文档中也说明 [`Wait`需要放在`for`循环中](https://golang.org/pkg/sync/#Cond.Wait)。因为在 `Wait` 的过程中，`cond` 相关的锁并没有上锁，所以`Wait`唤醒后，相关的条件不一定是正确的。


## 公平锁的一个错误尝试

在之前的代码中，我尝试利用公平锁上锁和解锁的有序性，来让3个 Goroutine 顺序执行并按顺序输出`A,B,C`。后经V友 [hheedat](https://www.v2ex.com/t/552620#r_7173035) 指出了错误，发现这样的想法是不可行的。因为以下两点是冲突的：

1. 让 Goroutine 在无法获得锁资源的时候阻塞
2. 让 Goroutine 按照 `A,B,C` 的顺序上锁

+ 因为 Goroutine 的启动时间和接收到信号量的时间都是无序的，所以正常情况下无法让 Goroutine 按顺序上锁。
+ 我尝试让 Goroutine 上锁之后使用一个信号通知`main`Goroutine，让`main`Goroutine 再去通知下一个 Goroutine 去上锁。
+ 但由于 Goroutine 上锁之后是阻塞的，所以使用信号通知`main`Goroutine 的方案也是不可行的。

或许还有其他方案，但我认为这样思考的思路是不对的，__这个同步问题本来就应该使用信号量来解决，使用锁并尝试按顺序上锁只是在歧路上越走越远__。


## 参考链接

+ [一条经典面试题引发的思考](http://samray.me/%E4%B8%80%E6%9D%A1%E7%BB%8F%E5%85%B8%E9%9D%A2%E8%AF%95%E9%A2%98%E5%BC%95%E5%8F%91%E7%9A%84%E6%80%9D%E8%80%83)
+ [Memory barrier -- Wikipedia](https://en.wikipedia.org/wiki/Memory_barrier#Multithreaded_programming_and_memory_visibility)
+ [什么是Java中的公平锁？](https://www.zhihu.com/question/36964449/answer/69790971)
+ [The Go Memory Model](https://golang.org/ref/mem#tmp_2)
+ [GoLang内存模型](http://ifeve.com/golang-mem/)
+ [go reentrant lock(可重入锁) 简单实现](https://blog.csdn.net/u012233832/article/details/82501839)
+ [Go Concurrency Patterns: Pipelines and cancellation](https://blog.golang.org/pipelines)
+ [Fan-In Wikipedia](https://en.wikipedia.org/wiki/Fan-in)
+ [V友 Mark3K的评论](https://www.v2ex.com/t/552620#r_7143193)
+ [一条面试题引发的思考 Go 版本](https://www.v2ex.com/t/552620#r_7173035)
