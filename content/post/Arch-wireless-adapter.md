---
title: 【非技术】 Arch 下的无线自动断开
date: 2016-12-18 14:13:44
tags: [Arch, 折腾]
---

__摘要__:

> 1. 折腾 ThinkPad E430 在 Arch WiFi 自动断开的问题
> 2. 无线网卡型号推荐

<!--more-->

## 问题描述

首先说明，这个问题我最终还是没有解决，最后的办法就是去上网买了一块无线网卡，所以我在标题上写上非技术的字样，表明这篇文章技术含量并不大。

先说我的硬件环境吧，电脑是 ThinkPad E430，无线网卡的芯片型号是瑞昱的RTL8188CE，系统内核版本是4.8.13。

出现的问题就是无线连上一段时间以后，网络会自动断开，ping 不通任何网站。而系统却还显示网络已经连接，`ip address` 命令也能够看到无线网卡的IP地址。

## 尝试的解决方案

### 方案1：更改`/etc/ppp/options`配置文件

遇到问题当然要先谷歌啦，首先我以`arch wifi auto disconnect`关键字来搜索，结果搜到了很多相关度不大的页面，后来又以`thinkpad e430 wifi auto disconnect`关键字来搜索，就搜索到了[开源中国社区上的一个问题](https://www.oschina.net/question/571626_234750)，额，前两个回答看起来还是让人很不爽的，不禁让我想起来教主的这条[微博](http://weibo.com/1401527553/EirySEJV9?type=comment)，然后果断举报了。

接着我在下面看到有人回答说可以更改`/etc/ppp/options`文件中的一个配置项，我就照着去更改了，重启后发现该 WiFi 依旧抽风，方案1失败。

### 方案2：更改`rtl8192ce`内核模块的选项

后来我一想，是不是因为我的搜索关键字范围太广了，就把关键字搞得更精确一点。我就去以`RTL8188CE linux disconnect`和`RTL8188CE linux disconnect`着两个关键字去搜索，果然一下子发现了有价值的内容。

首先找到了是这个帖子：[【SOLVED】 wifi connection problems Realtek RTL8188CE](https://forums.linuxmint.com/viewtopic.php?t=194086)。发现这个帖子的时候，我感觉特别兴奋的，因为这位网友描述的问题，和我的几乎一模一样，它的网卡型号也和我的一模一样。
然后照着下面的回复，给`rtl8192ce`模块添加了`fwlps=0 ips=0`这两个参数，重启后发现依然跪，好吧，真是大坑。后来又去尝试编译这篇帖子中提到了`backports-20150313.tar.xz`程序，直接出现了语法错误，好吧，果断放弃了。

后来有搜索到了Arch论坛上有人讨论相关的问题，然后我就照着论坛里面人们的讨论，稀里糊涂地发现了 ThinkPad E430 在 Arch 上的 [Wiki页面](https://wiki.archlinux.org/index.php/Lenovo_ThinkPad_Edge_E430#Wireless)。Wiki 中就提到了无线网络的问题，然后它给出的答案也是更改`RTL8188CE`这个内核模块的参数，不过是只需要添加一个`fwlps=0`就好了，如果不行的话，直接去买一块 Intel Centrino wlan/bluetooth 4.0 卡吧。
我照着这个方案试了一下，果断不行，WiFi 依然跪，方案2也失败了。

### 方案3：求助于 ArchLinux 的邮件列表

到此时，我已经感觉到山穷水尽了，好像真的没有办法了，于是乎就去 ArchLinux 邮件列表上发了一个[求助帖](https://groups.google.com/forum/#!topic/archlinux-cn/UgGVBn99UOs)：一方面想看看还能不能找到解决办法，另一方面想请教一下如果要再买一个无线网卡的话，该买什么型号的？

## 原因分析

最后，在邮件列表中，大家分析过后，认为很有可能网卡驱动有问题。

因为在网络实际上已经断开的情况下，内核依然没有收到网络断开的消息，依然认为网络是连接着的。这种情况下可能的原因是：

1. 内核有 BUG 导致驱动报告的事件没有反应到其他部分。
2. 驱动有 BUG 没有正确地将网络断开事件报告给内核。
3. 驱动有 BUG 在网络已经断开的情况下没有报告网络已经断开这个事件。

而一般看来，驱动是故障的高发区。

后来我又用 Wireshark 抓了一下包，发现当WiFI自动断开后，有大量的 ARP 请求，此时应该就是因为驱动有问题导致网卡罢工了，内核让它发的包发布出去，它也接受不到任何的包。

## 网卡推荐

至此，看来这个驱动问题我是没法解决了，只好去重新买一块无线网卡，为了一个操作系统花上几十块钱买块网卡，虽说听起来很2，但是自己觉得还是很划算的。

目前无线网卡的芯片主要有这么几种：

+ Ralink(雷凌，台湾)

> Ralink Technology公司成立于2001年，总部位于台湾新竹，并在美国加州Cupertino设有研发中心。目前已知的Edimax、Tenda、ASUS及D-link都有采用Ralink的产品。

+ oroadcomd(博通，美国)

> Broadcom芯片是最成熟、最稳定的一种，而且还可以使用DD-WRT这种第三方开源固件改善性能，增加功能。

+ Atheros(创锐讯，美国)

> Atheros 在1999年由斯坦福大学的Teresa Meng博士和斯坦福大学校长，MIPS创始人John Hennessy博士共同在硅谷创办。Atheros的芯片被各大厂商所广泛采用，Netgear、D-Link、Intel等厂商均为Atheros客户。

+ Realtek(瑞昱，台湾)

> 瑞昱半导体于1987年在台湾的新竹科学园区成立，我的电脑的无线网卡芯片就是这个牌子的。

总的来说，无论是抓包，开热点还是兼容性(不仅针对 Linux)，Atheros 的 AR9271 都是比较合适的。据同事说，使用下来最稳定的 USB 网卡就是网件的 WNA1100，某宝上二手的洋垃圾也就十几块钱。

## 写在最后

最终我还是去某宝上买了一块 USB 无线网卡。再此，要感谢邮件列表中的热心群众，感谢他们能够帮我解决问题和推荐网卡，我从中也学到了很多。

最后附上我在解决问题的过程中参考到的页面：

+ [ubuntu14.04 wifi频繁掉线](https://www.oschina.net/question/571626_234750)
+ [【SOLVED】wifi connection problems Realtek RTL8188CE](https://forums.linuxmint.com/viewtopic.php?t=194086)
+ [Lenovo ThinkPad Edge E430 - Arch Wiki](https://wiki.archlinux.org/index.php/Lenovo_ThinkPad_Edge_E430#Wireless)
+ [没错，你没有看错，这是一个淘宝页面，我参考了它的宝贝详情](https://item.taobao.com/item.htm?spm=a230r.1.14.62.DbhWkt&id=538494346626&ns=1&abbucket=19#detail)
+ [ArchLinux 的邮件列表](https://groups.google.com/forum/#!topic/archlinux-cn/UgGVBn99UOs)
