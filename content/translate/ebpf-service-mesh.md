---
title: "Review 《How eBPF will solve Service Mesh - Goodbye Sidecars》"
date: 2021-12-20T19:41:20+08:00
lastmod: 2021-12-20T19:41:20+08:00
draft: false
tags: [翻译, Go]
author: "bwangel"
comment: true

---

> + 原文地址: https://isovalent.com/blog/post/2021-12-08-ebpf-servicemesh

<!--more-->
---

Service Mesh 是一个概念，描述了现代云原生应用在通信、可见性和安全性方面的要求。目前这个概念的实现涉及到在每个workload 或 pod 中运行 sidecar 代理。这是一种相当低效的方式。在这篇文章中，我们将探讨一个替代 sidecar 模型的方法，在eBPF的帮助下，提供一个透明的 Service Mesh，在低复杂度下具有很高的效率。

## What is Service Mesh?

随着分布式应用的引入，额外的可见性、连接性和安全性要求也浮现出来(have surfaced)。应用程序组件在跨越云和城市边界的不受信任的网络中通信，负载均衡需要理解应用协议，弹性(resiliency)变得至关重要(crucial)，安全性必须发展(evolve)到发送者和接收者可以验证彼此身份的模式。在分布式应用的早期，这些要求是通过直接将所需的逻辑嵌入到应用中来解决的。Service Mesh 将这些功能从应用程序中提取出来，作为基础设施的一部分提供给所有应用程序使用，因此不再需要修改每个应用程序。

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-12-20-200012.png)

纵观 Service Mesh 今天的特点，可以总结为以下几点:

+ 弹性链接: 服务与服务之间的通信必须能够跨越边界，例如云服务，集群和城市。通信必须是弹性且可容错的。
+ L7 流量管理: 负载均衡，频率限制器，弹性都必须在 L7 层(能够理解 HTTP, REST, gRPC, WebSocket 等协议)
+ 基于身份的安全: 基于网络标识符来实现安全已经不够了，发送和接收服务必须能够基于身份标识认证对方，而不是通过网络标识认证。
+ 可观察性和可追踪性: 追踪和指标形式的观察，对于理解，监控，调试应用程序的稳定性，性能和可用性至关重要。
+ 透明性：该功能必须以透明的形式提供给应用程序，即不需要改变应用程序的代码。

在早期，Service Mesh 功能通常以库的形式实现，需要网格中的每个应用程序链接到以对应语言编写的库中。同样的事情也在互联网早期发生过，在那些日子里，应用程序需要维护自己的 TCP/IP 栈。就像我们在这篇文章里讨论的一样，Service Mesh 正在发展成为一种内核职责，就像 TCP/IP 网络栈一样。

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-12-20-201812.png)

在今天，Service Mesh 通常是用一种称为 sidecar 模型的架构实现的。这种架构将实现了上述功能的代码封装到4层代理中，然后将应用接收和发送的流量重定向到被称为 sidecar 的代理中。它之所以被成为 Sidecar，是因为每个应用程序都有一个代理，就像摩托车上的挎斗一样。

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-12-20-202330.png)

这种架构的优点是应用服务自身不再需要实现 Service Mesh 中的功能。如果许多应用服务使用不同语言编写，或者你运行的服务是一个不可变的第三方应用程序，这种架构就很方便。

这种模型的缺点是有大量的代理，许多额外的网络连接和复杂的重定向逻辑将应用的网络流量送入到代理中。除此之外，四层代理能够传输的网络流量的类型也有限制(四层代理无法理解 HTTP/Thrift 等七层协议)。代理在其能够支持的网络协议上是被限制的。

# A history of connectivity moving into the Kernel

