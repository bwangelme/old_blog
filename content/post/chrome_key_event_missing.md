---
title: "修复 Ubuntu 中 chrome vimium-c 插件失效的问题"
date: 2022-02-24T22:20:23+08:00
lastmod: 2022-02-24T22:20:23+08:00
draft: false
tags: [ubuntu, vimium-c]
author: "bwangel"
comment: true
---

折腾 Ubuntu 的经历

<!--more-->
---

下午升级了 Ubuntu 的一些软件之后，发现 Chrome 中的 vimium-c 插件失效了，按 k 不会向上滑动，而是像按下 tab 按键一样，选中 url 链接。weasd 等字符也是一样，同时飞书中输入不了 weasd 等字符。

## 排查 vimium-c

最开始以为是 vimium-c 软件的 bug，于是去 github 中提 Issue。[#558](https://github.com/gdh1995/vimium-c/issues/558)

和作者排查了半天，使用作者提供了 [keyboard-test](https://gdh1995.cn/vimium-c/keyboard-test.html) 工具检查按键能否正常工作，最后得出的结论是，

1. 使用 firefox, chromium 等浏览器依然会遇到这个问题
2. 换一个用户后，这个问题就解决了。

由此我认定一定是我的系统配置有问题，和浏览器无关。于是开始排查系统配置

## 排查按键映射

一开始以为是 `xmodmap` 设置的问题，因为我用 `xmodmap` 改过键，将 caps-lock 改成了 Esc。

但是查了半天，发现我原来是用 `dconf` 改的，并不是用 `xmodmap`，我把 `dconf` 中的改键配置删除后，vimium-c 仍然不工作。

此时我就很无力了，用 `ls -al ~/` 和 `ls -al ~/.config` 反复看 HOME 目录下的配置文件，反复想可能是哪个配置文件导致的问题。

## 最终定位问题

后来一想，既然这个问题能够复现，燕过留痕，肯定有个进程拦截了这些按键的事件，导致 chrome 出错了。排查进程比排查配置文件范围小了很多，就开始排查进程。

于是用 `ps aufx` 查看所有进程，一个一个地排查所有的进程。

最后发现罪魁祸首是 `orca`(Ubuntu 下屏幕阅读功能的进程)，关掉 Ubuntu 阅读屏幕的辅助功能后，chrome 中就能够正常捕获这些按键的事件了。

## 参考链接

- https://github.com/gdh1995/vimium-c/issues/558
- https://manpages.ubuntu.com/manpages/bionic/man1/orca.1.html
