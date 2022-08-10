---
title: "Ubuntu 下 Docker 设置 Registry"
date: 2022-08-09T21:14:49+08:00
lastmod: 2022-08-09T21:14:49+08:00
draft: false
tags: [tips, docker]
author: "bwangel"
comment: true
---

<!--more-->

> - docker 拉取镜像怎么办?
>   - 1. 设置 registry-mirror
>   - 2. 为 dockerd 设置 http 代理
> - 鉴于很多厂商不再提供公共的 docker registry，提供服务的也都对下载速度进行了限制，建议使用第二种解决方案

---

## docker 配置 registry-mirror

- 执行 `systemctl cat docker | grep Exec` 查看 dockerd 的启动命令，确认启动时没有指定 `registry-mirror` 选项

```
ø> systemctl cat docker | grep Exec
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
ExecReload=/bin/kill -s HUP $MAINPID
```

- 向 `/etc/docker/daemon.json` 写入以下内容

```sh
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
```

- 重新启动服务

```sh
sudo systemctl daemon-reload
sudo systemctl restart docker
```

- 检查配置是否成功

```
docker info | grep -A 3 'Registry Mirrors:'
```

- 速度限制

目前找到的可用的公共 registry-mirror 一共有三个

- `https://hub-mirror.c.163.com`
- `https://mirror.baidubce.com`
- `https://xxx.mirror.aliyuncs.com` (需要登录阿里云后获取)

他们都存在限速，最高下载速度是每秒 500k 左右。

- 镜像更新不及时

有些较新的镜像，例如 `golang:1.19`， registry mirror 中并没有，最终还是会从 `registry-1.docker.io` 去拉取镜像

## dockerd 使用 http 代理

- 在执行 `docker pull` 的时候，拉取镜像的过程实际是由 dockerd 执行，因此，想要在访问 `docker.io` 时加上代理，就需要通过 `http_proxy` 环境变量为 dockerd 配置代理
- 修改 systemd 配置，并写入代理配置

```sh
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo touch /etc/systemd/system/docker.service.d/proxy.conf
sudo tee /etc/systemd/system/docker.service.d/proxy.conf <<-'EOF'
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080/"
Environment="HTTPS_PROXY=http://proxy.example.com:8080/"
Environment="NO_PROXY=localhost,127.0.0.1,.example.com"
EOF
```

- 重新启动服务

```
sudo systemctl daemon-reload
sudo systemctl restart docker
```

- 检查配置是否成功

```
docker info | grep -A 3 'Proxy'
```

## 参考链接

- [镜像加速器](https://yeasy.gitbook.io/docker_practice/install/mirror)
- [Docker的三种网络代理配置](https://note.qidong.name/2020/05/docker-proxy/)
