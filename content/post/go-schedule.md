---
title: "Go 的调度模型学习笔记"
date: 2020-03-16T01:18:03+08:00
lastmod: 2020-03-16T01:18:03+08:00
draft: false
tags: [笔记, Go]
author: "bwangel"
comment: true

---

> 阅读 [Go 调度模型](https://wudaijun.com/2018/01/go-scheduler/) 后记的笔记

<!--more-->
---

## GPM 模型

+ G: 每个Goroutine都会对应一个 [G 结构体](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/runtime2.go#L387-L386)，它保存了函数执行的栈。
+ P: Processor，逻辑上的处理器，对应 [P 结构体](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/runtime2.go#L523)。在 Go 程序启动后，会创建和CPU内核数相等的 P。用户可以通过`GOMAXPROCS`调整P的数量，不过这个函数会 [STW](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/debug.go#L29)，尽量少调用这个函数。
+ M: Machine, 对应 [M 结构体](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/runtime2.go#L452)，通过 [clone](http://man7.org/linux/man-pages/man2/clone.2.html) 创建的系统级线程，任务的实际执行者。G 和 P 绑定后， P 会放到 M 上执行，M 不保存 G 的状态，所以 G 可以跨 M 执行。
* `GRQ`: Globale Runable Queue，Goroutine 的全局运行队列
* `LRQ`: Local Runable Queue， P 本地保存的 Goroutine 运行队列

Goroutine 创建后，会创建一个G对象，它会先尝试加入到 P 的 runnext中，如果不行的话，会接着尝试 P 的 LRQ，如果仍然不行，会放入到 GRQ 中，同时将当前P的 LRQ 中的一半任务放入到 GRQ 中。

P 运行时会从 LRQ 中取出一个 G，和它绑定到一起，在 M 上运行。
P取 G 的顺序是: `LRQ > GRQ > 从其他 P 偷 G`

## 用户态的阻塞/唤醒

当 G 在用户态阻塞的时候(例如从 channel 读/写)，会将当前 G 的状态从 Running 改为 Wait，同时将 G 放入到一个 wait 队列中(例如 channel 的 wait 队列)。

当 G 被另外一个 G2 唤醒时(通过 [goready 函数](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/chan.go#L299))，那么 G 就会尝试加入到 G2 所在 P 的 runnext 中，如果不成的话，会依次尝试 LRQ 和 GRQ。

## 系统态的阻塞/唤醒

当 G 在 M 上执行系统调用后，它会阻塞，并将状态设置为 syscall 状态。M 也会进行阻塞。G 所绑定的 P 会和当前 G 和 M 解绑，寻找空闲 M，或创建新的 M，继续运行它队列中的其他 G .

当 M 执行完系统调用后，G 会重新寻找一个空闲的 P，进行运行，如果没有空闲的 P，那么它就会进入 GRQ。

## NetPoller

Go 将 epoll 进行了包装(使用了垂直触发)，会单独创建一个名为 NetPoller 的 M 异步处理网络IO，它不需要和 P 进行绑定。

当 G 执行网络 IO 的时候，G 会将当前 M 和 P 解绑，进入到 NetPoller 的 M 中，等待网络 IO 完成，这样即使执行网络 IO 的系统调用，也不会产生阻塞的 M.

当网络 IO 完成后，M 的 Schedule 函数，会通过 [findrunable函数](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/proc.go#L2210) 取到这个 G，继续运行它。

## 抢占式调度

当 G 执行的时间超过 10ms 时，一个名为 sysmon 的 M 就会向其发起抢占式调度。由于 Go 是用户态的代码，并没有时间片和硬中断的概念，所以 Go 抢占式调度的方式是运行方主动将自己挂起。

sysmon 如果要抢占某个 G 的执行权，那么就会设置它的抢占标记([g.stackguard0](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/runtime2.go#L396))。G 在执行函数的时候(具体来说是 [newstack函数](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/stack.go#L916))，会检查抢占标记，如果这个标记已经被设置了，那么它就会通过 [Gosched](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/runtime/stack.go#L1036-L1038) 的方式将自己放到 GRQ 中，重新等待执行。

## 参考链接

1. [Go 调度模型](https://wudaijun.com/2018/01/go-scheduler/)
2. [#64 深入浅出 Golang Runtime](https://www.youtube.com/watch?v=oFJL8S1dwsw)
3. [Go Runtime Scheduler](https://speakerdeck.com/retervision/go-runtime-scheduler)
4. [[译]Go 调度器: M, P 和 G](https://colobu.com/2017/05/04/go-scheduler/)
5. [Golang并发原理及GPM调度策略（一）](https://studygolang.com/articles/16407)
6. [Go 代码 runtime/runtime2.go runtime/proc.go runtime/stack.go](https://github.com/bwangelme/go-1.13/blob/master/src/runtime/runtime2.go)