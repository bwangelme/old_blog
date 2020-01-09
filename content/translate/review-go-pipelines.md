---
title: "Review 《Go Concurrency Patterns: Pipelines and cancellation》"
date: 2019-04-15T22:35:48+08:00
lastmod: 2019-04-15T22:35:48+08:00
draft: false
tags: [Tag1, Tag2]
author: "bwangel"
comment: true

---

> + 【[Go Concurrency Patterns: Pipelines and cancellation](https://blog.golang.org/pipelines)】笔记

<!--more-->

## 管道操作的定义

在 Go 中没有管道操作的正式定义，它仅仅是众多并发程序中的一种。

非正式地定义是，管道操作可以由一系列用`channel`连接的__stage__组成，每个__stage__是一组运行着相同函数的 Goroutine。
在每个__stage__中的 Goroutine 中，执行着以下的操作:

+ 通过`inbound` channel 从上游接收值
+ 对输入的值中执行一组操作，通常执行完以后会生成新的值
+ 通过`outbound` channel 向下游发送值

第一个和最后一个__stage__分别通常只有一组`inbound`或`outbound` channel，其他的__stage__可以有任意多个`inbound`和`outbound` channel。第一个__stage__通常叫做`source`或`producer`，最后一个__stage__通常叫做`sink`或`consumer`。

## 管道操作的简单例子

下面是一个管道操作的简单例子，一共分为三个__stage__，`gen`，`sq`，`main`。

+ `gen` 用来生成数字到管道中
+ `sq` 用来处理管道中的数字
+ `main` 用来消费(输出)管道中的数字

```go
package main

import "fmt"

func gen(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out)
	}()

	return out
}

func sq(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			out <- n * n
		}
		close(out)
	}()

	return out
}

func main() {
	c := gen(2, 3)
	out := sq(c)

	fmt.Println(<-out)
	fmt.Println(<-out)


	// 因为 sq 的输入和输出是相同的，所以我们可以把 sq 嵌套使用
	for n := range sq(sq(gen(2, 3))) {
		fmt.Println(n)
	}
}
```

## 扇入/扇出

配合下面这张图，我觉得更容易理解`扇入/扇出`的概念:

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2019-04-07-040937.jpg)

上面的图是一个门电路，看起来就像一个扇子。

+ 从左往右看，将多个管道的数据输出到一个管道中，这就叫做扇入。
+ 从右往左看，将一个管道的数据输出到多个管道中，这就叫做扇出。

下面是一个执行了__扇入/扇出__操作的例子，

+ `gen`生成的数据分别交个了两个`sq`去处理，这叫做扇入。
+ 两个`sq`处理的数据交给`merge`函数统一处理，这叫做扇出。

__注意__: 向关闭的`channel`发送数据将会导致`panic`，所以`merge`函数中使用了`sync.WaitGroup`来确保在关闭`out` channel 的时候，所有读取数据的 Goroutine 已经都执行完毕了。

```go
package main

import (
	"fmt"
	"sync"
)

func gen(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out)
	}()

	return out
}

func sq(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			out <- n * n
		}
		close(out)
	}()

	return out
}

func merge(cs ...<-chan int) <-chan int {
	var wg sync.WaitGroup
	out := make(chan int)

	output := func(c <-chan int) {
		for n := range c {
			out <- n
		}
		wg.Done()
	}
	wg.Add(len(cs))

	for _, c := range cs {
		go output(c)
	}

	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}

func main() {
	in := gen(2, 3)

	// 将 in 中的数据分别分发到两个 Goroutine 中
	c1 := sq(in)
	c2 := sq(in)

	// 将 c1 和 c2 中的数据消费并合并到一起
	for n := range merge(c1, c2) {
		fmt.Println(n) // 4 then 9, or 9 then 4
	}
}
```

