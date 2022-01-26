---
title: "混杂模式"
date: 2021-11-12T23:36:02+08:00
lastmod: 2021-11-12T23:36:02+08:00
draft: false
tags: [tips, network]
author: "bwangel"
comment: true
---

<!--more-->

---

## 定义

混杂模式是指一个网卡会把它接收的所有网络流量都交给 CPU，而不是只把它想转交的部分交给 CPU。

在 IEEE 802 定的网络规范中，每个网络帧都有一个目的 MAC 地址。在非混杂模式下，网卡只会接收目的地址是它自己的单播帧，以及多播及广播帧；在混杂模式下，网卡会接收经过它的所有帧。

## 查看

使用 `netstat -i` 和 `ifconfig` 可以查看网卡的状态

```sh
ø> sudo netstat -i
Kernel Interface table
Iface      MTU    RX-OK RX-ERR RX-DRP RX-OVR    TX-OK TX-ERR TX-DRP TX-OVR Flg
br-7fd48  1500        0      0      0 0             0      0      0      0 BMU
br-bade7  1500        0      0      0 0             0      0      0      0 BMU
docker0   1500        0      0      0 0             0      0      0      0 BMU
enp0s3    1500      999      0      0 0           692      0      0      0 BMRU
# P 表示网卡 enp0s8 开启了混杂模式 promisc
enp0s8    1500        1      0      0 0            17      0      0      0 BMPRU
lo       65536        8      0      0 0             8      0      0      0 LRU


ø> ifconfig enp0s8
# PROMISC 表示 enp0s8 开启了混杂模式
enp0s8: flags=4419<UP,BROADCAST,RUNNING,PROMISC,MULTICAST>  mtu 1500
        inet 192.168.56.23  netmask 255.255.255.0  broadcast 192.168.56.255
        inet6 fe80::a00:27ff:fedd:4aec  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:dd:4a:ec  txqueuelen 1000  (Ethernet)
        RX packets 1  bytes 86 (86.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 17  bytes 1326 (1.3 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

## 设置

+ `sudo ifconfig enp0s8 promisc` 可以让网卡进入混杂模式
+ `sudo ifconfig enp0s8 -promisc` 可以让网卡退出混杂模式

+ veth 设备加入 Linux Bridge 后，会自动进入混杂模式，且无法退出。
+ 网络设备离开 Linux Bridge 后，会自动退出混杂模式。

## 参考链接

+ [《Kubernetes 网络权威指南》](https://book.douban.com/subject/34855927/)
