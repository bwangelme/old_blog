---
title: "Golang 中的 ServeMux 路由简介"
date: 2019-11-30T18:35:05+08:00
lastmod: 2019-11-30T18:35:05+08:00
draft: false
tags: [Golang, HTTP]
author: "bwangel"
comment: true
toc: true

---

>  简单介绍了一下 Golang 中 ServeMux 的功能以及路由方式。

<!--more-->
---

## 功能简介

根据 [Golang 文档](https://golang.org/pkg/net/http/#ServeMux) 中的介绍，ServeMux 是一个 HTTP 请求多路复用器(`HTTP Request multiplexer`)。


具体来说，它主要有以下两个功能:

1. 路由功能，将请求的 URL 与一组已经注册的路由模式(`pattern`)进行匹配，并选择一个最接近模式，调用其处理函数。
2. 它会清理请求 URL 与 `Host` 请求头，清除端口号，并对包含 `..` 和重复`/`的URL进行处理。

## 注册名字固定的路径

ServeMux 注册路由模式的方式有两种，`注册名字固定的路径`与`注册根路径子树`。

`注册名字固定的路径`就是指定一个固定的 URL 和请求进行精确匹配。需要注意的是 `/` 路由模式会匹配所有未被其他路由模式匹配的请求。

例如下面的代码，请求`/a`会匹配`/a`路由模式，请求`/abc`会匹配`/`路由模式。

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/a", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "/a", request.URL.EscapedPath())
	})
	http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "default", request.URL.EscapedPath())
	})
	log.Fatalln(http.ListenAndServe(":8080", nil))
}
```

```sh
>>> curl 'localhost:8080/a'
/a /a

>>> curl 'localhost:8080/abc'
default /abc
```

## 注册根路径子树

`注册根路径子树`就是注册一个子路径，所有以这个子路径开头的请求都会转发到对应的 handler 中。注意子路径__必须__以 `/` 结尾。

例如下面的代码中，所有以 `/user/` 开头的请求，都会被匹配。

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/user/", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "user", request.URL.EscapedPath())
	})
	log.Fatalln(http.ListenAndServe(":8080", nil))
}
```

```sh
>>> curl '0.0.0.0:8080/user/1'
user /user/1
>>> curl '0.0.0.0:8080/user/2'
user /user/2
```

### 最长匹配

`注册根路径子树`是符合最长路径匹配的原则的，例如我们注册了两个子路径，`/image/gif/`和`/image/`，URL 为`/image/gif/`的请求会优先匹配第一个路由模式。

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// 注意我把 /image/ 写在了前面
	http.HandleFunc("/image/", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "image", request.URL.EscapedPath())
	})
	http.HandleFunc("/image/gif/", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "gif", request.URL.EscapedPath())
	})
	log.Fatalln(http.ListenAndServe(":8080", nil))
}
```

```sh
>>> curl '0.0.0.0:8080/image/gif/'
gif /image/gif/
```

### `APPEND_SLASH`

`APPEND_SLASH`是 Django 中的一个配置，是指如果我们注册了一个路由模式`/something/`，且`APPEND_SLASH=True`的话，那么 URL 为 `/something` 的请求会自动重定向为`/something/`。

`注册根路径子树`默认也是有这种功能的，请看下面的代码:

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/image/", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "image", request.URL.EscapedPath())
	})
	log.Fatalln(http.ListenAndServe(":8080", nil))
}
```

```sh
>>> curl -v '0.0.0.0:8080/image'
> GET /image HTTP/1.1
> Host: 0.0.0.0:8080
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 301 Moved Permanently
< Content-Type: text/html; charset=utf-8
< Location: /image/
< Date: Sat, 30 Nov 2019 11:30:14 GMT
< Content-Length: 42
<
<a href="/image/">Moved Permanently</a>.
```

我们注册了子路径`/image/`，服务器会自动将`/image`请求重定向为`/image/`。

如果我们不想让服务器自动重定向的话，只需要添加一个`/image`模式就好了。

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/image/", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "sub image", request.URL.EscapedPath())
	})
	http.HandleFunc("/image", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "image", request.URL.EscapedPath())
	})
	log.Fatalln(http.ListenAndServe(":8080", nil))
}
```

```sh
>>> curl '0.0.0.0:8080/image'
image /image
>>> curl '0.0.0.0:8080/image/'
sub image /image/
>>> curl '0.0.0.0:8080/image/gif'
sub image /image/gif
```

## 使用域名匹配

ServeMux 还支持根据主机名精确匹配，没有指定主机名的路径`/`路由模式将会是所有未匹配请求的缺省值。

下面的代码中，主机名为 `localhost` 请求将会默认匹配`localhost/`路由模式，其他主机名的请求会匹配`/`路由模式。

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("localhost/", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "localhost", request.URL.EscapedPath())
	})
	http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "default", request.URL.EscapedPath())
	})
	log.Fatalln(http.ListenAndServe(":8080", nil))
}
```

```sh
>>> curl -v '127.0.0.1:8080/'
> GET / HTTP/1.1
> Host: 127.0.0.1:8080
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Sat, 30 Nov 2019 11:39:04 GMT
< Content-Length: 10
< Content-Type: text/plain; charset=utf-8
<
default /

>>> curl -v '0.0.0.0:8080/'
> GET / HTTP/1.1
> Host: 0.0.0.0:8080
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Sat, 30 Nov 2019 11:39:14 GMT
< Content-Length: 10
< Content-Type: text/plain; charset=utf-8
<
default /

>>> curl -v 'localhost:8080/'
> GET / HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Sat, 30 Nov 2019 11:39:19 GMT
< Content-Length: 12
< Content-Type: text/plain; charset=utf-8
<
localhost /

>>> curl -v 'localhost:8080/abc'
> GET /abc HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Sat, 30 Nov 2019 12:01:47 GMT
< Content-Length: 15
< Content-Type: text/plain; charset=utf-8
<
localhost /abc

```

## 处理冗余的 URL

+ 针对 URL 中包含`..`的请求，ServeMux 会对其 Path 进行整理，并匹配到合适的路由模式上。
+ 针对 URL 中包含重复`/`的请求，ServeMux 会对其进行重定向。

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/image/png/1", func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprintln(writer, "default", request.URL.EscapedPath())
	})
	log.Fatalln(http.ListenAndServe(":8080", nil))
}
```

```sh
>>> curl -v 'localhost:8080/image/gif/../png/1'
> GET /image/png/1 HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Sat, 30 Nov 2019 11:42:00 GMT
< Content-Length: 23
< Content-Type: text/plain; charset=utf-8
<
localhost /image/png/1

>>> curl -v 'localhost:8080/image/gif/../png//1'
> GET /image/png//1 HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 301 Moved Permanently
< Content-Type: text/html; charset=utf-8
< Location: /image/png/1
< Date: Sat, 30 Nov 2019 11:42:14 GMT
< Content-Length: 47
<
<a href="/image/png/1">Moved Permanently</a>.

>>> curl -v 'localhost:8080/image/png//1'
> GET /image/png//1 HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/7.64.1
> Accept: */*
>
< HTTP/1.1 301 Moved Permanently
< Content-Type: text/html; charset=utf-8
< Location: /image/png/1
< Date: Sat, 30 Nov 2019 11:45:18 GMT
< Content-Length: 47
<
<a href="/image/png/1">Moved Permanently</a>.
```
