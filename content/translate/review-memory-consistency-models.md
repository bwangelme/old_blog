---
title: "Review 《Memory Consistency Models: A Tutorial》"
date: 2021-01-16T13:34:40+08:00
lastmod: 2021-01-16T13:34:40+08:00
draft: false
tags: [翻译, Go]
author: "bwangel"
comment: true

---

> + 原文地址: https://www.cs.utexas.edu/~bornholt/post/memory-models.html

<!--more-->
---

本文的目标: The cause of, and solution to, all your multicore performance problems.


## 顺序一致性 (Sequential consistency)

顺序一致性是一种直观的并行模型。

> + a single main memory, and program order define sequential consistency.
> + 单一主存和按程序顺序执行共同定义了顺序一致性。

定义顺序一致性模型也是 Leslie Lamport 在2013年1月获得图领奖的重要成就之一。

内存一致性模型是软件和硬件之间的一种契约。硬件承诺仅在这个模型允许的范围内重排序指令。
同样，软件也承诺这种重排序可能会发生，在编程时会考虑它们。

## 顺序一致性模型的问题

这个模型的问题就是它运行的太慢了，我们在某一时刻只能运行一个指令，这样就失去了并行运行多个线程的优势。
当前指令的效果对于其它指令可见之前，无法运行更多的指令。

## 保证一致性 (guarantee coherence)

两个线程 A 和 B 对同一块内存地址的写入，其他线程看到的写入顺序是一样。它并不保证 A 和 B 谁先发生，但它保证所有其他线程看到的发生顺序是一致的。

两个CPU 核之间共享的内存是 L3 缓存，通常需要 90 个以上的指令周期才会访问一次 L3 缓存。这对于 CPU 来说是一次昂贵的操作。

## Total Store Ordering

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-01-16-150003.png)

与其等待 __写入操作1__ 的结果变成了对其他线程可见，我们可以将他的结果存储在 store buffer 中。
因此指令2 可以立即开始，而不是等待1将它的结果同步到 L3 缓存中。

因为 store buffer 是在 CPU 核上的，它可以很快速地进行访问。随后，缓存层次结构将会从 store buffer 中拉出 __写入结果__ ，并通过缓存将它传递出去。这样 __写入结果__ 将会变得对所有线程可见。

store buffer 允许我们将 __写入操作1__ 的结果同步到其他线程可见的延迟隐藏起来。

允许使用 store buffer 的内存模型被称作 Total Store Ordering (TSO)。TSO 基本保证了和 SC 同样的承诺，除了它运行使用 store buffer 之外。 这些缓冲区隐藏了写入延迟，大大提高了指令的执行速度。


## Escaping through barriers

现代处理器架构都包括了一种同步操作，让它们宽松的内存模型在必要的时候可以收到控制。最常用的操作是 barrier (或者叫 fence)。

> A barrier instruction force all memory operation before it to complete before any memory operation after it can begin.

在它之后的内存操作开始执行之前，Barrier 指令强迫它之前的所有的内存操作完成。

> That is, a barrier instruction effectively reinstates sequential consistency at a particular point in program execution.

也就是说，barrier 指令在程序执行的特定时间点上，有效地恢复了 __顺序一致性__ 的状态。

> Barriers are an escape hatch to be used sparingly: they can cost hundreds of cycles.

Barriers 是一个从松散内存模型逃出的逃生口，但是它的代价很昂贵，它会花费数百个指令周期。

> A data race is two accesses to the same memory location, of which at least one is a write operation, and with no ordering induced by synchronization.

数据竞争是由于对于同一块内存地区的两次访问导致的，这两次访问至少有一次是写操作，且没有同步原语来控制指令顺序。

> In fact, languages such as C++ and Java offer a guarantee known as sequential consistency for data-race-free programs (or the buzzwordy version, “SC for DRF”). This guarantee says that if your program has no data races, the compiler will insert all the necessary fences to preserve the appearance of sequential consistency. If your program does have data races, however, all bets are off, and the compiler is free to do whatever it likes.

> The intuition is that programs with data races are quite likely to be buggy, and there’s no need to provide strong guarantees for such buggy programs. If a program has deliberate data races, the programmer likely knows what they’re doing anyway, and so can be responsible for memory ordering issues themselves.

事实上，诸如 C++ 和 Java 这种语言，都提供了一个保证。对于没有数据竞争的程序，它们将会插入必要的 fence 指令，确保程序的指令执行顺序看起来和顺序一致性内存模型相同。如果你的程序存在数据竞争，那么这种保证就不存在了，编译器将会做它想做的任何事情。

我们的直觉是存在数据竞争的程序通常都会有 bug，所以编译器没有必要为一个存在 bug 的程序提供这么强的保证。同时，如果程序确实存在数据竞争，那么程序员通常知道他们做什么，那么这里的指令重排序也可以由程序员自己来负责。
