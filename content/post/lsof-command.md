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

## 参考链接

- [man lsof](https://linux.die.net/man/8/lsof)
