---
title: "Go 并发模式之发布订阅模型"
date: 2019-05-30T07:29:04+08:00
lastmod: 2019-05-30T07:29:04+08:00
draft: false
tags: [Go, PubSub, 并发编程]
author: "bwangel"
comment: true

---

> 发布订阅模型的一个简易单机实现

<!--more-->
---

## 前言

这是我在阅读《Go 高级编程》中看到的一个实现发布订阅的简单例子，并不是真正的发布订阅服务器，仅供参考。

## Pub/Sub 说明

发布订阅并发模型通常由两部分组成，`Publisher`和`Subcriber`，`Subscriber`可以通过`Topic`仅订阅自己关心的消息。

在本文的示例中，我们将`chan interface{}`定义为`Subscriber`，将一个过滤函数定义成`Topic`。
`Subscriber`和它的`Topic`一起注册到`Publisher`中。

`Publisher`写消息的时候，会将数据发给它所有注册的订阅者，订阅者通过`Topic`过滤掉自己不感兴趣的消息，将感兴趣的消息写入到 channel 中。

## 程序代码

+ pubsub.go

```go
package pubsub

import (
	"sync"
	"time"
)

type (
	Subscriber chan interface{}
	TopicFunc  func(v interface{}) bool
)

type Publisher struct {
	// subscribers 是程序的核心，订阅者都会注册在这里，publisher发布消息的时候也会从这里开始
	subscribers map[Subscriber]TopicFunc
	buffer      int           // 订阅者的缓冲区长度
	timeout     time.Duration // publisher 发送消息的超时时间
	// m 用来保护 subscribers
	// 当修改 subscribers 的时候(即新加订阅者或删除订阅者)使用写锁
	// 当向某个订阅者发送消息的时候(即向某个 Subscriber channel 中写入数据)，使用读锁
	m sync.RWMutex
}

func NewPublisher(publishTimeout time.Duration, buffer int) *Publisher {
	return &Publisher{
		buffer:      buffer,
		timeout:     publishTimeout,
		subscribers: make(map[Subscriber]TopicFunc),
	}
}

func (p *Publisher) Subscribe() Subscriber {
	return p.SubscribeTopic(nil)
}

func (p *Publisher) SubscribeTopic(topic TopicFunc) Subscriber {
	ch := make(Subscriber, p.buffer)
	p.m.Lock()
	p.subscribers[ch] = topic
	p.m.Unlock()

	return ch
}

//Evict 删除掉某个订阅者
func (p *Publisher) Evict(sub Subscriber) {
	p.m.Lock()
	defer p.m.Unlock()

	delete(p.subscribers, sub)
	close(sub)
}

func (p *Publisher) Publish(v interface{}) {
	p.m.RLock()
	defer p.m.RUnlock()

	var wg sync.WaitGroup
	// 同时向所有订阅者写消息，订阅者利用 topic 过滤消息
	for sub, topic := range p.subscribers {
		wg.Add(1)
		go p.sendTopic(sub, topic, v, &wg)
	}

	wg.Wait()
}

//Close 关闭 Publisher，删除所有订阅者
func (p *Publisher) Close() {
	p.m.Lock()
	defer p.m.Unlock()

	for sub := range p.subscribers {
		delete(p.subscribers, sub)
		close(sub)
	}
}

func (p *Publisher) sendTopic(sub Subscriber, topic TopicFunc, v interface{}, wg *sync.WaitGroup) {
	defer wg.Done()

	if topic != nil && !topic(v) {
		return
	}

	select {
	case sub <- v:
	case <-time.After(p.timeout):
	}
}
```

## 相关测试代码

+ pubsub_test.go

```go
package pubsub

import (
	"fmt"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestPubSub(t *testing.T) {
	p := NewPublisher(100*time.Millisecond, 10)
	defer p.Close()

	// all 订阅者订阅所有消息
	all := p.Subscribe()
	// golang 订阅者仅订阅包含 golang 的消息
	golang := p.SubscribeTopic(func(v interface{}) bool {
		if s, ok := v.(string); ok {
			return strings.Contains(s, "golang")
		}
		return false
	})

	p.Publish("hello, world!")
	p.Publish("hello, golang!")

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		for msg := range all {
			_, ok := msg.(string)
			assert.True(t, ok)
		}
		wg.Done()
	}()

	go func() {
		for msg := range golang {
			v, ok := msg.(string)
			assert.True(t, ok)
			assert.True(t, strings.Contains(v, "golang"))
		}
		wg.Done()
	}()

	p.Close()
	wg.Wait()
}
```

## 参考链接

1. [《Go 语言高级编程》-- 常见的并发模式](https://chai2010.cn/advanced-go-programming-book/ch1-basic/ch1-06-goroutine.html)
