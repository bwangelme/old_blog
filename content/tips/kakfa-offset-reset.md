---
title: "Kakfa Consumer 的 auto.offset.reset 选项"
date: 2022-03-13T19:35:39+08:00
lastmod: 2022-03-13T19:35:39+08:00
draft: false
tags: [tips, kafka]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

kafka 的消息以组为单位给 Consumer 发送。Consumer Group 在 topic 中的 offset 存储在 broker 的 `__consumer_offsets` topic 中。

新加入的 consumer group 默认从最新位置读取 message。可以通过修改 Consumer 的`auto.offset.reset=smallest` 选项，让 consumer 从头开始读取 message.

当 broker 获取 consumer group 的 offset 出错时(offset 不存在或者 offset 超出已有的 message 的范围)，也会根据 `auto.offset.reset` 的配置来决定从什么位置开始读取 message。

- 'smallest','earliest' 自动将 offset 设置成最小的 offset
- 'largest','latest' 自动将 offset 设置成最大的 offset
- 'error' 抛出一个错误 (ERR__AUTO_OFFSET_RESET) consumer 可以通过 `message->err` 获取到该错误

## 参考链接

- https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md
