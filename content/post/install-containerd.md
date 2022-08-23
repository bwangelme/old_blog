---
title: "Ubuntu 下安装 Containerd 及配置代理"
date: 2022-08-23T08:17:21+08:00
lastmod: 2022-08-23T08:17:21+08:00
draft: false
tags: [containerd, k8s]
author: "bwangel"
comment: true

---

> 介绍了安装 containerd 的方法

<!--more-->
---

## 安装 containerd

- 卸载从 apt 源安装的 containerd

```sh
apt-get remove -y containerd docker.io
rm -vf /etc/systemd/system/containerd.service
rm -rvf /etc/systemd/system/containerd.service.d
```

- 安装 containerd 二进制文件

1. 从 [containerd release 页面](https://github.com/containerd/containerd/releases) 下载 `containerd-{version}-linux-amd64.tar.gz`
2. 将 containerd 的二进制文件解压到 /usr/local/bin 中

```sh
# 我下载的是 1.6.8 版本
tar Cxzvf /usr/local containerd-1.6.8-linux-amd64.tar.gz
```

3. 从 [containerd 仓库](https://github.com/containerd/containerd/blob/main/containerd.service) 中下载 systemd 配置文件, 并将其复制到 `/usr/local/lib/systemd/system/containerd.service` 中
4. 重启令 systemd 配置文件生效

```
systemctl daemon-reload
systemctl enable --now containerd
```

- 安装 runc

1. 从 [runc release 页面](https://github.com/opencontainers/runc/releases) 下载 `runc.amd64`
2. 安装 runc,

```
install -m 755 runc.amd64 /usr/local/sbin/runc
```

- 安装 CNI 插件

1. 从 [containernetworking release 页面](https://github.com/containernetworking/plugins/releases) 下载 `cni-plugins-linux-amd64-v{vesion}.tgz`
2. 将其解压到 `/opt/cni/bin` 中

```
mkdir -p /opt/cni/bin
tar Cxzvf /opt/cni/bin cni-plugins-linux-amd64-v1.1.1.tgz
```

## containerd 客户端的说明

Name      | Community             | API    | Target             | Web site                                    |
----------|-----------------------|------- | -------------------|---------------------------------------------|
`ctr`     | containerd            | Native | For debugging only | (None, see `ctr --help` to learn the usage) |
`nerdctl` | containerd (non-core) | Native | General-purpose    | https://github.com/containerd/nerdctl       |
`crictl`  | Kubernetes SIG-node   | CRI    | For debugging only | https://github.com/kubernetes-sigs/cri-tools/blob/master/docs/crictl.md |

一共有三种命令行工具可以和 containerd 交互:

- `ctr` 和 `nerdctl` 都是 containerd 社区提供的工具, `ctr` 是和 `containerd` 一起安装的.
- `crictl` 是 k8s 社区提供的符合 CRI 接口的交互工具. 在 Ubuntu 下,可以通过 `sudo apt get install cri-tools` 安装 `crictl`

## 生成 containerd 配置文件

```sh
containerd config default | sudo tee /etc/containerd/config.toml
```

执行以上命令可以生成 containerd 的默认配置文件, 我们可以做一些自定义的修改, 例如修改 `[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]`, 令 `SystemdCgroup = true`, 让 containerd 和 systemd 使用同一个 cgroups 控制器

crictl 默认连接的 service socket是 `unix:///var/run/dockershim.sock`, 我们可以在 `/etc/crictl.yaml` 中写入以下配置

```
runtime-endpoint: unix:///run/containerd/containerd.sock
```

让它默认连接 containerd 的 socket 接口

## 设置拉取镜像的 http 代理

通过设置 `HTTP_PROXY`, `HTTPS_PROXY` 环境变量, 可以设置 http 代理.

> __注意__
> - `ctr pull ...` 是在客户端进程中拉取镜像的, 环境变量需要设置到客户端中
> - `crictl pull ...` 是在 cri 插件中拉取镜像的, 它被集成到了 containerd 中, 所以需要在 server 端设置环境变量

### 设置 server 端的环境变量

修改 `/usr/local/lib/systemd/system/containerd.service` 文件, 在 `[Service]` 段加入以下内容

```
# 设置拉取镜像的代理
Environment=HTTP_PROXY=127.0.0.1:8118
Environment=HTTPS_PROXY=127.0.0.1:8118
Environment=NO_PROXY=localhost,127.0.0.1,172.17.0.0/16,192.168.56.0/24,10.96.0.0/16
```

修改完以上配置后, 重启 containerd , 环境变量就生效了

```sh
systemctl daemon-reload
systemctl restart containerd
```

此时再执行 `sudo crictl pull k8s.gcr.io/kube-controller-manager:v1.24.4` 就可以成功拉取到 k8s 相关的镜像了, 也能够正常地和 `kubeadm` 交互了

### 设置 client 侧的环境变量

如果想通过 `ctr` 拉取镜像, 需要在 client 侧设置环境变量

```sh
sudo HTTP_PROXY=127.0.0.1:8118 HTTPS_PROXY=127.0.0.1:8118 ctr i pull k8s.gcr.io/kube-apiserver:v1.24.4
```

这样也能正常拉取镜像

## 参考链接

- https://github.com/containerd/containerd/blob/main/docs/getting-started.md
- https://github.com/containerd/cri/issues/1169#issuecomment-501376676
