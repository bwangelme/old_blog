---
title: "Go 的测试"
date: 2019-03-24T19:40:53+08:00
lastmod: 2019-03-24T19:40:53+08:00
draft: false
tags: [ARTS, Go, Test]
author: "bwangel"
comment: true
aliases:
  - /2019/03/24/go-的测试/
---

> 主要讲了 Go 相关的测试

<!--more-->

## 测试的基本规则和流程

单元测试分为三类：

1. 功能测试(test)
2. 基准测试(benchmark)
3. 示例测试(example)

## `go test`流程

1. 做准备工作（判断给出的代码包和源码文件是否有效，判断给予的标记是否合法）
2. 针对每个被测试的代码包，依次地进行构建、执行包中符合要求的测试函数，清理临时文件，打印测试结果。（为了加快测试速度，go test 会并发地对多个被测代码包进行功能测试，在最后打印结果时，它会依照我们给定的顺序逐个进行）
3. 为了不影响性能测试结果，性能测试都是串行地运行的。

## 功能测试

### 测试缓存

+ go 会将构建和测试的结果缓存起来，缓存目录可以通过`go env GOCACHE`命令看到
+ `go clean -cache`命令可以删除所有缓存，`go clean -testcache`可以删除所有的测试结果缓存
+ 通过设置环境变量`GODEBUG="gocacheverify=1"`将会导致 go 命令绕过任何的缓存数据，而真正地执行操作，并重新生成所有结果，然后再去检查新的结果与现在的缓存数据是否一致
+ 我们不需要在意缓存数据的存在，因为它们肯定不会妨碍`go test`命令打印正确的测试结果
+ 对于失败测试的结果，`go test`命令并不会进行缓存

### 测试日志

+ `t.Log`和`t.Logf`方法用来打印常规的测试日志，只有测试失败时，这类日志才会被打印。如果测试成功了，它们不会被打印。如果想在测试成功时看到这类日志，可以在`go test`命令上加上`-v`选项。

### 测试方法

+ `t.Fail`方法会让当前测试失败，但不会立刻终止当前测试。
+ `t.FailNow`方法会让当前测试失败，且立刻终止当前测试（注意，是终止当前测试，并不是终止整个测试程序，其他测试还会继续正常运行）。

## 性能测试

### 执行性能测试

> `go test -bench=. -run='^$' puzzlers/article20/q3`

+ `-bench=.`表示执行任意名称的性能测试函数
+ `-run='^$'`表示执行空名称的功能测试函数，即不执行任何功能测试函数。（不加`--run=^$'`的话也会执行此测试包中的功能测试函数）
+ `-bench=`和`-run`都必须使用正则表达式

### 性能测试结果

```
>>> go test -v -bench=. -run='^$' puzzlers/article20/q3                                                               20:02:05 (03-03)
goos: darwin
goarch: amd64
pkg: puzzlers/article20/q3
BenchmarkGetPrimes-4      300000              5571 ns/op
PASS
ok      puzzlers/article20/q3   1.739s
```

+ 重点描述倒数第三行，`BenchmarkGetPrimes-4`被称为单个性能测试的名称，它表示执行了性能测试`BenchmarkGetPrimes`，并且当时所用的最大 P 的数量为4。
  + 最大 P 的数量相当于可以同时运行 Goroutine 的逻辑 CPU 的最大个数，这里的逻辑 CPU 也可以被称为 CPU 核心，但它并不等同于计算机中真正的 CPU，只是 Go 语言运行时系统内部的一个概念，代表着它同时运行 Goroutine 的能力。
  + 可以在测试时通过`-cpu 8`选项来调整最大 P 个数，它可以模拟被测程序在计算能力不同的计算机中的性能表现
+ `300000`表示被测试函数的执行次数
+ `5571 ns/op`表示执行被测试函数的平均执行时间是 5571 纳秒。

![](https://static001.geekbang.org/resource/image/78/69/78d4c73a9aa9d48b59d3fd304d4b2069.png)

### 性能测试过程

+ 在测试时间上限不变的情况下，`go test`会不断调整`b.N`的值，直到找到被测程序的最大执行次数。这样的过程称为 __对性能测试函数的一次探索式执行__ 。

+ 测试函数的实际执行次数

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2019-03-06-235218.jpg)

### 性能测试的计时器

+ `b.StopTimer`和`b.StartTimer`可以停止和启动计时器，将某些代码的执行过程不计入总的执行时间中
+ `b.ResetTimer`用于去除在调用它之前的那些代码的执行时间

```go
package q3

import (
	"testing"
	"time"
)

func BenchmarkGetPrimes(b *testing.B) {
	// 你可以注释或者还原下面这四行代码中的第一行和第四行，
	// 并观察测试结果的不同。
	b.StopTimer()
	time.Sleep(time.Millisecond * 500) // 模拟某个耗时但与被测程序关系不大的操作。
	max := 10000
	b.StartTimer()

	for i := 0; i < b.N; i++ {
		GetPrimes(max)
	}
}
```

```sh
>>> go test -count=2 -bench=. -v puzzlers/article21/q3                                                                08:10:39 (03-07)
goos: darwin
goarch: amd64
pkg: puzzlers/article21/q3
BenchmarkGetPrimes-4       20000             67431 ns/op
BenchmarkGetPrimes-4       20000             68273 ns/op
PASS
ok      puzzlers/article21/q3   8.069s
>>> go test -count=2 -bench=. -v puzzlers/article21/q3                                                                08:11:00 (03-07)
goos: darwin
goarch: amd64
pkg: puzzlers/article21/q3
BenchmarkGetPrimes-4       10000            113835 ns/op
BenchmarkGetPrimes-4       10000            115399 ns/op
PASS
ok      puzzlers/article21/q3   11.993s

# 注释掉计时器相关的代码后，程序的平均执行时间增加了500毫秒左右
```

## 思考题

### `-benchmem`标记和`-benchtime`标记的作用分别是什么？

`-benchmem` 输出基准测试的内存分配统计信息。
`-benchtime` 用于指定基准测试的探索式测试执行时间上限

```sh
$ go test -bench=. word
goos: linux
goarch: amd64
pkg: word
BenchmarkIsPalindrome-4     2000000000     0.00 ns/op
PASS
ok     word    0.002s
$ go test -bench=. -benchmem -benchtime 10s word
goos: linux
goarch: amd64
pkg: word
BenchmarkIsPalindrome-4     10000000000     0.00 ns/op     0 B/op     0 allocs/op
PASS
ok     word    0.003s
```

+ 注意输出部分多的那两部分（0 B/op，0 allocs/op）以及执行次数。

### 怎样在测试的时候开启测试覆盖度分析？如果开启，会有什么副作用吗？

+ 使用`-coverprofile=xxxx.out`输出覆盖率的out文件，使用`go tool cover -html=xxxx.out`命令转换成Html的覆盖率测试报告。
+ 覆盖率测试将被测试的代码拷贝一份，在每个语句块中加入bool标识变量，测试结束后统计覆盖率并输出成out文件，因此性能上会有一定的影响。
+ 使用`-covermode=count`标识参数将插入的标识变量由bool类型转换为计数器，在测试过程中，记录执行次数，用于找出被频繁执行的代码块，方便优化。
