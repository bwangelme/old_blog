
简述了 Go 中的 goroutine，channel 和 WaitGroup，并通过例子来展示了这些功能的用法
<!--more-->

## Goroutine 简述

Go 对于异步编程提供了语言级别的支持，我们可以使用它的 goroutine 很方便地写出异步的代码。首先我们先通过一个简单的例子来认识 Go 的 goroutine。

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func main() {
	// 这里设置同时执行程序的最大CPU数为逻辑CPU的数量
	runtime.GOMAXPROCS(runtime.NumCPU())
	number := 10

	for i := 0; i < number; i++ {
		go Count(i)
	}

	time.Sleep(10 * time.Second)
}

func Count(index int) {
	var sum int64
	for i := 0; i < 1000000000; i++ {
		sum += int64(i)
	}

	fmt.Println(index, sum)
}

// 程序的输出结果
>>> go run goroutine.go                                                                            20:32:31 (09-19)
4 499999999500000000
2 499999999500000000
3 499999999500000000
5 499999999500000000
1 499999999500000000
0 499999999500000000
7 499999999500000000
8 499999999500000000
9 499999999500000000
6 499999999500000000
go run goroutine.go  7.40s user 0.09s system 73% cpu 10.239 total
```

在上面的代码中，我们启动了10个 goroutine 计算了10次{ 1 - 1000000000 }的和，主程序睡眠了10秒钟等待10个 goroutine 的结束。

goroutine 类似于 Python 中的协程。Go 语言自己实现了一个调度程序，负责调度 goroutine 的执行，每当 goroutine 程序遇到阻塞操作的时候，就把程序的控制权主动交还给调度程序，并保存自己的堆栈信息。Go 语言的调度程序拥有控制权后再来启动其他的 goroutine，其他的 goroutine 继续执行，当遇到阻塞操作后再把控制权交还给调度程序，以此往复，直到程序结束。

## main 程序等待 goroutine 结束

在上面的代码中，我们的主程序是通过`time.Sleep`来等待其他 goroutine 的结束，但是这样的方法很笨。我们需要在所有的 goroutine 运行完成之后，通知主程序退出，而不是让主程序傻傻地等一个固定时间。要实现这样的功能，我们可以使用`channel`或者`sync`包的`WaitGroup`类型。

### Channel

channel 是 Go 中的数据数据类型，可以被用来接收和发送数据，它具有一下特点:

+ channel 必须要通过`make`函数创建
+ channel 是带有是类型的，`ch := make(chan int)`表示声明一个 channel，其接收和发送的数据只能为`int`类型。
+ 管道可以有缓存，`ch := make(chan int, 20)`表示管道的缓存大小为20个int类型的数据。
  + 管道的缓存满了的时候，发送操作会阻塞
  + 管道的缓存空的时候，接收操作会阻塞
  + 如果整个程序所有的 goroutine 都是阻塞的，那么程序就会抛出异常，这样做是为了预防死锁

我们可以通过 channel 来改造我们上面的代码，创建一个 channel 在主程序和 goroutine 之间通信，当所有的 goroutine 都完成之后，再来通知主程序退出。改进后的程序代码如下:

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	// 这里设置同时执行程序的最大CPU数为逻辑CPU的数量
	runtime.GOMAXPROCS(runtime.NumCPU())
	number := 10

	// 在这里创建的一个 channel，channel 的缓存大小为我们需要运行的 goroutine 的数量
	// 这样当多个 goroutine 同时向 channel 中写入数据的时候也不会阻塞
	c := make(chan bool, number)

	for i := 0; i < number; i++ {
		go Count(i, c)
	}
	for i := 0; i < number; i++ {
		// 主程序在这里会从 channel 中读取 number 个值，所有的值都被读取成功之后，主程序才会结束
		<-c
	}

}

func Count(index int, c chan bool) {
	// 这里需要注意，尽管我们没有显示地声明，但是 channel 传递给函数的时候，是通过引用的方式传递的，
	// 因为如果是通过值传递的话， goroutine 中对 channel 写入的数据就无法通知到主程序了。
	var sum int64
	for i := 0; i < 1000000000; i++ {
		sum += int64(i)
	}

	fmt.Println(index, sum)
	// goroutine 在这里向 channel 中写入数据
	c <- true
}

// 程序的输出结果
>>> go run channel.go                                               22:54:39 (09-19)
5 499999999500000000
2 499999999500000000
9 499999999500000000
1 499999999500000000
3 499999999500000000
8 499999999500000000
7 499999999500000000
0 499999999500000000
4 499999999500000000
6 499999999500000000
go run channel.go  7.44s user 0.14s system 299% cpu 2.534 total
```

从上述程序的输出结果中我们可以看到，程序的运行时间明显减短了，我们也不用担心某些没有运行完的 goroutine 因为主程序的退出而被强制结束。

### WaitGroup

完成主程序和协程的同步工作，除了使用 channel 之外，我们还可以使用 Go 的`sync.WaitGroup`类型，它可以让主程序阻塞地等待一组 goroutine 的结束，它的具体用法如下所示:

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
)

func main() {
	// 这里设置同时执行程序的最大CPU数为逻辑CPU的数量
	runtime.GOMAXPROCS(runtime.NumCPU())
	number := 10

	// 这里使用了一个WaitGroup来演示程序的并发效果
	// wg.Add(number) 表示一共有 number 个 goroutine 需要等待完成
	// wg.Done() 表示一个 goroutine 完成了
	// wg.Wait() 表示阻塞地等待 number 个 wg.Done() 的通知

	// 需要注意的是wg传递给函数的时候，需要传递指针类型
	wg := sync.WaitGroup{}
	wg.Add(number)

	for i := 0; i < number; i++ {
		go Count(i, &wg)
	}

	wg.Wait()
}

func Count(index int, wg *sync.WaitGroup) {
	var sum int64
	for i := 0; i < 1000000000; i++ {
		sum += int64(i)
	}

	fmt.Println(index, sum)
	wg.Done()
}

// 程序的输出结果
>>> go run wait_group.go                                            23:19:19 (09-19)
2 499999999500000000
9 499999999500000000
5 499999999500000000
7 499999999500000000
0 499999999500000000
8 499999999500000000
3 499999999500000000
6 499999999500000000
1 499999999500000000
4 499999999500000000
go run wait_group.go  7.38s user 0.13s system 302% cpu 2.485 total
```

## 使用 select 等待多个 channel

上面的代码中，我们演示的都是一个 goroutine 中操作一个 channel，当我们需要在 goroutine 中同时操作多个 channel 时该怎么办呢？这就需要用到我们的`select`语句，`select`语句和`switch`语句非常相似，只不过不同的是，`select`判断的是一个 channel 是否是可读写的，而不是表达式的值。我们可以通过下面的代码来查看`select`语句的用法:

```go
package main

import (
	"fmt"
)

// 一下的程序演示了通过select语句动态地检查channel

func main() {
	// 这里创建了两个 channel c1和c2
	c1, c2 := make(chan int), make(chan string)
	// 这里创建了一个判断结束的 channel o
	o := make(chan bool)

	go func() {
		// c1Close 和 c2Close 是两个标记，用来标记 goroutine 中 channel 是否已经关闭
		c1Close, c2Close := false, false
		for {
			select {
			case v, ok := <-c1:
				// c1 关闭以后 ok 会为False
				if !ok {
					if !c1Close {
						// 第一次读取到 c1 的关闭信息时执行 if 语句块内的内容，以后再次读取到的时候则忽略
						o <- true
						c1Close = true
					}
				} else {
					fmt.Println("c1:", v)
				}
			case v, ok := <-c2:
				if !ok {
					if !c2Close {
						o <- true
						c2Close = true
					}
				} else {
					fmt.Println("c2:", v)
				}
			}
			// 只有当两个channel 都关闭的时候，goroutine 才会退出
			if c1Close && c2Close {
				fmt.Println("c1:", c1Close, "c2:", c2Close)
				break
			}
		}
	}()

	// 主程序向两个 channel 中写入值
	c1 <- 1
	c2 <- "hi"
	c1 <- 3
	c2 <- "hello"

	// 关闭两个 channel
	close(c1)
	close(c2)

	// 等待 goroutine 的退出
	fmt.Println("Close")
	for i := 0; i < 2; i++ {
		v := <-o
		fmt.Println(i, v)
	}
}

// 程序的输出
>>> go run select.go                                                23:25:11 (09-19)
c1: 1
c2: hi
c1: 3
c2: hello
Close
0 true
1 true
```

上述代码简单地展示了如何利用`select`语句来处理多个 channel，需要注意的是，`case v, ok := <-c1`这条判断`c1`是否已经关闭的语句可能会执行多遍，也就是说如果`c1`关闭了，`case v, ok := <-c1`还是永远可以读取出值来，且读取出来的`ok`始终为`false`。

如果我们不搞一个`c1Close`来进行判断的话，那么`o`中写入的两个值都可能是在判断`c1`关闭的时候写入的。

## ping-pong 示例代码

OK，看了上面那么多描述之后，我们可以看一个简单的例子，这个例子来自演讲[ Advanced Go Concurrency Patterns ](https://www.youtube.com/watch?v=QDDwwePbDtw)

```go
package main

import (
	"fmt"
	"time"
)

// 下面的代码演示了一个乒乓球程序，只有一个球在table上，然后两个player来获取这个球，互相获取了一段时间之后被主程序取走

type ball struct {
	hits int
}

func main() {
	table := make(chan *ball)
	go player("ping", table)
	go player("pong", table)

	table <- new(ball)
	time.Sleep(2 * time.Second)
	ball := <-table
	fmt.Println("hits:", ball.hits)

	close(table)
}

func player(name string, table chan *ball) {
	// 注意这里数据写到管道里以后，
	for {
		ball, ok := <-table
		if !ok {
			break
		}
		ball.hits++
		fmt.Println(name, "total hits:", ball.hits)
		time.Sleep(100 * time.Millisecond)
		// 由于创建的chan缓存大小为0，这里的写操作会阻塞，直到有另一个goroutine来读
		table <- ball
	}
}
```

上述的代码也并不复杂，但是我觉得很有趣，就贴上来了。channel 可以认为是一个乒乓球桌，channel 中的数据就可以认为是一个乒乓球，每个 goroutine 接收到乒乓球以后，将球的击打次数加1，然后就将乒乓球扔回到乒乓球桌上，等待另一个 goroutine 来接收，如此往复。只有当主程序从桌子上拿走了乒乓球以后（主程序接收到了 channel 中的数据），两个协程才退出。


## 参考链接

1. [Advanced Go Concurrency Patterns](https://talks.golang.org/2013/advconc.slide#1)
2. [Go 编程基础 -- 无闻](http://www.ucai.cn/index.php?app=fullstack&mod=Train&act=show&cid=69&sid=3259&chid=4708)
3. [goroutine 背后的系统知识](http://www.sizeofvoid.net/goroutine-under-the-hood/)
