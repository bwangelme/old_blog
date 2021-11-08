---
title: "使用 Buildkit 和 Containerd 构建运行容器"
date: 2021-11-08T12:43:04+08:00
lastmod: 2021-11-08T12:43:04+08:00
draft: false
tags: [tips, buildkit]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

### 安装 & 运行 Containerd

我的电脑是 Ubuntu 20.04 ，直接通过 deb 包安装的:

```sh
# 安装 containerd
sudo apt install containerd
# 将 containerd 设置为开机自动启动
sudo systemctl enable containerd.service
# 启动  containerd
sudo systemctl start containerd.service

# 查看 containerd 的版本
ø> sudo ctr version
Client:
  Version:  1.5.2-0ubuntu1~20.04.3
  Revision:
  Go version: go1.13.8

Server:
  Version:  1.5.2-0ubuntu1~20.04.3
  Revision:
  UUID: 2e890619-f1a0-4b0f-8c4f-3363136c0c38
```

containerd 的配置文件在 `/etc/containerd/config.toml`

### 安装 & 运行 buildkitd

1. 下载 buildkit

```sh
cd ~/.local/
wget https://github.com/moby/buildkit/releases/download/v0.9.2/buildkit-v0.9.2.linux-amd64.tar.gz
# 解压 buildkit 的相关二进制文件到 ~/.local/bin 目录中
tar -xvf buildkit-v0.9.2.linux-amd64.tar.gz
```

2. 为 buildkit 创建 systemd service

向 `/etc/systemd/system/buildkit.service` 中写入

```sh
[Unit]
Description=BuildKit
Requires=buildkit.socket
After=buildkit.socketDocumentation=https://github.com/moby/buildkit

[Service]
ExecStart=/home/xuyundong/.local/bin/buildkitd --oci-worker=false --containerd-worker=true --addr tcp://localhost:1234

[Install]
WantedBy=multi-user.target
```

+ `--oci-worker=false` 和 `--containerd-worker=true` 表示使用 containerd 作为 buildkit 的后端 worker
+ `--addr tcp://localhost:1234` 表示监听 `localhost:1234` 端口和客户端通信

向 `/etc/systemd/system/buildkit.socket` 中写入
```sh
[Unit]
Description=BuildKit
Documentation=https://github.com/moby/buildkit

[Socket]
ListenStream=%t/buildkit/buildkitd.sock

[Install]
WantedBy=sockets.target
```

3. 启动 buildkit daemon

```
sudo systemctl start buildkit.service
```

### 使用 buildkit 构建镜像

1. 创建 hello.go 文件，写一个简单的 web server

```go
package main

import (
        "fmt"
        "log"
        "net/http"
)

func main() {
        http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
                fmt.Fprintf(writer, "hello, containerd")
        })

        log.Printf("Listen on %v", ":8080")
        log.Fatalln(http.ListenAndServe(":8080", nil))
}
```

2. 编写 Dockerfile

```
FROM golang:1.16

COPY hello.go /src/hello.go
RUN go build -o /src/hello /src/hello.go
ENTRYPOINT ["/src/hello"]%
```

3. 构建镜像

```
sudo ~/.local/bin/buildctl --addr tcp://localhost:1234 build --frontend=dockerfile.v0 --local context=. --local dockerfile=. --output type=image,name=hel:latest
```

`--output` 指定输出镜像的名字和类型

构建好的镜像会放到 containerd 的 buildkit namespace 下

```
ø> sudo ctr -n buildkit i ls
REF          TYPE                                                 DIGEST                                                                  SIZE      PLATFORMS   LABELS
hel:latest   application/vnd.docker.distribution.manifest.v2+json sha256:00fdb709c6f938df80d96a2c7e0677351f1f82a4c6cd54f618c0f96d4006705c 314.5 MiB linux/amd64 -
```

### 使用 containerd 运行镜像

```sh
# 创建 container
sudo ctr -n buildkit c create hel:latest hel
# 启动 task
sudo ctr -n buildkit t start -d hel
# exec 进入到 task 中
# --exec-id 参数可以随便写，只要唯一就行
sudo ctr -n buildkit t exec --exec-id 0 -t hel bash
# 在 容器内使用 curl 访问 web server
root@lazyubuntu:/go# curl 127.0.0.1:8080
hello, containerdroot@lazyubuntu:/go#
```

```sh
# 停掉 task
ø> sudo ctr -n buildkit t kill hel
ø> sudo ctr -n buildkit t ls
TASK    PID      STATUS
hel     47605    STOPPED

# 删除 task
ø> sudo ctr -n buildkit t rm hel
WARN[0000] task hel exit with non-zero exit code 2
ø> sudo ctr -n buildkit t ls
TASK    PID    STATUS

# 删除容器
ø> sudo ctr -n buildkit c ls
CONTAINER    IMAGE         RUNTIME
hel          hel:latest    io.containerd.runc.v2
ø> sudo ctr -n buildkit c rm hel
```

## 参考链接

- [一文搞懂容器运行时 Containerd](https://www.qikqiak.com/post/containerd-usage/)
- [下一代镜像构建工具 Buildkit](https://www.duyidong.com/2019/05/19/build-image-in-container-via-buildkit/)
- [用buildkit和containerd构建镜像](https://zhuanlan.zhihu.com/p/366671300)
- [重学容器05: 使用nerdctl + buildkitd构建容器镜像](https://blog.frognew.com/2021/05/relearning-container-05.html)
- [Introducing BuildKit](https://blog.mobyproject.org/introducing-buildkit-17e056cc5317)

