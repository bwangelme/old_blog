---
title: "Linux 中查看发送信号的快捷键"
date: 2022-08-09T21:43:40+08:00
lastmod: 2022-08-09T21:43:40+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

`stty`命令的作用是 `change and print terminal line settings`，查看或修改 Linux 终端的配置。

今天遇到的需求是想查一下 `Ctrl-C` 按键发送的系统信号 ( [man 7 signal](https://man7.org/linux/man-pages/man7/signal.7.html) )，搜了一下发现 stty 是最方便的查询命令

```sh
ø> stty -a
speed 38400 baud; rows 68; columns 128; line = 0;

####################  我们主要关心这两行的内容
intr = ^C; quit = ^\; erase = ^?; kill = ^U; eof = ^D; eol = <undef>; eol2 = <undef>; swtch = <undef>; start = ^Q; stop = ^S;
susp = ^Z; rprnt = ^R; werase = ^W; lnext = ^V; discard = ^O; min = 1; time = 0;
####################

-parenb -parodd -cmspar cs8 -hupcl -cstopb cread -clocal -crtscts
-ignbrk -brkint -ignpar -parmrk -inpck -istrip -inlcr -igncr icrnl -ixon -ixoff -iuclc -ixany -imaxbel -iutf8
opost -olcuc -ocrnl onlcr -onocr -onlret -ofill -ofdel nl0 cr0 tab0 bs0 vt0 ff0
isig icanon iexten echo echoe echok -echonl -noflsh -xcase -tostop -echoprt echoctl echoke -flusho -extproc
```

stty 输出的解释如下:

- `^C` (`ctrl+c`) 发送 interrupt 信号
- `^\` (`ctr+\`) 发送 quit 信号
- `^?` 清除上一个输入的字符
- `^U` 删除当前行
- `^D` 输入 EOF 字符(结束当前输入)
- `^S` 暂停输出
- `^Q` 在暂停输出后，重新开始输出
- `^Z` 发送一个 terminal stop 信号
- `^W` 删除最近输入的一个单词

```
while true;do
    date;
    sleep 1
done
```
- (我用上面的代码测试 `^S` 和 `^Q`, 发现不生效)

stty 其他输入的含义，请参考 [man 1 stty](https://linux.die.net/man/1/stty)

## 参考链接

- [List of terminal generated signals (eg Ctrl-C -> SIGINT)](https://unix.stackexchange.com/a/362579/191858)
- [man 1 stty](https://linux.die.net/man/1/stty)
