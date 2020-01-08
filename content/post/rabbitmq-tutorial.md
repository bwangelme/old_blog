---
title: "Rabbitmq Tutorial 学习笔记"
date: 2019-12-21T21:49:45+08:00
lastmod: 2019-12-21T21:49:45+08:00
draft: false
tags: [Go, RabbitMQ, Tutorial]
author: "bwangel"
comment: true
toc: true

---

<!--more-->
---

## RabbitMQ 基本概念介绍

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2020-01-07-152647.jpg)

上图展示的 RabbitMQ 的一些基础概念和它们之间的关系。这里为了方便展示，只显示了一个生产者，且每个消费者只绑定了一个队列。

生产者(`Producer`)将消息发布(`Pubscribe`)到交换机(`Exchange`)上，交换机将消息转发给一个或多个（根据交换机的类型确定）队列(`Queue`)。队列中收到的消息将会发送给订阅(`Subscribe`)该队列的消费者(`Consumer`)。

## 消息的分发与确认

### 轮询分发

在 RabbitMQ 中，消息默认是通过`轮询分发`的方式进行发送的。具体来说，就是顺序地给绑定同一个队列的每个消费者发送消息，平均下来，每个消费者获得的消息数量是相同的。

可以参考下面这个例子:
![round-robin Example](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2020-01-08-144228.png)

__该示例的代码详见 [Github@41c82064](https://github.com/bwangelme/RabbitMQDemo/tree/41c82064edbde8c3bf74c1474420da821f7ac6dc) 。__

1号窗口是生产者，2，3，4，5号窗口都是消费者。

生产者一共发送了10条消息，他们被顺序地发送给四个消费者。


### 公平分发

轮询分发的策略有时候并不适合实际的业务，可能会导致某些消费者特别忙，但是另一些消费者很闲的情况。

如下图所示，1号生产者发送的奇数消息都很繁重，偶数消息都很轻松，导致2号消费者很忙，3号消费者很轻松。

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2020-01-08-145032.png)

__该示例的代码详见 [Github@14a0414](https://github.com/bwangelme/RabbitMQDemo/tree/14a0414)__

为了避免这种极端情况的发生，我们可以设置预取值(`prefetch count`)为1。这样的话，相当于告诉 RabbitMQ，在 Worker 消费完一个消息之前，不要再给他分发新的消息了，这样的话随后的消息就会被分发给其他的空闲的 Worker 了。

在具体代码如下:

```go
// 在 Worker 的代码中设置
err = ch.Qos(
    1,     // prefetch count
    0,     // prefetch size
    false, // global
)
```

运行效果如下:

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2020-01-08-150016.png)

__该示例的代码详见[Github@ad5507e](https://github.com/bwangelme/RabbitMQDemo/tree/ad5507e)__

可以看到2号窗口和3号窗口中的消费者都分配到了耗时较长的任务。

__注意:__ 这样操作容易让 RabbitMQ 的队列被塞满，需要有合适的监控机制来监控消息的数量。

### 消息确认

当消费者收到消息后，可能会遇到某种异常崩溃了，此时这条消息就会丢失了。

为了避免这种情况，我们可以使用 RabbitMQ 提供的消息确认机制。

消费者在消费完消息后，再向 RabbitMQ 发送 ack。收到 ack 之后，RabbitMQ 才会把这条消息标记为可删除的，并择机删除。
如果 RabbitMQ 没有收到 ack，消费者就死掉了（channel 关闭，连接关闭，或者 TCP 连接关闭）。
那么 RabbitMQ 就会认为这条消息没有被消费完，它就会重新入队，然后被快速发送给其他消费者。

使用了消息确认机制后，我们就可以确保即使存在消费者偶尔崩溃的情况，我们的消息也不会丢失。

在消息确认机制中，没有任何的超时限制，所以即使客户端花费很长的时间去处理消息，也不用担心消息会被误重发。

代码如下，我们在消费者订阅的时候将`auto_ack`选项关掉，然后再在消费完消息后手动发送 Ack

```go
    // 消费者从队列订阅消息
    msgs, err := ch.Consume(
        q.Name, // name
        "",     // consumer
        false,   // 关闭掉 autoack
        false,  // exclusive
        false,  // no-local
        false,  // no-wait
        nil,    // args
    )
    go func() {
        for d := range msgs {
            log.Printf("Received a message: %s", d.Body)
            dot_count := bytes.Count(d.Body, []byte("."))
            t := time.Duration(dot_count)
            time.Sleep(t * time.Second)
            log.Printf("Done")
            d.Ack(false) // 手动发送 ack
        }
    }()
```

示例如下，3号消费者在 `23:08:54` 收到消息后，还没有确认(确认后会打印 Done )，就被我们 kill 掉了。2号消费者在`23:08:55`重新收到了这条消息。

![](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2020-01-08-151127.png)

__该示例代码详见[Github@9cd87dd](https://github.com/bwangelme/RabbitMQDemo/tree/9cd87dd)__

## 持久化

## Exchange 的类型与特性

### Direct

### Fanout

### Topic

## Message 的属性介绍
