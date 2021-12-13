---
title: "GO proxy 的说明"
date: 2021-12-11T21:42:46+08:00
lastmod: 2021-12-11T21:42:46+08:00
draft: false
tags: [tips, go, gomod]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

查看 GO Proxy 中包的信息:

+ 查看包的版本信息:

```
curl https://proxy.golang.org/go.etcd.io/etcd/client/v3/@v/v3.0.0-20201116001935-06e48f04865f.info
```

+ 查看包的依赖 (即获取 go.mod 文件)

```
curl https://proxy.golang.org/go.etcd.io/etcd/client/v3/@v/v3.0.0-20201116001935-06e48f04865f.mod
```

```
module go.etcd.io/etcd/client/v3

go 1.15

require (
        github.com/dustin/go-humanize v1.0.0
        github.com/google/uuid v1.1.2
        github.com/grpc-ecosystem/go-grpc-prometheus v1.2.0
        github.com/prometheus/client_golang v1.5.1
        go.etcd.io/etcd/api/v3 v3.5.0-pre
        go.etcd.io/etcd/pkg/v3 v3.5.0-pre
        go.uber.org/zap v1.16.0
        google.golang.org/grpc v1.29.1
        sigs.k8s.io/yaml v1.2.0
)

replace (
        go.etcd.io/etcd/api/v3 => ../../api
        go.etcd.io/etcd/pkg/v3 => ../../pkg
)

// Bad imports are sometimes causing attempts to pull that code.
// This makes the error more explicit.
replace (
        go.etcd.io/etcd => ./FORBIDDEN_DEPENDENCY
        go.etcd.io/etcd/v3 => ./FORBIDDEN_DEPENDENCY
        go.etcd.io/tests/v3 => ./FORBIDDEN_DEPENDENCY
)
```

+ 下载包

```
curl https://proxy.golang.org/go.etcd.io/etcd/client/v3/@v/v3.0.0-20201116001935-06e48f04865f.zip
```

## Proxy 测速

2021-12-13 日晚安装包 `go-git/go-git-fixtures` 的时候卡着不动，测了一下两个 proxy 的速度

```sh
ø> curl https://goproxy.io/github.com/go-git/go-git-fixtures/v4/@v/v4.2.1.zip -o /tmp/pkg.zip
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  2 93.4M    2 2623k    0     0   181k      0  0:08:48  0:00:14  0:08:34  147k
ø> curl https://goproxy.cn/github.com/go-git/go-git-fixtures/v4/@v/v4.2.1.zip -o /tmp/pkg.zip
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
 10 93.4M   10  9.7M    0     0  3712k      0  0:00:25  0:00:02  0:00:23 3711k
 21 93.4M   21 20.2M    0     0  5605k      0  0:00:17  0:00:03  0:00:14 5603k
```

goproxy.io 的下载速度竟然只有 147k，怪不得安装时会卡住

## 参考链接

+ https://go.dev/ref/mod
