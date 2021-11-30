---
title: "Review 《File Descriptor Transfer over Unix Domain Sockets》"
date: 2021-11-30T11:58:56+08:00
lastmod: 2021-11-30T11:58:56+08:00
draft: false
tags: [翻译, linux]
author: "bwangel"
comment: true

---

> + __使用 Unix 域套接字传输文件描述符__
> + 原文地址: https://copyconstruct.medium.com/file-descriptor-transfer-over-unix-domain-sockets-dcbbf5b3b6ec

<!--more-->
---

> __12/31/2020 更新__
>
> 如果你使用的是较新的内核（Linux 5.6以上），随着一个新的系统调用 `pidfd_getfd` 的引入，这种复杂性大部分已经被消除了。更多细节请参考 2020年 12-31 发表的文章[《用 pidfd 和 pidfd_getfd 在进程间无缝传输文件描述符》](https://copyconstruct.medium.com/seamless-file-descriptor-transfer-between-processes-with-pidfd-and-pidfd-getfd-816afcd19ed4)。

昨天，我读了一篇惊人的论文，介绍了使用不同协议而且许多不同类型请求（长寿的TCP/UDP会话，涉及大块数据的请求等）的服务在Facebook是如何免中断发布的。

Facebook 使用的一种技术它们叫做 `Socket Takeover` 。

`Socket Takeover` 实现了 Proxygen 的零停机重启，它以并行方式启动了一个更新的实例，接管了监听的套接字，当旧的实例进入了优雅关闭阶段。新实例负责为新连接提供服务，并响应来自 L4LB Katran 的健康检查探针。老的连接由老的实例提供服务，直到完全关闭，之后其他机制（例如下游连接重用）开始发挥作用。

当我们把一个打开的FD从旧的进程传递给新的进程时，传递和接收的进程都共享监听套接字的同一个文件表项，并各自独立地处理接收的连接，在这些连接上提供连接级事务。我们利用了以下Linux内核的特性来实现这一点。


__CMSG__：`sendmsg()` 的一个功能允许在本地进程之间发送控制信息（通常被称为辅助数据）。在 Level7 LB 进程的重启过程中，我们使用这一机制将所有 VIP ( Virtual IP of service) 的活动的监听套接字的 FD 集合从活动的实例发送至新启动的实例。这些数据是通过 `sendmsg` 和 `recvmsg` 在 UNIX 域套接字上交换的。

__SCM_RIGHTS__: 我们设置这个选项来发送打开的文件描述符，其数据部分包含一个打开的FD的整数数组。在接收方，这些 文件描述符的行为就像它们是用 `dup(2)` 创建的一样。


我在 Twitter 上收到了一些人的回复，他们对这竟然是可能的表示惊讶。事实上，如果你对Unix域套接字的一些特性不是很熟悉，那么论文中的上述段落可能就很难理解了。

实际上，在 Unix 域套接字上传输 TCP 套接字是一种久经考验的方法，来实现 __热重启__ 或 __零停机时间重启__ 。流行的代理，如 HAProxy 和 Envoy ，使用非常类似的机制，将连接从代理的一个实例引流到另一个实例，而不丢弃任何连接。然而，许多类似的功能却并不广为人知。

在这篇文章中，我想探讨Unix域套接字的一些特性，这些特性使它成为这些场景下的合适候选者，特别是将套接字（或任何文件描述符）从一个进程转移到另一个进程，在这两个进程之间不一定存在父子关系。

## Unix 域套接字

众所周知，Unix 域套接字允许同一主机系统上的进程之间进行通信。Unix域套接字在许多流行的系统中都有使用。HAProxy、Envoy、AWS的Firecracker虚拟机监视器、Kubernetes、Docker和Istio等等。

### 一个简短的教程

就像网络套接字一样，Unix 域套接字也支持流和数据报文类型。然而，与采用 IP 和端口作为地址的网络套接字不同，Unix域套接字使用路径名作为地址。与网络套接字不同，Unix域套接字的 I/O 不涉及对底层设备的操作（这使得Unix域套接字与网络套接字相比，在同一主机上执行IPC要快很多）。

用 `bind(2)` 将一个名字绑定到一个Unix域套接字，在文件系统中创建一个名为 `pathname` 的套接字文件。然而，这个文件与你可能创建的任何普通文件不同。

一个简单的Go程序在 Unix 域套接字上创建一个监听的 "Echo 服务器"，如下所示:

```go
package main

import (
	"io"
	"log"
	"net"
	"syscall"
)

func main() {
	const addr = "/tmp/uds.sock"
	syscall.Unlink(addr)

	l, err := net.Listen("unix", addr)
	if err != nil {
		log.Fatal(err)
	}
	defer l.Close()

	for {
		c, err := l.Accept()
		if err != nil {
			log.Fatal(err)
		}

		go func(c net.Conn) {
			io.Copy(c, c)
			c.Close()
		}(c)
	}
}
```

如果你建立并运行这个程序，可以观察到几个有趣的事实。

### Socket 文件 != 普通文件

首先，套接字文件 `/tmp/uds.sock` 被标记为一个套接字。当使用 `stat()` 调用查看这个路径名时，它在stat结构的`st_mode`字段的文件类型部分返回值 `S_IFSOCK` 。

当用`ls -l`查看时，UNIX 域套接字在第一列显示为s类型，而 `ls -F` 在套接字路径名上附加一个等号（=）。


```
root@1fd53621847b:~/uds# ./uds
^C
root@1fd53621847b:~/uds# ls -ls /tmp
total 0
0 srwxr-xr-x 1 root root 0 Aug  5 01:45 uds.sock
root@1fd53621847b:~/uds# stat /tmp/uds.sock
File: /tmp/uds.sock
Size: 0          Blocks: 0          IO Block: 4096   socket
Device: 71h/113d Inode: 1835567     Links: 1
Access: (0755/srwxr-xr-x)  Uid: (    0/    root)   Gid: (    0/    root)
Access: 2020-08-05 01:45:41.650709000 +0000
Modify: 2020-08-05 01:45:41.650709000 +0000
Change: 2020-08-05 01:45:41.650709000 +0000

Birth: -

root@5247072fc542:~/uds# ls -F /tmp
uds.sock=
root@5247072fc542:~/uds#
```

对文件起作用的普通系统调用在套接字文件上不起作用：这意味着像 `open()` 、`close()` 、`read()` 这样的系统调用不能用于套接字文件。相反，像 `socket()` 、`bind()` 、`recv()` 、`sendmsg()` 、`recvmsg()` 等套接字相关的系统调用可以在 Unix域套接字上工作。

另一个关于套接字的有趣事实是，它不是在套接字被关闭的时候删除，而是通过系统调用来删除

+ 在 MacOS 上调用 `unlink(2)`
+ 在 Linux 上调用 `remove()` 或使用地更普遍的 `unlink(2)`

在 Linux 上，Unix 域套接字的地址通过如下的结构来表示:

```
struct sockaddr_un {
      sa_family_t sun_family; /* Always AF_UNIX */
      char sun_path[108]; /* Pathname */
};
```

在 MacOS 上，地址通过如下的结构表示:

```
struct sockaddr_un {
     u_char  sun_len;
     u_char  sun_family;
     char    sun_path[104];
};
```

### 使用 bind(2) 绑定一个已经存在的路径将会失败

`SO_REUSEPORT` 选项允许任何指定主机上的多个网络套接字连接到同一地址和端口。第一个试图绑定给定端口的套接字需要设置 `SO_REUSEPORT` 选项，任何后续的套接字都可以绑定到同一端口。


对 `SO_REUSEPORT` 的支持是在 Linux 3.9及以上版本中引入的。然而，在 Linux 上，所有想共享同一地址和端口组合的套接字必须属于共享同一有效UID的进程。

```c
int fd = socket(domain, socktype, 0);
int optval = 1;
setsockopt(sfd, SOL_SOCKET, SO_REUSEPORT, &optval, sizeof(optval));
bind(sfd, (struct sockaddr *) &addr, addrlen);
```

然而，两个 Unix 域套接字无法绑定相同的路径。

## SOCKETPAIR

`socketpair()` 函数创建了两个套接字，然后将其连接在一起。从某种程度上说，这与 __管道__ 非常相似，只是它支持数据的双向传输。

`socketpair` 只对 Unix 域套接字起作用。它返回两个已经连接在一起的文件描述符（所以我们不必在开始传输数据之前
, 执行 `socket` -> `bind` -> `listen` -> `accept`的流程来建立一个监听套接字。也不必在开始传输数据之前，执行 `socket` -> `connect` 的流程创建一个连接到监听套接字的客户端）。

## 在 Unux 域套接字上传输数据


现在我们已经确定 Unix 域套接字允许同一主机上的两个进程进行通信，现在是时候探索什么样的数据可以通过 Unix 域套接字传输。

由于Unix域套接字在许多方面与网络套接字相似，任何通常可以通过网络套接字发送的数据都可以通过Unix域套接字发送。

此外，特殊的系统调用 `sendmsg` 和 `recvmsg` 允许在Unix域套接字上发送一个特殊的消息。这个消息由内核特别处理，它允许从发送者向接收者传递打开的 __File Descriptions__。

### File Descriptors(文件描述符) VS File Description (文件描述)

注意上一段我使用了术语 文件描述(`File descripTION`)，而不是文件描述符 (__file descripTOR__)。它们两者的区别是微妙的而且往往不被人理解。

文件描述符实际上只是一个进程内(不可跨进程使用)指向底层内核数据结构的指针，该结构被称为文件描述（__File Description__）。内核维护着一个所有打开的文件描述的表格，称为打开文件表(__open file table__)。如果两个进程（A和B）试图打开同一个文件，这两个进程可能有自己独立的文件描述符，它们指向开放文件表中的同一个文件描述。

![img](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-11-30-142542.png)

所以，在 Unix 域套接字上使用 `sendmsg` 发送文件描述符实际上意味着发送 __文件描述__ 的引用。如果进程 A 向 进程 B 发送文件描述符 0 (fd0)，该文件描述符在进程 B 中很可能被数字3(fd3) 所引用。

发送进程在 Unix 域套接字上调用 `sendmsg` 发送文件描述符，接收进程在 Unix 域套接字上调用 `recvmsg` 来接受文件描述符。

发送进程通过 `sendmsg` 发送文件描述给接收进程，接收进程通过 `recvmsg` 接收该文件描述。即使发送进程在发送完成后关闭了该文件描述所对应的文件描述符，而接收进程还未调用 `recvmsg` 接收它，该文件描述依然对接收进程保持打开状态。

__发送文件描述符时，文件描述的引用次数会+1,直到文件描述的引用次数下降到0, 内核才会将文件描述从 `打开文件表(open file table)` 中删除该文件描述。

即使发送进程在接收进程调用 recvmsg 之前关闭了引用通过 sendmsg 传递的文件描述的文件描述符，该文件描述符仍然对接收进程开放。发送描述符时，描述符的引用次数会增加1。内核只有在引用计数下降到0时才会从其开放文件表中删除文件描述。

### sendmsg 和 recvmsg

在 Linux 中 `sendmsg` 函数的签名如下:

```c
ssize_t sendmsg(
    int socket,
    const struct msghdr *message,
    int flags
);
```

与 `sendmsg` 对应的是 `recvmsg`:


```c
ssize_t recvmsg(
     int sockfd,
     const struct msghdr *msg,
     int flags
);
```

人们可以用 `sendmsg` 在 Unix 域套接字上传输的特殊消息是由 `msghdr` 指定的。希望将文件描述发送给另一个进程的进程创建一个 `msghdr` 结构，其中包含要传递的描述。

```c
struct msghdr {
    void            *msg_name;      /* optional address */
    socklen_t       msg_namelen;    /* size of address */
    struct          iovec *msg_iov; /* scatter/gather array */
    int             msg_iovlen;     /* # elements in msg_iov */
    void            *msg_control;   /* ancillary data, see below */
    socklen_t       msg_controllen; /* ancillary data buffer len */
    int             msg_flags;      /* flags on received message */
};
```

`msghdr` 结构的 `msg_control` 成员，其长度为 `msg_controllen` ，指向一个如下形式的消息缓冲区:

```c
struct cmsghdr {
    socklen_t cmsg_len;    /* data byte count, including header */
    int       cmsg_level;  /* originating protocol */
    int       cmsg_type;   /* protocol-specific type */
    /* followed by */
    unsigned char cmsg_data[];
};
```


在 POSIX 中，带有附加数据的 `cmsghdr` 结构的缓冲区被称为辅助数据(ancillary data)。在 Linux 上，每个套接字允许的最大缓冲区大小可以通过修改 `/proc/sys/net/core/optmem_max` 来设置。

## 辅助数据传输


虽然这种数据传输有大量的陷阱，但如果使用得当，它可以成为一个相当强大的机制来实现一些目标。

在Linux上，有三种类型的辅助数据可以在两个Unix域套接字之间共享。


+ `SCM_RIGHTS`
+ `SCM_CREDENTIALS`
+ `SCM_SECURITY`

这三种类型的辅助数组仅应该通过下面的宏定义来访问，而不应该直接使用

```c
struct cmsghdr *CMSG_FIRSTHDR(struct msghdr *msgh);
struct cmsghdr *CMSG_NXTHDR(struct msghdr *msgh, struct cmsghdr *cmsg);
size_t CMSG_ALIGN(size_t length);
size_t CMSG_SPACE(size_t length);
size_t CMSG_LEN(size_t length);
unsigned char *CMSG_DATA(struct cmsghdr *cmsg);
```

我从来没有使用后两者的需要，`SCM_RIGHTS` 是我希望在这篇文章中进一步探讨的。

### SCM_RIGHTS

`SCM_RIGHTS` 允许进程使用 `sendmsg/recvmsg` 从另一个进程发送/接收一组打开的文件描述符。

`cmsghdr` 结构体的成员 `cmsg_data` 可以包含一个进程想要发送的文件描述符的数组。


```
struct cmsghdr {
    socklen_t cmsg_len;    /* data byte count, including header */
    int       cmsg_level;  /* originating protocol */
    int       cmsg_type;   /* protocol-specific type */
    /* followed by */
    unsigned char cmsg_data[];
};
```

接收进程使用 `recvmsg` 接收数据。

《Linux Programming Interface》有一个使用 `sendmsg` 和 `recvmsg` 函数的[良好示例](https://man7.org/tlpi/code/online/dist/sockets/scm_rights_send.c.html)。

## SCM_RIGHTS 的陷阱

正如上文所讲，使用 Unix 域套接字传输辅助数据有很多的陷阱。

> __Need to send some “real” data along with the ancillary message__
>
> 需要在发送辅助数据的同时发送一些真实的数据

在 Linux 上，如果想要成功地在 __流式(stream)__ Unix 域套接字上发送辅助数据，至少要发送一个字节的真实数据。

然而，如果想要在 __数据报式(datagram)__ 的 Unix 域套接字上发送辅助数据，不需要发送任何附带的真实数据。也就是说，在通过数据报套接字发送辅助数据时，便携式应用程序还应该包括至少一个字节的真实数据。

> File Descriptors can be dropped
>
> 文件描述符可以被丢弃

如果用于接收包含文件描述符的辅助数据的缓冲区 `cmsg_data` 太小（或没有），那么辅助数据被截断（或丢弃），多余的文件描述符在接收进程中被自动关闭。

如果在辅助数据中收到的文件描述符的数量导致进程超过其 `RLIMIT_NOFILE` 资源限制，则多余的文件描述符将在接收进程中自动关闭。不能在多个 `recvmsg` 调用中分割列表。

> recvmsg quirks
>
> recvmsg 的怪异情况

`sendmsg` 和 `recvmsg` 的作用类似于 `send` 和 `recv` 系统调用，在每个 `send` 调用和每个 `recv` 调用之间没有1：1的映射。

一个 `recvmsg` 调用可以从多个 `sendmsg` 调用中读取数据。同样地，它可能需要多个`recvmsg`调用来消耗一个`sendmsg` 调用所发送的数据。这有严重的、令人惊讶的影响，其中一些已经在这里报告。

> Limit on the number of File Descriptions
>
> 文件描述符的数量限制

内核常量 `SCM_MAX_FD` ( 253 (或者在2.6.38之前的内核中为255))定义了数组中文件描述符的数量限制。

试图发送一个大于这个限制的数组会导致 `sendmsg` 失败，错误是 `EINVAL`。

## 什么时候发送文件描述符是有用的

一个非常具体的现实世界的使用案例是零停机时间的代理重载。

任何曾经使用过HAProxy的人都可以证明，"零停机时间的配置重载 "在很长一段时间内并不是一个真正的东西。通常，大量的[Rube Goldberg-esque](https://engineeringblog.yelp.com/2015/04/true-zero-downtime-haproxy-reloads.html) Hack 被用来实现这一目标。

在2017年底，HAProxy 1.8 支持无中断重载，通过将监听套接字文件描述符从旧的 HAProxy 进程转移到新的进程中来实现。Envoy使用 [类似的机制](https://blog.envoyproxy.io/envoy-hot-restart-1d16b14555b5) 进行热重启，文件描述符通过Unix域套接字传递。

2018年底，Cloudflare 在[博客](https://blog.cloudflare.com/know-your-scm_rights/) 中介绍了其使用的将文件描述符从nginx转移到Go TLS 1.3代理。

促使我写下这篇博文的关于Facebook如何实现零停机发布的论文，使用了与 `CMSG + SCM_RIGHTS` 相同的技巧，将活的文件描述符从将要结束的进程传递到新发布的进程。

## 总结

如果使用得当，通过Unix域套接字传输文件描述符可以被证明是非常强大的。我希望这篇文章能让你对Unix域套接字和它的功能有一个更好的理解。

## References:

+ https://www.man7.org/linux/man-pages/man7/unix.7.html
+ https://blog.cloudflare.com/know-your-scm_rights/
+ LWN.net has an interesting article on creating cycles when passing file descriptions over a Unix domain socket and implications for the fabulous new io_uring kernel API. https://lwn.net/Articles/779472/
+ The Linux Programming Interface https://learning.oreilly.com/library/view/the-linux-programming/9781593272203/
+ UNIX Network Programming: The Sockets Networking API https://learning.oreilly.com/library/view/the-sockets-networking/0131411551/
