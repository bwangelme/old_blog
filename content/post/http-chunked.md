---
title: "HTTP 协议中的分块传输编码"
author: "bwangel"
tags: ["HTTP"]
date: 2018-11-01T23:32:43+08:00
draft: false
---

说明了 HTTP 分块传输编码方式

<!--more-->

## HTTP的持久连接和短连接

### 基本概念

在聊 HTTP 协议的分块传输编码之前，我们先来聊一下HTTP的连接方式。

HTTP协议是应用层协议，它是建立在TCP协议之上的。TCP协议在传输数据之前，需要先通过三次握手建立连接，同时由于慢启动的特性，TCP协议的报文不会在一开始就满负荷传输。如果一个HTTP事务能够复用之前的TCP连接的话，将会节约很多的请求时间。

但是在最开始的`HTTP/1.0`中是不支持复用TCP连接的，即一个HTTP事务结束后，底层的TCP连接也立刻关闭掉，这就是短连接。在`HTTP1/1.1`中，新加了`Connection`请求头用来定义TCP连接的使用方式。`Connection`请求头的值有两种

+ `close`

表示服务端或服务器在HTTP事务结束后将会关闭相应的TCP连接，即使使用短连接的方式

+ 任何`,`分离的HTTP请求头列表(通常是`keep-alive`)

表示客户端在HTTP事务结束后将会继续保持这个TCP连接，即持久连接。在`HTTP/1.1`中，默认使用的就是这种持久连接的方式。`Connection`请求头的值可以是使用`,`分隔的请求头列表，这些请求头表示将会被第一个非传输性的代理或者缓存服务器给删除掉。这些请求头的定义应用在请求的发送方和第一个实体之间，而不会应用在请求发送方和目标服务器之间。

### 短连接例子

下面是使用短连接处理HTTP请求的例子，我们写完响应行后立刻将TCP连接关闭了，此时浏览器是能够正确处理这种请求的。

```go
func handleClosedHttpReq(conn net.Conn) {
    buffer := make([]byte, 1024)
    n, err := conn.Read(buffer)
    if err != nil {
        log.Fatalln(err)
    }
    fmt.Println(n, string(buffer))

    data := []byte("hello, world!")
    conn.Write([]byte("HTTP/1.1 200 OK\r\n"))
    conn.Write([]byte("\r\n"))
    conn.Write(data)
    conn.Close()
}


func main() {
    ln, err := net.Listen("tcp", ":8080")
    if err != nil {
        log.Fatalln(err)
    }

    for {
        conn, err := ln.Accept()
        if err != nil {
            log.Println(err)
            continue
        }
        go handleClosedHttpReq(conn)
    }
}
```

![HTTP短连接](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2018-11-01-233404.png)

### 持久连接例子

在持久连接模式中，由于服务器不会立刻关闭TCP连接，所以需要在响应中加上一个`Content-Length`的响应头来表示响应体的长度，让浏览器判断HTTP响应是否结束。如果没有这个响应头的话，浏览器会处于`pending`的状态。

```go
// 没有添加 Content-Length 的响应，浏览器会处于 pending 的状态
func handleKeepAliveHttpReq(conn net.Conn) {
    buffer := make([]byte, 1024)
    n, err := conn.Read(buffer)
    if err != nil {
        log.Fatalln(err)
    }
    fmt.Println(n, string(buffer))

    data := []byte("hello, keel-alive!")
    conn.Write([]byte("HTTP/1.1 200 OK\r\n"))
    conn.Write([]byte("\r\n"))
    conn.Write(data)
}
```

![持久连接浏览器pending](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2018-11-01-234251.png)

```go
// 添加了 Content-Length，浏览器就可以正常处理响应了
func handleKeepAliveHttpReq(conn net.Conn) {
    buffer := make([]byte, 1024)
    n, err := conn.Read(buffer)
    if err != nil {
        log.Fatalln(err)
    }
    fmt.Println(n, string(buffer))

    data := []byte("hello, keel-alive!")
    conn.Write([]byte("HTTP/1.1 200 OK\r\n"))
    conn.Write([]byte(fmt.Sprintf("Content-Length: %d\r\n", len(data))))
    conn.Write([]byte("\r\n"))
    conn.Write(data)
}
```

![持久连接](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2018-11-01-234547.png)

## 分块传输编码

### 相关概念

在长连接模式中，除了通过`Content-Length`指定响应体的长度外，还有另外一种传输方式。它就是本文的主角，分块传输编码。

> 分块传输编码（Chunked transfer encoding）是超文本传输协议（HTTP）中的一种数据传输机制，允许HTTP由网页服务器发送给客户端应用（ 通常是网页浏览器）的数据可以分成多个部分。分块传输编码只在HTTP协议1.1版本（HTTP/1.1）中提供。

如果需要使用分块传输编码的响应格式，我们需要在HTTP响应中设置响应头`Transfer-Encoding: chunked`。它的具体传输格式是这样的(注意HTTP响应中换行符是`\r\n`):

```
HTTP/1.1 200 OK\r\n
\r\n
Transfer-Encoding: chunked\r\n
...\r\n
\r\n
<chunked 1 length>\r\n
<chunked 1 content>\r\n
<chunked 2 length>\r\n
<chunked 2 content>\r\n
...\r\n
0\r\n
\r\n
\r\n
```

### 分块传输编码例子

```go
func handleChunkedHttpResp(conn net.Conn) {
    buffer := make([]byte, 1024)
    n, err := conn.Read(buffer)
    if err != nil {
        log.Fatalln(err)
    }
    fmt.Println(n, string(buffer))

    conn.Write([]byte("HTTP/1.1 200 OK\r\n"))
    conn.Write([]byte("Transfer-Encoding: chunked\r\n"))
    conn.Write([]byte("\r\n"))

    conn.Write([]byte("6\r\n"))
    conn.Write([]byte("hello,\r\n"))

    conn.Write([]byte("8\r\n"))
    conn.Write([]byte("chunked!\r\n"))

    conn.Write([]byte("0\r\n"))
    conn.Write([]byte("\r\n"))
}
```

![HTTP chunked传输](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2018-11-02-000422.png)

通过 WireShark 抓包我们可以更清晰地看到响应中有两个 chunked。但由于这两个chunked的内容很少，TCP传输的时候将它们合并了。

![HTTP chunked wireshark抓包](https://passage-1253400711.cos-website.ap-beijing.myqcloud.com/2018-11-02-001330.png)

## 参考链接

+ [https://imququ.com/post/transfer-encoding-header-in-http.html](HTTP 协议中的 Transfer-Encoding)
+ [MDN Connection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection)
+ [维基百科 - 分块传输编码](https://zh.wikipedia.org/wiki/%E5%88%86%E5%9D%97%E4%BC%A0%E8%BE%93%E7%BC%96%E7%A0%81)
