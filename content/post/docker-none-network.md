---
title: "从 none 开始，用网桥模式启动容器的网络"
date: 2023-01-20T10:15:48+08:00
lastmod: 2023-01-20T10:15:48+08:00
draft: false
tags: [docker, network]
author: "bwangel"
comment: true

---

用 none 网络模式启动的容器，创建一个可以对外通信的网络

<!--more-->
---

## 目的

本篇文章中，我们首先使用 none 网络模式启动一个容器，然后一步步给它配置好网络，让这个容器能够正常进行网络通信。

最终容器的网络架构图如下图所示:

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com/2023-01-20-103416.png)

- enp4s0 是宿主机的网络设备
- eth0 是 nginx 容器的网络设备, eth0 和 A 是一对 veth 设备
- docker0 是 docker 安装时自动创建的网桥设备

## veth 是什么

veth 全称是 virtual ethernet devices, 虚拟以太网设备。
它们可以作为网络 namespace 之间通信的通道，在另一个网络 namespace 创建和网络物理设备通信的桥梁。
也可以作为内部网络设备。

veth 设备总是成对出现，一对 veth 设备可以用如下的命令创建:

```
ip link add <p1-name> type veth peer name <p2-name>
```

在上面的代码中，p1-name 和 p2-name 是分配给两个连接的端点的名称。

对一个设备上传输的数据包会立即在另一个设备上接收。当任何一个设备关闭时，veth 对的链路状态就会关闭。

Veth 设备对用于以有趣的方式将内核的网络设施组合在一起。

一个特别有趣的用例是将 veth 对的一端放在一个网络名称空间中，
另一端放在另一个网络名称空间中，从而允许网络名称空间之间进行通信。

为此，可以在创建接口时提供 netns 参数:

```
ip link add <p1-name> netns <p1-ns> type veth peer <p2-name> netns <p2-ns>
```

或者，对于现有的 veth 对，可以将一端移动到另一个名称空间:

```
ip link set <p2-name> netns <p2-ns>
```

[ethtool(8)](https://man7.org/linux/man-pages/man8/ethtool.8.html) 可用于查找 veth 网络接口的对等点，使用类似下面这样的命令:


```shell
# ip link add ve_A type veth peer name ve_B   # 创建一对 veth 设备
# ethtool -S ve_A         # 查找 ve_A 接口对端接口的索引
NIC statistics:
    peer_ifindex: 16
# ip link | grep '^16:'   # 查找索引是 16 的设备
16: ve_B@ve_A: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc ...
```

- __注意__：如果 veth 的设备名太长，ethtool 会出错

```shell
root@Macmini:~# ethtool -S veth550bfa1@if25
ioctl-only request, device name longer than 15 not supported
```

## 准备工作

- 查看当前主机上的网桥设备，默认有一个 docker0

```shell
root@dockervbox:~# brctl show
bridge name     bridge id               STP enabled     interfaces
docker0         8000.02421f335f1f       no
```

- 创建 /var/run/netns 目录，ip netns 操作的就是此目录中的网络 namespace
- 删除 /var/run/netns 中的所有目录

```shell
root@dockervbox:~# mkdir -p /var/run/netns
root@dockervbox:~# find -L /var/run/netns -type l -delete
```

## 启动容器

- 使用 none 网络模式启动一个 nginx 容器

```shell
ø> docker run --rm -it --network=none -d nginx
ebcf462cbb463d41dd677a501aee5a629f587141c27632d4954017784877b7c0

ø> docker ps
CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS         PORTS     NAMES
ebcf462cbb46   nginx     "/docker-entrypoint.…"   6 minutes ago   Up 6 minutes             exciting_torvalds
```

- 启动成功后，记录此容器的 pid 到 $pid 环境变量

```
ø> docker inspect ebcf462cbb463d41dd677a501aee5a629f587141c27632d4954017784877b7c0 | grep -i pid
            "Pid": 119320,
            "PidMode": "",
            "PidsLimit": null,
ø> export pid=119320
ø> echo $pid
119320
```

- 进入 $pid 进程所在的网络 ns, 查看所有的网络设备，可以看到只有一个 lo 设备，没有其他的网络设备

```
root@Macmini:~# nsenter -t $pid -n ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
inet 127.0.0.1/8 scope host lo
valid_lft forever preferred_lft forever
```

- 软链接 $pid 的网络 ns 到 /var/run/netns/ 中, 创建 ip netns 可以操作的网络 ns

```shell
root@Macmini:~# ln -s "/proc/$pid/ns/net" /var/run/netns/$pid
root@Macmini:~# ls /var/run/netns/119320
/var/run/netns/119320
root@Macmini:~# ip netns list
119320
```

- 使用 `lsns -t net` 查看当前系统的 network namespace, 可以看到已经多出来 nginx 容器的 network namespace 了

```shell
root@Macmini:~# lsns -t net | head -n 3
        NS TYPE NPROCS    PID USER         NETNSID NSFS                           COMMAND
4026531840 net     345      1 root      unassigned                                /sbin/init
4026532348 net      13 119320 root      unassigned /run/docker/netns/2bdfbe67a978 nginx: master process nginx -g daemon off;
```

- 查看 `/proc/$pid/ns` 目录中的 namespace id, 能够看到 net namespace id 和 lsns 列出的 id 相同

```shell
root@Macmini:~# ls -l /proc/$pid/ns
总用量 0
lrwxrwxrwx 1 root root 0  1月 20 11:01 cgroup -> 'cgroup:[4026532904]'
lrwxrwxrwx 1 root root 0  1月 20 11:01 ipc -> 'ipc:[4026532307]'
lrwxrwxrwx 1 root root 0  1月 20 11:01 mnt -> 'mnt:[4026532278]'
lrwxrwxrwx 1 root root 0  1月 20 10:50 net -> 'net:[4026532348]'
lrwxrwxrwx 1 root root 0  1月 20 11:01 pid -> 'pid:[4026532312]'
lrwxrwxrwx 1 root root 0  1月 20 11:01 pid_for_children -> 'pid:[4026532312]'
lrwxrwxrwx 1 root root 0  1月 20 11:01 time -> 'time:[4026531834]'
lrwxrwxrwx 1 root root 0  1月 20 11:01 time_for_children -> 'time:[4026531834]'
lrwxrwxrwx 1 root root 0  1月 20 11:01 user -> 'user:[4026531837]'
lrwxrwxrwx 1 root root 0  1月 20 11:01 uts -> 'uts:[4026532280]'
```

## 创建 veth 设备

- 创建一对 veth 设备，叫做 A 和 B
- 将 A 连接到 docker0 网桥上
- 启动 A

```shell
root@Macmini:~# ip link add A type veth peer name B
root@Macmini:~# brctl addif docker0 A
root@Macmini:~# ip link set A up
# A 处于 UP 状态，但因为 A 没有完全连通，所以还是 M-DOWN 的状态
root@Macmini:~# ip a
23: B@A: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 16:81:96:a3:bf:27 brd ff:ff:ff:ff:ff:ff
24: A@B: <NO-CARRIER,BROADCAST,MULTICAST,UP,M-DOWN> mtu 1500 qdisc noqueue master docker0 state LOWERLAYERDOWN group default qlen 1000
    link/ether 76:8b:1a:65:f5:57 brd ff:ff:ff:ff:ff:ff
```

## 设置 veth 设备

- 将 ip, 掩码， 网关保存成环境变量

```shell
root@Macmini:~# SETIP=172.17.0.10
root@Macmini:~# SETMASK=16
root@Macmini:~# GATEWAY=172.17.0.1
```

- 将 veth 设备 B 加入到 $pid 所在的 network namespace 中
- 并将 设备 B 的名字改成 eth0

```
root@Macmini:~# ip link set B netns $pid
root@Macmini:~# ip netns exec $pid ip link set dev B name eth0
```

- 此时查看 $pid network namespace 中的网络设备，可以看到 eth0 已经存在了

```shell
root@Macmini:~# ip netns exec $pid ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
23: eth0@if24: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 16:81:96:a3:bf:27 brd ff:ff:ff:ff:ff:ff link-netnsid 0
```

- 启动 eth0
- 因为 A 已经连接到了网桥上，所以直接启动成功，出现了 LOWER_UP 的状态

```shell
root@Macmini:~# ip netns exec $pid ip link set eth0 up
root@Macmini:~# ip netns exec $pid ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
23: eth0@if24: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 16:81:96:a3:bf:27 brd ff:ff:ff:ff:ff:ff link-netnsid 0
```

- 设置 IP 和路由

```shell
# 设置 $pid ns 中的 eth0 设备的 ip 和 掩码
root@dockervbox:~# ip netns exec $pid ip addr add $SETIP/$SETMASK dev eth0
# 设置 $pid ns 中的 eth0 设备的默认路由网关
root@dockervbox:~# ip netns exec $pid ip route add default via $GATEWAY
```

- 查看 IP 和路由

```shell
# 查看 $pid ns 中的所有设备，可以看到 eth0 已经启动成功，并且有了 ip 和子网掩码
root@Macmini:~# nsenter -t $pid -n ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
23: eth0@if24: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 16:81:96:a3:bf:27 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.17.0.10/16 scope global eth0
       valid_lft forever preferred_lft forever
```

- 查看 $pid ns 中的路由表，可以看到 eth0 默认的路由地址是 172.17.0.1

```shell
root@Macmini:~# nsenter -t $pid -n ip route
default via 172.17.0.1 dev eth0
172.17.0.0/16 dev eth0 proto kernel scope link src 172.17.0.10
```

- 查看宿主机上的网络设备，可以看到 veth A 的名字变成了 A@if23, 并且状态已经由 M-DOWN 变成了 `LOWER_UP`

```shell
root@Macmini:~# ip a
24: A@if23: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker0 state UP group default qlen 1000
    link/ether 76:8b:1a:65:f5:57 brd ff:ff:ff:ff:ff:ff link-netns 119320
    inet6 fe80::748b:1aff:fe65:f557/64 scope link
       valid_lft forever preferred_lft forever
```

## 容器网络启动成功

- 最后，我们在容器中访问互联网，能够成功访问

```shell
root@Macmini:~# docker exec ebcf462cbb46 curl -I www.baidu.com
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0   277    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
HTTP/1.1 200 OK
Accept-Ranges: bytes
Cache-Control: private, no-cache, no-store, proxy-revalidate, no-transform
Connection: keep-alive
Content-Length: 277
Content-Type: text/html
Date: Fri, 20 Jan 2023 03:33:01 GMT
Etag: "575e1f60-115"
Last-Modified: Mon, 13 Jun 2016 02:50:08 GMT
Pragma: no-cache
Server: bfe/1.0.8.18
```

- 在宿主机上访问 nginx 容器的 ip, 也能够正常访问

```shell
root@Macmini:~# curl -I $SETIP
HTTP/1.1 200 OK
Server: nginx/1.23.3
Date: Fri, 20 Jan 2023 03:28:12 GMT
Content-Type: text/html
Content-Length: 615
Last-Modified: Tue, 13 Dec 2022 15:53:53 GMT
Connection: keep-alive
ETag: "6398a011-267"
Accept-Ranges: bytes
```

