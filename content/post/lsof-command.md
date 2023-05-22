---
title: "lsof 常用命令汇总"
date: 2023-03-02T12:43:09+08:00
lastmod: 2023-03-02T12:43:09+08:00
draft: false
tags: [Tag1, Tag2]
author: "bwangel"
comment: true

---

> lsof 常用命令汇总
<!--more-->
---

## 按照网络状态筛选进程的 fd

```
sudo lsof -i -sTCP:LISTEN -a -p <pid>
```

- `-a` 表示 and, 前后两个条件要一起生效
- `-i` 和 `-s` 一起用，表示可以按照 TCP/UDP 状态来筛选 fd

- 列出进程 `<pid>` 建立的所有 TCP 连接

```
sudo lsof -i -sTCP:ESTABLISHED -a -p <pid>
```

- 列出进程 `<pid>` 所有 IDLE 状态的 UDP 连接

```
sudo lsof -i -sUDP:IDLE -a -p <pid>
```

根据 Unix 发行版本的不同，TCP/UDP 状态也会有不同的名字:

- 常用的 TCP 状态是: `CLOSED`, `IDLE`, `BOUND`, `LISTEN`, `ESTABLISHED`, `SYN_SENT`, `SYN_RCDV`, `ESTABLISHED`, `CLOSE_WAIT`, `FIN_WAIT1`, `CLOSING`, `LAST_ACK`, `FIN_WAIT_2`, `TIME_WAIT`.
- 常用的 UDP 状态是: `Unbound`, `Idle`

## 按照 fd number 查找进程的 fd

使用 `strace` 查看进程的系统调用的时候，经常能够看到在某个 fd 上执行读写操作，例如:

```
write(267, "\1\0\0\0\0\0\0\0", 8)       = 8
read(5405, "# Kubernetes-managed hosts file "..., 4096) = 4096
```

我们想要查一下这个 267 和 5405 具体代表了什么连接，可以用

```
sudo lsof -d <fd_number> -a -p <pid>
```

例如我利用 strace 查看飞书 app 的系统调用，看到以下的信息

```
ø> sudo strace -p 8261
strace: Process 8261 attached
restart_syscall(<... resuming interrupted read ...>) = 0
openat(AT_FDCWD, "/proc/self/status", O_RDONLY) = 4
read(4, "Name:\tfeishu\nUmask:\t0002\nState:\t"..., 1024) = 1024
close(4)                                = 0
futex(0x7ff0a7ffead8, FUTEX_WAKE_PRIVATE, 2147483647) = 1
futex(0x7ff0a7ffea88, FUTEX_WAKE_PRIVATE, 1) = 1
recvmsg(23, {msg_namelen=0}, 0)         = -1 EAGAIN (资源暂时不可用)
recvmsg(23, {msg_namelen=0}, 0)         = -1 EAGAIN (资源暂时不可用)
poll([{fd=9, events=POLLIN}, {fd=10, events=POLLIN}, {fd=22, events=POLLIN}, {fd=23, events=POLLIN}, {fd=67, events=POLLIN}], 5, 0) = 0 (Timeout)
recvmsg(23, {msg_namelen=0}, 0)         = -1 EAGAIN (资源暂时不可用)
recvmsg(23, {msg_namelen=0}, 0)         = -1 EAGAIN (资源暂时不可用)
poll([{fd=9, events=POLLIN}, {fd=10, events=POLLIN}, {fd=22, events=POLLIN}, {fd=23, events=POLLIN}, {fd=67, events=POLLIN}], 5, 200) = 1 ([{fd=10, revents=POLLIN}])
read(10, "!", 2)                        = 1
futex(0x7ff0a7ffead8, FUTEX_WAKE_PRIVATE, 2147483647) = 1
futex(0x7ff0a7ffea88, FUTEX_WAKE_PRIVATE, 1) = 1
futex(0x7ff0a0001eb8, FUTEX_WAKE_PRIVATE, 1) = 1
openat(AT_FDCWD, "/proc/self/status", O_RDONLY) = 4
read(4, "Name:\tfeishu\nUmask:\t0002\nState:\t"..., 1024) = 1024
```

我想知道 fd 4 代表了什么，执行 `sudo lsof -d 4 -a -p 8261`，可以看到它是我的电脑和 `220.181.131.241` 建立的一个 https 连接。

```
ø> sudo lsof -d 4 -a -p 8261
COMMAND  PID      USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
feishu  8261 xuyundong    4u  IPv4 2613086      0t0  TCP 192.168.252.88:35810->220.181.131.241:https (ESTABLISHED)
```

## 查看端口占用

有时候我们启动程序的时候，发现端口被占用了，可以用 `lsof -i:xxx` 来查看端口被哪个进程占用了，例如:

下面这条命令显示 3306 端口被 `360702` 和 `360709` 两个进程占用了。

```
ø> sudo lsof -i:3306
COMMAND      PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
docker-pr 360702 root    4u  IPv4 1842886      0t0  TCP *:mysql (LISTEN)
docker-pr 360709 root    4u  IPv6 1842889      0t0  TCP *:mysql (LISTEN)
```

## 查看容器的网络调用


### 构建镜像

- download.py

```py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-"

import requests


resp = requests.get('https://releases.ubuntu.com/22.04.2/ubuntu-22.04.2-desktop-amd64.iso?_ga=2.131295240.668169970.1684741981-917190618.1681460407')
print(resp.status_code)
```

- Dockerfile

```dockerfile
FROM python:3.10

RUN pip install requests
COPY download.py /download.py

ENTRYPOINT ["python", "/download.py"]
```

准备上述两个文件，然后执行

```
docker build -t test_download .
```

构建我们用于调试的镜像, `test_download` 。

### 启动阻塞的容器

执行以下命令，启动一个阻塞在网络请求中的容器。

```
docker run --rm test_download
```

> __Note__:
>
> 这个例子不太好，因为 `releases.ubuntu.com` 还比较健康，会持续地返回内容，现实中我们遇到的情况是，服务器完全不返回内容，客户端也没有设置超时时间，完全处于阻塞的状态。

### 查找容器的 pid

根据容器的 ID, 我们通过 `docker inspect <id>| rg -i pid` 可以获得容器的进程 ID, 如果你使用的是 containerd, 可以使用 `crictl inspect <id> | rg -i pid`

```
ø> docker ps
CONTAINER ID   IMAGE           COMMAND                 CREATED          STATUS          PORTS     NAMES
bf5846384913   test_download   "python /download.py"   37 seconds ago   Up 36 seconds             friendly_wozniak
ø> docker inspect bf5846384913 | rg -i pid
            "Pid": 726678,
            "PidMode": "",
            "PidsLimit": null,
```

### 利用 strace 查看进程的状态

从 strace 的输出中可以看到，进程一直在从 3 号 fd 上读取数据

```
root@Macmini:~# strace -p 726678
strace: Process 726678 attached
read(3, "Z\263\351\331\315\17\330\205\222\361\21\235'Kp\301w\256\365|\275K\326y\350@\305\300\325\262\fk"..., 13131) = 1448
read(3, "\317GKJ\324O)1\5\272\\\"\24\360s\177\263\223#\376\360\35\360\226\240\214mf\374\243\222\335"..., 11683) = 11683
read(3, "\27\3\3@\21", 5)               = 5
read(3, "\22c\367U@\243\377\325\255\n0\376\79J\244\v9O4\233Kq\0233\304k\6\356dy\20"..., 16401) = 16401
read(3, "\27\3\3@\21", 5)               = 5
read(3, "[\244K\30\7\30?[\210\313\364\335\t\321>l\270\2\365\262\307|\376\211.\376\342%\361\34\31\246"..., 16401) = 16401
read(3, "\27\3\3@\21", 5)               = 5
read(3, "\335\373\354\320:SF\244o#\244\377Ll\21\366AT\374vgYD\2418\305\340\313||\243;"..., 16401) = 16401
read(3, "\27\3\3@\21", 5)               = 5
read(3, "X \300\240\252IoZ\352W$\255\266\324\304q\306\23\226-b\212\300\271\222pI\270\33\tcn"..., 16401) = 16401
read(3, "\27\3\3@\21", 5)               = 5
read(3, "\213\331\225\331b\2405\204\f\213\32\r\250;\250\326.\4l\221\230^0\272{\317\32he\262V\223"..., 16401) = 16401
brk(0x55fba8f48000)                     = 0x55fba8f48000
read(3, "\27\3\3@\21", 5)               = 5
read(3, "\4\317\362`-R}\360\"\266nZ\33\261s,\340\345\371\300;]\347\30\237\344\305\235m\360j\357"..., 16401) = 16401
read(3, "\27\3\3@\21", 5)               = 5
read(3, "1v\355\312]nG\347\240\4\210\350\241\34\257\333\307\233z\261\0\6\307\2234n\21V\27\305\272\371"..., 16401) = 16401
read(3, "\27\3\3@\21", 5)               = 5
```

### 利用 lsof 查看 fd 详细信息

```
nsenter -n -t 726678 lsof -d 3 -a -p 726678
```

```
root@Macmini:~# nsenter -n -t 726678 lsof -d 3 -a -p 726678
COMMAND    PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
python  726678 root    3u  IPv4 9813984      0t0  TCP 172.17.0.2:55378->https-services.aerodent.canonical.com:https (ESTABLISHED)
```

可以看到，3号fd 是一个TCP 连接，本地的 `172.17.0.2:55378` 连接了远端的 `https-services.aerodent.canonical.com:https`

> __Note__
>
> 如果我们不加 nsenter -n -t <pid> 来切换 network namespace 的话，lsof 输出的信息中就没有详细的客户端和服务端的地址了

```
root@Macmini:~# lsof -d 3 -a -p 729160
COMMAND    PID USER   FD   TYPE DEVICE SIZE/OFF    NODE NAME
python  729160 root    3u  sock    0,8      0t0 9829458 protocol: TCP
```

## 参考链接

- [man lsof](https://linux.die.net/man/8/lsof)
