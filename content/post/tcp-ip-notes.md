---
title: "TCP/IP 读书笔记"
date: 2017-08-28T23:50:38+08:00
draft: false
tags: ["Network", "Notes"]
---

本文是本人在阅读《TCP/IP 详解：卷一》时所做的一些笔记，记录一些我认为比较重要的知识点或者句子，较为凌乱，仅为本人参考使用，并非是分享知识的博客文章。

<!--more-->

## 第19章 TCP 的交互数据流

### 经受时延

+ 通常 TCP 在收到数据后并不立即进行确认，而是推迟发送 ACK 确认，以便与同一方向上的数据一起发送。有时也称这种现象为数据捎带 ACK。
+ 绝大多数实现采用的时延为200ms，即操作系统每200毫秒滴答一次，在滴答的时候 TCP 检测是否有 ACK 需要发送，如果有则发送。
+ 当一个数据包到达并被处理后，系统产生经受时延标记，ACK 暂不发送。当经受时延计时器超时后，ACK 被发送，并且系统的经受时延标记被清除。

### Nagle 算法

+ 在一个 TCP 连接上只能有一个未被确认的未完成的小分组，在该分组的确认到达之前不能发送任何小分组。
+ TCP 连接将会收集这些小分组，在确认到达时以一个分组发送出去。
+ TCP 接口可以通过`TCP_NODELAY`选项关闭 Nagle 算法。

### 其他

* 每当 TCP 接收到一个超出期望序号的失序数据时，它总是发送一个确认序号为其期望序号的确认。
* TCP 可以在应用读取并处理所有数据前，发送所接收数据的确认。


## 第20章 TCP的成块数据流

### 滑动窗口

1. 发送方滑动窗口的大小随着接收方接收缓冲区的大小变化而变化。
2. FIN 的 ACK 可以携带数据，FIN 也可以携带数据。
3. 不确定数据，仅更新窗口右边缘的 ACK 称为窗口更新。

### 窗口大小

+ PUSH 标记
  + 发送方通知接收方的 TCP 立即将接收到的数据发送给应用程序，这些数据包括 PSH 标记携带的数据和所有 TCP 为这个应用程序接收的数据。
+ 许多 TCP 实现在窗口大小增加了两个最大报文段长度，或者窗口大小增加到最大可能窗口的50%后，会向对端发送窗口更新报文。

### 慢启动

发送方设置一个拥塞窗口(Congestion Window)cwnd。

1. 连接建立后 cwnd = 1， 表明可以传发送方网络链路一个 MSS 大小的数据。
2. 每收到一个 ACK，cwnd++
3. 每经过一个 RTT，cwnd = cwnd * 2
4. 当`cwnd >= ssthresh(slow start threshold)`时，就会进入拥塞避免算法

Linux 3.0以后根据 Google 一篇论文[《An Argument for Increasing TCP’s Initial CongestionWindow》](http://static.googleusercontent.com/media/research.google.com/zh-CN//pubs/archive/36640.pdf)的建议，将 cwnd 初始化为10个 MSS。在 Linux 3.0之前，比如2.6，Linux 则采用了 [RFC3390](http://www.rfc-editor.org/rfc/rfc3390.txt)，cwnd 是根据 MSS 的值变化的，变化方式如下所示：

```
if MSS < 1095 {
  cwnd = 4
} else if MSS > 2190 {
  cwnd = 2
} else {
  cwnd = 3
}
```

## 参考文章

1. [TCP 的那些事（下）](https://coolshell.cn/articles/11609.html)
