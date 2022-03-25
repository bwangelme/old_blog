---
title: "Kakfa 消费者提交 offset 的设置"
date: 2022-03-25T17:18:02+08:00
lastmod: 2022-03-25T17:18:02+08:00
draft: false
tags: [tips, kakfa]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

当 Consumer 将 `enable.auto.commit` 设置为 true 的时候，kafka consumer 会自动提交 offset。
它在 `auto.commit.interval.ms` 选项的控制下，间隔N秒后，自动将当前 consumer 拉取到的消息 offset 提交到 kafka 中。

当 `enable.auto.commit=false` 时，kafka 客户端不会自动提交 offset，需要开发者通过 `consumer.commitSync` 或 `consumer.commitAsync` 提交 offset。

不建议每收到一条消息就提交一次 offset，`consumer.commitSync` 是有性能损耗的，如果 `consumer.commitSync` 调用的频率非常高，consumer 消费消息的速度将会变得很慢。

`consumer.commitAsync` 是异步提交的，它相对 `consumer.commitSync` 会有一定的性能提升。`consumer.commitAsync` 还有一个回调函数参数，让开发者设定在提交失败时做什么。

一般在 broker 正常时，提交失败的情况很少发生。开发者不需要做提交失败后重试的逻辑。

## 参考链接

- https://github.com/edenhill/librdkafka/blob/4992b3db321befa04ece3027f3c79f3557684db9/CONFIGURATION.md
- https://docs.confluent.io/platform/current/clients/consumer.html#id1
