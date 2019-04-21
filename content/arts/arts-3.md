---
title: "ARTS 第三周"
date: 2019-04-08T21:45:02+08:00
lastmod: 2019-04-08T21:45:02+08:00
draft: false
tags: [ARTS, ARTS-LIST]
author: "bwangel"
comment: true
toc: true
aliases:
  - /2019/04/08/arts-第三周/
---

> + 【2019年第14周】【2019/04/01 - 2019/04/07 】
> + A. LeetCode 258
> + R: The Go Memory Model
> + T: 一条面试题引发的关于 Go 语言中锁的思考
> + S: 怎么才叫熟悉http协议?

<!--more-->

## Algorithm

+ [LeetCode 258题](/2019/04/09/leetcode-258%E9%A2%98%E6%95%B0%E6%A0%B9/)

## Review

+ [A pitfall of golang scheduler](http://www.sarathlakshman.com/2016/06/15/pitfall-of-golang-scheduler)

这篇文章首先描述了一个奇怪的问题，下面的程序会阻塞住，不会停止。

```go
package main

import "fmt"
import "time"
import "runtime"

func main() {
	var x int
	threads := runtime.GOMAXPROCS(0)
	for i := 0; i < threads; i++ {
		go func() {
			for {
				x++
				//runtime.Gosched()
			}
		}()
	}
	time.Sleep(time.Second)
	fmt.Println("x =", x)
}
```

然后作者解释了原因，Go 的线程调度器和操作系统的调度器并不相同。

+ 操作系统的调度器有定时中断，每当一个进程执行完一个时间片以后，就会被中断。同时执行权返回到调度器那里，由调度器来决定接下来执行哪个进程。
+ Go 实现了一个合作的部分抢占式的调度器。它没有实现基于定时器中断的抢占，但是调度器应该能够促进多个 Goroutine 在多个系统级线程上运行。
+ 同时，Go 在`runtime`提供的构造，库和系统调用中添加了钩子，使当前 Goroutine 能够协作地将执行权交到调度器中，让调度器重新调度。

但是如果我们在 Goroutine 中没有调用构造，库或者系统调用的时候，Goroutine 就会一直执行，不将执行权交到 Goroutine 中。
就如上述的代码，程序启动了`GOMAXPROCS`个 Goroutine，它们只执行了一个`x++`操作。`GOMAXPROCS`个 Goroutine 将系统级线程暂满了，main Goroutine 一直处于`runnable`状态，得不到机会执行，所以整个程序就会被阻塞住。
当使用`runtime`提供的 feature 时（例如`channels, systemcalls, fmt.Sprint, Mutex, time.Sleep`），调度器就有机会执行，将 main 调度执行，程序就不会一直阻塞下去了。

当我们遇到没有执行任何`runtime`提供的 feature 的 Goroutine 时，我们可以使用`runtime.Gosched()`手动将Goroutine 的执行权交给调度器，让其他 Goroutine 得到执行的机会。

## Tips

+ [Go 的 Panic 触发及恢复过程](/2019/04/08/go-panic-%E7%9A%84%E8%A7%A6%E5%8F%91%E5%8F%8A%E6%81%A2%E5%A4%8D%E8%BF%87%E7%A8%8B/)

## Share

+ [怎么才叫熟悉http协议?](https://yeqown.github.io/2018/06/28/%E6%80%8E%E4%B9%88%E6%89%8D%E5%8F%AB%E7%86%9F%E6%82%89http%E5%8D%8F%E8%AE%AE/)

这篇文章讲的是基础的 HTTP/1.1 协议，HTTP 协议与 TCP/IP 协议栈的关系，请求和响应包格式都是之前已经了解的知识了，但是感觉它写的3xx 重定向的表格很有意思，之前没有了解过，特此记录一下。

HTTP Code|处理方式|典型的使用场景
---|---|---
302 Found|GET 方法不会变，其他方法__可能__会变成 GET 方法|一个 web 页面如果由于某些意料之外的原因临时不可用了，可以返回这个状态码。这样的话，搜索引擎不会更新它们存储的链接
303 See Other|GET 方法不会变，其他方法将会变成 GET 方法，请求的 body 将会丢失。|用来在 PUT 或者 POST 方法之后执行重定向，用来阻止那个页面刷新后会重新执行一次 PUT/POST 方法
307 Temporary|重定向后的方法不会变，body 也不会丢失|这个 web 页面由于意料之外的原因临时不可用，搜索引擎遇到这个返回码后不会更新它存储的链接。当某个链接是非 GET 的 URL 的时候，这个返回码比302更好。
