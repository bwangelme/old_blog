---
title: "Review 《Don’t use Go’s default HTTP client (in production)》"
date: 2021-12-31T11:01:25+08:00
lastmod: 2021-12-31T11:01:25+08:00
draft: false
tags: [翻译, Go, HTTP]
author: "bwangel"
comment: true

---

> + 原文地址: https://medium.com/@nate510/don-t-use-go-s-default-http-client-4804cb19f779

<!--more-->
---

编写通过 HTTP 与服务对话的 Go 程序很容易，也很有趣。
我已经写了无数的 API 客户端包，我发现这是一项令人愉快的任务。然而，我遇到了一个很容易落入的陷阱，它可以让你的程序很快崩溃：__默认的HTTP客户端__。

本文内容的一句话概括:

> Go 的 http 包默认没有指定请求超时，允许外部服务劫持你的 goroutine 。在连接外部服务时，一定要指定一个自定义的 http.Client 。

## 问题示例

假设你想通过漂亮的 JSON REST API与 `spacely-sprockets.com` 对话，并查看可用 `sprockets` 的列表。在 Go 语言中，你可以这样做:


```go
// 为了简洁省略了错误检查
var sprockets SprocketsResponse
response, _ := http.Get("spacely-sprockets.com/api/sprockets")
buf, _ := ioutil.ReadAll(response.Body)
json.Unmarshal(buf, &sprockets)
```


编写你的代码（请有适当的错误处理），编译，然后运行。
一切都很顺利。现在，你拿着你的API包，把它加入一个网络应用程序中。你的应用程序的一个页面通过调用 API 向用户显示 Spacely Sprockets 的库存列表。

一切都很顺利，直到有一天你的应用程序停止响应了。
你查看了日志，但没有任何迹象表明有问题。你检查了你的监控工具，但是 CPU、内存和 I/O 在故障发生前都看起来很正常。
你启动了一个沙盒，它似乎工作正常。怎么会这样呢？

沮丧之余，你查看了 Twitter，发现 Spacely Sprockets 开发团队发了一条推文，说他们经历了一次短暂的中断，但现在一切都恢复正常了。
你检查了他们的API状态页面，发现中断是在你之前几分钟开始的。
这似乎是一个不太可能的巧合，但你不能完全弄清楚这之间有什么关系，因为你的代码处理错误的方式很优雅。你仍然没有找到问题的答案。


## Go HTTP 包

客户端是并发安全的对象，包含配置、管理 TCP 状态、处理 cookies 等。
当你使用 `http.Get(url)` 时，你正在使用 `http.DefaultClient` ，这是一个定义了客户端默认配置的包变量。它的声明是:

```go
var DefaultClient = &Client{}
```

除此之外，`http.Client` 配置了一个超时时间用来熔断长期运行的连接。这个值的默认值是0，它被解释为 "没有超时"。
这对软件包来说可能是一个合理的默认值，但它是一个讨厌的陷阱，也是我们的应用程序在上述例子中停止响应的原因。
事实证明，Spacely Sprockets 的 API 中断导致 __连接尝试__ 阻塞住（这并不总是发生，但在我们的例子中确实如此）。只要故障的服务器不响应，它就会一直阻塞着。
因为正在进行 API 调用服务于用户请求，这导致服务于用户请求的 goroutines 也挂起。
一旦有足够多的用户点击此页面，应用程序就会停止响应，很可能是由于达到了资源限制。


这里有一个简单的代码演示了这个问题:

```go
package main
import (
  "fmt"
  "net/http"
  "net/http/httptest"
  "time"
)
func main() {
  svr := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    time.Sleep(time.Hour)
  }))
  defer svr.Close()
  fmt.Println("making request")
  http.Get(svr.URL)
  fmt.Println("finished request")
}
```

启动之后，这个程序会请求一个 sleep 1小时的接口。随后，这个程序也会阻塞一个小时，然后退出。

## 解决方案

解决这个问题的方法是你的场景中定义一个带有合理超时的 `http.Client` 。下面是一个例子。

```go
var netClient = &http.Client{
  Timeout: time.Second * 10,
}
response, _ := netClient.Get(url)
```

这为向 API 发出的请求设置了10秒的超时。如果服务器响应的时间超过了超时时间，Get()将返回错误。


```go
&httpError{
  err:     err.Error() + " (Client.Timeout exceeded while awaiting headers)",
  timeout: true,
}
```

如果你需要对请求生命周期进行更精细的控制，你可以另外指定一个自定义的 `net.Transport` 和 `net.Dialer`。
`Transport` 是一个客户端用来管理底层TCP连接的结构，它的 `Dialer` 是一个管理建立连接的结构。
Go 的 net 包也有一个默认的 Transport 和 Dialer 。下面是一个使用自定义结构的例子。

```go
var netTransport = &http.Transport{
  Dial: (&net.Dialer{
    Timeout: 5 * time.Second,
  }).Dial,
  TLSHandshakeTimeout: 5 * time.Second,
}
var netClient = &http.Client{
  Timeout: time.Second * 10,
  Transport: netTransport,
}
response, _ := netClient.Get(url)
```

这段代码将为 TCP 连接和 TLS 握手设置超时上限，还设置了一个端到端的请求超时。如果需要的话，你还可以使用其他配置选项，如 `keep-alive` 超时。

## 总结

Go 的 net 和 http 包是一个经过深思熟虑的、方便通过 HTTP(S) 进行通信的基础包。
然而，由于该包提供了 `http.Get(url)` 这样的方便方法，因此缺乏对请求的默认超时是一个容易陷入的陷阱。
有些语言（如Java）有同样的问题，其他语言（如Ruby有默认的60秒读取超时）则没有。
在联系远程服务时不设置请求超时，会使你的应用程序受到该服务的摆布。
一个故障的或恶意的服务可以永远阻塞你的连接，可能会使你的应用程序陷入内存不足的困境。
