---
title: "关于线程同步操作的一道面试题"
date: 2019-04-13T17:27:36+08:00
lastmod: 2019-04-13T17:27:36+08:00
draft: false
tags: [Go, Channel]
author: "bwangel"
comment: true
toc: true

---

<!--more-->

## 前言

前两天在 V2EX 上发现了[一道好玩的面试题](https://www.v2ex.com/t/547045)，兴致冲冲地写了答案出来，并发到了 [V2EX](https://www.v2ex.com/t/552620) 上。结果发现自己实现的思路完全是错误的，遂把上篇文章推翻，重新写一篇。

## 问题描述及解析

### 问题描述

> 编写一个程序，开启 3 个线程A,B,C，这三个线程的输出分别为 A、B、C，每个线程将自己的输出在屏幕上打印 10 遍，要求输出的结果必须按顺序显示。如：ABCABCABC.... 

为了能够踩到更多的坑，我把上述问题升级了一下，线程数量和打印次数不是一个固定的值，具体如下:

> + 编写一个程序，开启 N 个线程A,B,C...，这N个线程的输出分别为 A、B、C...，每个线程将自己的输出在屏幕上打印 M 遍，要求输出的结果必须按顺序显示。如：ABC...ABC...ABC... 
> + 其中 N <= 1000, M <= 1000

__注意__: 

+ 输出要在各自的线程中输出，不能在主线程中输出

### 题目解析

引用自 V友 [@hjc4869](https://www.v2ex.com/t/552620#r_7144214)

> 这个问题本质上是在实现同步，而不是互斥。同步强调的是做事的先后顺序而不是多线程访问资源的冲突。虽然二者是包含关系并且可以互相实现，但是如果这里第一眼看到题就只是想到用 lock/mutex 而不是 semaphore/channel 去实现，那么显然是对后者的应用不熟，面试要挂的

## 利用 Channel 做信号量的解法

使用信号量的话，这个题的解题思路就很简单:

+ 创建 N 个Goroutine 执行输出操作。
+ 每个 Goroutine 的具体操作可用以下伪代码来表示:

```py
def echo(threadNum, Upstream, Downstream):
  for i in range(M):
    wait Upstream  // 等待上游的信号
    print(threadNum)
    signal Downstream // 给下游发送信号
```

其中`Upstream` 和 `Downstream` 都表示信号量，`A` Goroutine 的 `Downstream` 是 `B` Goroutine 的 `Upstream`，依此类推，所有 Goroutine 会形成一个链式的关系。

可以使用下图来表示:

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2019-04-14-012629.png)

具体代码如下:

```go
package main

import (
	"fmt"
	"log"
)

var (
	N = 5
	M = 2
)

func main() {
	var wait, sig, firstWait, lastSig chan struct{}

	wait = make(chan struct{})
	firstWait = wait

	for i := 0; i < N; i++ {
		sig = make(chan struct{})
		lastSig = sig
		go echo(i, wait, sig)
		wait = sig
	}

	for i := 0; i < M; i++ {
		firstWait <- struct{}{}
		<-lastSig
	}
	close(firstWait)

	_, ok := <-lastSig
	if ok {
		log.Fatalln("Channel not closed")
	}
	// Out
	// 0: A
	// 1: B
	// 2: C
	// 3: D
	// 4: E
	// 0: A
	// 1: B
	// 2: C
	// 3: D
	// 4: E
	// 0: A
	// 1: B
	// 2: C
	// 3: D
	// 4: E
	// Close A
	// Close B
	// Close C
	// Close D
	// Close E
}

func echo(threadNum int, wait chan struct{}, sig chan struct{}) {
	threadName := string('A' + threadNum)

	for _ = range wait {
		fmt.Printf("%d: %s\n", threadNum, threadName)
		sig <- struct{}{}
	}

	close(sig)
	// 这句是我打印出来为了确认所有的 Goroutine 已经关闭了，实际不需要
	fmt.Println("Close", threadName) 
}
```

## FanIn 的方式

> 根据题目要求来看，在主线程中输出结果，有些不符合要求，但有个答案的实现很有意思，我就也放上来了

经V友 @Mark3K 的[补充](https://www.v2ex.com/t/552620#r_7143193)，还可以使用多个 channel 执行扇入(Fan In)操作，避免使用锁。

首先说一下扇入的定义，Go blog 中是这样描述的：

> A function can read from multiple inputs and proceed until all are closed by multiplexing the input channels onto a single channel that's closed when all the inputs are closed. This is called fan-in.

通过将多个输入 channel 多路复用到单个处理 channel 的方式，一个函数能够从多个输入 channel 中读取数据并处理。当所有的输出 channel 都关闭的时候，单个处理 channel 也会关闭。这就叫做扇入。

在维基百科中描述的逻辑门的扇入如下(大家也可以参考这个来理解 Go 中的扇入):

> Fan-in is the number of inputs a logic gate can handle. For instance the fan-in for the AND gate shown in the figure is 3. Physical logic gates with a large fan-in tend to be slower than those with a small fan-in. This is because the complexity of the input circuitry increases the input capacitance of the device. Using logic gates with higher fan-in will help reducing the depth of a logic circuit.

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2019-04-07-040937.jpg)

> 逻辑门中的扇入定义: 一个逻辑门将多个输入处理成一个输出，它能够处理的输入数量就叫做扇入。

理解了扇入的概念后，上述问题的答案也呼之欲出了。我们可以为`A,B,C,...`这N个 Goroutine 创建N个 channel。然后通过一个 FanIn 函数将N个 channel 的输出输入到一个 channel 中。具体代码如下：

```go
package main

import "fmt"

var (
	N = 5
	M = 5
)

func gen(v string, times int) <-chan string {
	ch := make(chan string)
	go func() {
		defer close(ch)
		for i := 0; i < times; i++ {
			ch <- v
		}
	}()
	return ch
}

func fanIn(times int, inputs []<-chan string) <-chan string {
	ch := make(chan string)
	go func() {
		defer close(ch)
		for i := 0; i < times; i++ {
			for _, input := range inputs {
				v := <-input
				ch <- v
			}
		}
	}()
	return ch
}

func main() {
	times := M
	inputs := make([]<-chan string, 0, N)
	for i := 0; i < N; i++ {
		threadName := string('A' + i)
		inputs = append(inputs, gen(threadName, times))
	}
	for char := range fanIn(times, inputs) {
		fmt.Println(char)
	}
}
```

## 使用锁的解决方案

使用锁并不是这个问题的正确解决思路，__甚至会将人的思维带入歧途__，所以不推荐大家使用锁解决。

这是我之前写的旧文，[线程同步操作面试题使用锁的解法](/2019/03/26/go-lock/)，个人觉得某些地方还有一些参考价值，请大家酌情阅读。

## 使用 AtomicInteger 的解决方案

使用`AtomicInteger`并不是一种好的解决方案(因为这个解法让 CPU 持续空转)，但是通过这个解法我们可以了解到 Go 调度器阻塞的一个陷阱，所以也把这种解法放了上来，感兴趣的朋友可以查看我的另一篇文章 [Go 调度器的一个无法执行陷阱](/2019/04/10/go-scheduler-pitfall/)。
