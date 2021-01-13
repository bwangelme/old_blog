---
title: "《Go 语言实践 concurrency》学习笔记"
date: 2021-01-10T22:40:27+08:00
lastmod: 2021-01-10T22:40:27+08:00
draft: false
tags: [笔记, Go]
author: "bwangel"
comment: true
---

> Go 语言并发编程的学习笔记

<!--more-->
---

## Goroutine

`os.Exit` (`log.Fatal` 会调用这个) 的进行退出时，注册的 `defer` 函数不会执行

启动 Goroutine 的时候要问两个问题:

1. 它什么时候结束
2. 如何让它结束
3. 一定要做超时控制

启动 Goroutine 的时候要尽量交给调用者执行

+ 将并发逻辑交给调用者

```sh
# ListDirectory 如果要启动 Goroutine，那么也应该给调用者提供停止该 Goroutine 的方法，这里提供了一个回调函数参数，让调用者能够停止该 Goroutine
func ListDirectory(dir string, fn func(string))
```

+ 使用 Goroutine 的例子

```go
type Tracker struct {
	ch   chan string
	stop chan struct{}
}

func NewTracker() *Tracker {
	return &Tracker{
		ch: make(chan string, 10),
	}
}

func (t *Tracker) Event(ctx context.Context, data string) error {
	select {
	case t.ch <- data:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (t *Tracker) Run() {
	for data := range t.ch {
		time.Sleep(1 * time.Second)
		fmt.Println(data)
	}
	close(t.stop)
}

// Shutdown 函数用来关闭运行着的 Goroutine，并且还可以设置关闭的超时时间
func (t *Tracker) Shutdown(ctx context.Context) {
	close(t.ch)
	select {
	case <-t.stop:
		// 关闭 Goroutine 成功
	case <-ctx.Done():
		// 关闭 Goroutine 超时
	}
}

// 这个例子就体现了使用 Goroutine 的原则:
// 1. 调用者在创建了 Goroutine 后，一定能够控制它什么时候退出
// 2. 知道 Goroutine 什么时候退出
// 3. 一定要处理 Goroutine 的超时错误
// 4. 将并发逻辑交给调用者，即让调用者来创建 Goroutine
func main() {
	tr := NewTracker()
	go tr.Run()
	_ = tr.Event(context.Background(), "test")
	_ = tr.Event(context.Background(), "foo")
	_ = tr.Event(context.Background(), "bar")
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()
	tr.Shutdown(ctx)
}
```

## To Learn

+ cache line
+ single machine word
