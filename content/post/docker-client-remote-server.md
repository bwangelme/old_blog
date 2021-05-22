---
title: "Docker 客户端连接远程 Docker Daemon"
date: 2021-05-22T11:41:46+08:00
lastmod: 2021-05-22T11:41:46+08:00
draft: false
tags: [Docker, ]
author: "bwangel"
comment: true

---

> + Docker 客户端连接远程 Docker Daemon
> + [参考链接 How to Connect to a Remote Docker Daemon](https://dockerlabs.collabnix.com/beginners/components/daemon/access-daemon-externally.html)
<!--more-->
---

## 环境准备

+ Ubuntu 18.04 运行着 Docker Daemon 19.03.6
+ MacOS 系统运行着 Docker Client 20.10.2 版本

## 设置 Ubuntu 中的 Docker Daemon

__注:__ 这一小节的命令都在 Ubuntu 中执行

+ 配置 Docker Daemon

```sh
# 创建 docker service 的配置文件目录
sudo mkdir -p /etc/systemd/system/docker.service.d
# 修改 docker service 的启动命令，令其监听本地套接字文件和 2375 端口
sudo cat > /etc/systemd/system/docker.service.d/options.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock -H tcp://0.0.0.0:2375
EOF
```

+ TODO: 配置防火墙 (由于我的 Ubuntu 是台虚拟机，我直接将防火墙关闭了)

+ 重启 docker service，令配置生效

```sh
sudo systemctl daemon-reload # 重新载入 systemd 关于 docker service 的配置
sudo systemctl restart docker.service # 重启 docker service
```

+ 执行 `docker version -f '{{.Server.APIVersion}}'`，查看 Docker API 版本，我的版本是 `1.40`

## 客户端测试连接

__注:__ 这一小节的命令都在 MacOS 中执行

+ 执行 `curl 192.168.56.23:2375/v1.40/images/json`，会列出所有已经下载的镜像，若返回值正确，表示 Docker Daemon 已经配置好了
+ 使用 docker client 连接 Ubuntu 中的 Docker Daemon

```
ø> DOCKER_HOST=tcp://192.168.56.23:2375 docker images                                                                                                                                                                                                                                                     11:55:17 (05-22)
REPOSITORY                        TAG       IMAGE ID       CREATED         SIZE
ubuntu                            20.04     8e428cff54c8   8 weeks ago     72.9MB
ubuntu                            latest    8e428cff54c8   8 weeks ago     72.9MB
elasticsearch                     7.5.1     2bd69c322e98   17 months ago   779MB
docker.elastic.co/kibana/kibana   7.1.0     714b175e84e8   2 years ago     745MB
```

最后，我在 zshrc 中添加了一条 alias: 

```
(( $+commands[docker] )) && alias docker="DOCKER_HOST=tcp://192.168.56.23:2375 docker"
```

这样在 MacOS 中执行 docker 命令访问的就是 Ubuntu 虚拟机中的 Docker Daemon 了。
