---
title: "【流水账】利用闲置笔记本搭建自己的开发服务器"
date: 2017-03-27 16:41:36
tags: [Ubuntu, DNS, 折腾]
---

1. 对Ubuntu服务器进行基础配置
2. 配置dnsmasq服务器
3. 文章没什么技术含量，主要记录一些配置文件的位置
<!--more-->

## 前言

最近新入手了一台MacBook Air，原来的ThinkPad就闲置下来了，感觉一直放着太浪费了，就重装了一个Ubuntu Server 16.04的系统，用来做自己的开发服务器。折腾了几个小时，就都搞定了，特意写下这篇文章，来记录一下自己折腾的过程。

## 基础配置

服务器安装的过程就不说了，大都是那么几步。有一个奇怪的问题就是安装的时候，需要设置时区，我竟然没有找到东八区，只好先设置了一个太平洋时区，好尴尬，不知道是不是Ubuntu的文本安装界面没有东八区这个选项，还是我英文太差了，没有找到。

### 设置时间

由于安装时我们设置了错误的时区，所以首先需要调整一下时区。Ubuntu 16.04已经完全集成了Systemd，所以我们只需要通过`sudo timedatectl set-timezone Asia/Shanghai`命令，就可以将时区设置为亚洲/上海了，同时我们也可以运行`sudo timedatectl set-ntp 1`命令，打开自动从 NTP 服务器同步时间，一会之后服务器时间就正常了。`timedatectl`命令还有一个选项是`set-local-rtc`，用来将硬件时间设置为本地时间，而不是UTC时间，这个选项我默认是关闭的。

### 更改软件源为中科大源

接下来，就是更改源了，打开`/etc/apt/sources.list`文件，将所有的`us.archive.ubuntu.com`替换成`mirrors.ustc.edu.cn`就可以了，注意这里由于我安装的时候选择的是美国的源，所以域名为`us.archive.ubuntu.com`，如果选择了其他地方的源，域名可能不一样。

同时要注意，`security.ubuntu.com`这个源表示的是 Ubuntu 进行安全更新的源，用来推送紧急安全更新的补丁，这个源我建议保持原样，因为紧急安全更新的补丁还是从 Ubuntu 官方下载比较好，不建议从其他地方来下载。

### 设置关闭盖子不休眠

由于我的电脑是笔记本，尽管没有装图形界面，但是在合上盖子之后，系统仍然会自动休眠，所以需要将这个自动休眠的功能关掉。我在网上搜索了一下，在 Askubuntu 上找到了一个相关的[问题](http://askubuntu.com/questions/141866/keep-ubuntu-server-running-on-a-laptop-with-the-lid-closed)，按照问题中的答案所说，向`/etc/systemd/logind.conf`文件中添加一行`HandleLidSwitch=ignore`，然后重启`systemd-logind.service`服务，就关闭掉这个功能啦。

## 配置网络环境

将服务器配置好以后，接下来我们就需要配置网络了。

### 设置DHCP

我的笔记本是通过网线连接到路由器上的，所以，首先我们需要将有线网卡通过 DHCP 自动连接网络的功能打开。这里我在网上搜索了一下，搜到了一篇文章：[Ubuntu Networking Configuration Using Command Line ](http://www.ubuntugeek.com/ubuntu-networking-configuration-using-command-line.html)。这篇文章很详细地介绍了Ubuntu如何设置动态IP和静态IP。我的电脑在刚装好系统的时候，没有任何关于有线网卡的配置文件，仅能够通过`ip addr`命令来看到当前系统的网卡，在了解到有线网卡的名称为`enp12s0`之后，我新建了一个文件`/etc/network/interfaces.d/enp12s0.conf`，然后向其中添加了如下的内容，

```
# 设置网卡enp12s0在开机的时候通过 DHCP 自动连接到网络。
auto enp12s0
iface enp12s0 inet dhcp
```

上面两句配置就表示设置网卡enp12s0在开机的时候通过 DHCP 自动连接到网络。

### 设置默认网关

设置好网卡的 DHCP 以后，我的服务器能够 ping 通路由器网关了，但是仍然无法 ping 通外网，显然，这是由于服务器本机的网关没有配置好，后来我又上网去搜索，发现了[Askubuntu 上一个类似的问题](http://askubuntu.com/questions/522420/how-to-get-default-gateway-with-a-dhcp)，其中有个答案提到，`dhclient`只在当前服务器没有设置默认网关的时候，才会设置由 DHCP 服务器提供的路由器地址为默认网关。我通过`ip route`看了一下我的服务器的路由表，发现默认网关为网卡`lo`，所以 DHCP 服务器下发下来的网关地址并不会生效。我又在`/etc/network/interfaces`中添加了如下的配置：`post-up route del default dev lo`，删除掉默认走`lo`设备的路由配置。

然后我再来重启电脑，就发现服务器一开机就能够正常 ping 通外网了。

### 设置路由器

看到这里，相信大家肯定都有一些疑惑，服务器不应该是默认设置为静态IP吗，为什么你要配置 DHCP 呢。原因就在这一小节，我用的路由器是华硕的RT - N12，它的 DHCP 服务器有一个功能，就是将MAC地址和IP地址进行绑定，所以，我只需要在路由器上配置好MAC地址和IP地址的绑定，这样就相当于起到了静态IP的作用了，而且更改起来也比较方便，不需要服务器和路由器两头改。

## 配置DNS

由于我访问我的服务器的时候想通过域名来访问(方便以后添加HTTPS证书)，所以我需要在我的内网中自己搭建一个DNS服务器，来负责服务器的域名解析。

### 安装并设置dnsmasq

由于我的需求很简单，只需要进行一个域名解析就可以了，所以我选择了[dnsmasq](http://www.thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html)，而不是比较复杂的bind9。

`dnsmasq`在Ubuntu的源中直接有deb安装包，所以我们直接通过`sudo apt install dnsmasq`命令安装即可。

`dnsmasq`的配置我参考了文章[使用Dnsmasq搭建内网DNS服务器](http://cjting.me/misc/2016-08-20-%E4%BD%BF%E7%94%A8Dnsmasq%E6%90%AD%E5%BB%BA%E5%86%85%E7%BD%91DNS%E6%9C%8D%E5%8A%A1%E5%99%A8.html)。使用了如下的配置：

```
# 设置服务器的监听地址为192.168.X.X和127.0.0.1
listen-address=192.168.X.X,127.0.0.1
# 所有没有.号的域名(plain names)都不会向上游DNS Server转发，只查询hosts文件
domain-needed
# 所有保留IP地址段内的反向查询都不会向上游DNS Server转发，只查询hosts文件
bogus-priv
# 不要读取/etc/resolver中的DNS Server的配置
no-resolv
# 不要poll /etc/resolver文件的更新
no-poll
# 配置上游服务器为DNSPod的公共DNS
server=119.29.29.29
server=182.254.116.116
```

配置好了以后，我们可以通过`dnsmasq --test`命令来检查`dnsmasq`的配置文件语法是否正确。

然后我们在服务器的`/etc/hosts`中添加我们想要设置的解析记录，比如这台服务器我设置了如下的记录：

```
192.168.X.X dev.bwangel.me
```

然后通过`sudo systemctl enable dnsmasq && sudo systemctl restart dnsmasq`命令启动`dnsmasq`服务即可。

最后我们可以通过`dig`命令测试一下，运行如下命令: `dig dev.bwangel.me @localhost`，看返回的IP地址是否和我们设置的解析记录相同。

### 设置路由器

配置好了DNS服务器以后，我们再来修改路由器的 DHCP 策略，设置下发的DNS服务器IP地址为我们的DNS服务器地址，这样内网中所有的DNS查询都会先经过这台DNS服务器。而我们的`dev.bwangel.me`域名也就能够成功解析了。至此，我们的开发服务器就已经搭建好了，我们可以通过SSH连接上来，搭建我们想要的服务了。

## 遇到的一些小坑

### dnsmasq没有绑定本地地址

配置好了 DNS 服务器以后，我在服务器上 ping 百度的时候会一直卡着，但是 ping 公网 IP 却是可以 ping 通的，当时我第一反应就是DNS解析出错了，只是不知道是DNS服务器配置的有问题，还是DNS服务器的IP地址路由器没有正确地下发下来。

接着我就利用dig来测试，发现使用`dig www.baidu.com @192.168.X.X`命令可以得到正常结果，而`dig www.baidu.com @127.0.0.1`就会卡着。然后我就觉得应该是dnsmasq没有监听`127.0.0.1`导致的问题。最后发现服务器DNS的配置文件`/etc/resolv.conf`中设置的默认DNS为`127.0.0.1`，而它去查询`127.0.0.1`的时候会卡着，也不报错，导致服务器不会使用备选的DNS服务器来查询域名，最终导致出现了 ping 百度卡着这种情况。我将dnsmasq的监听地址加上`127.0.0.1`之后就OK了。

这里还有一点没有搞清楚，路由器的 DHCP 中配置的DNS服务器并没有正确地应用，服务器还是默认遵循`/etc/resolv.conf`文件中的配置，这个还需要进一步了解一下。

### ssh出现locale报错

这个问题经常遇到了，在Mac上通过SSH连接到Ubuntu上之后，在安装更新的过程中，出现了如下的报错：

```
perl: warning: Setting locale failed.
perl: warning: Please check that your locale settings:
    LANGUAGE = (unset),
    LC_ALL = (unset),
    LC_MESSAGES = "zh_CN.UTF-8",
    LANG = "zh_CN.UTF-8"
    are supported and installed on your system.
perl: warning: Falling back to the standard locale ("C").
```

这是由于终端SSH的时候，会将本地的locale配置传到服务端上去，我的本地设置的语系是`zh_CN.UTF-8`，但是服务器上只安装了`en_US.UTF-8`，所以就会报错提示说找不到语系`zh_CN.UTF-8`相关的文件。这里我们只需要修改一下服务器的`/etc/locale.gen`配置文件，将`zh_CN.UTF-8`相关的配置取消注释，然后再来运行`locale-gen`命令，就会安装上`zh_CN.UTF-8`语系相关的文件了，再来运行`perl`程序就不会报错了。
