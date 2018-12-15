---
title: Ubuntu缩小磁盘分区大小
date: 2016-07-17 16:38:06
tags: [Ubuntu, 文件系统]
---

__摘要__:

> 1. 通过resize2fs调整文件系统大小
> 2. 通过parted调整磁盘分区大小


<!--more-->

我在刚开始装系统的时候，没有考虑到以后的扩展，直接把所有的空间都给使用了，后来发现需要新的分区的时候，已经没有可用的空间了，这时候就需要将一个分区的空间给缩小，后来折腾了半天，终于成功了！下面我以虚拟机中装的Ubuntu 16.04为例子，和大家分享一下。


首先查看一下目前的磁盘分区
```bash
michale@vv2x:~$ lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda      8:0    0   32G  0 disk
├─sda1   8:1    0  190M  0 part /boot
├─sda2   8:2    0    1K  0 part
├─sda5   8:5    0  7.6G  0 part /home
├─sda6   8:6    0  487M  0 part [SWAP]
└─sda7   8:7    0 23.7G  0 part /
sr0     11:0    1 1024M  0 rom
```

这个虚拟机上只有一块硬盘sda，sda分成了5个分区，其中sda2是扩展分区，现在，我想将/home分区的大小缩小为4G，这样可以多出一部分空间来新建一个分区，那该如何做呢，且听我慢慢道来。

## 卸载/home分区

首先，我们需要以root登陆进去，用`umount /home`命令卸载/home分区。注意，此时其他用户必须已经退出了，否则就会显示/home分区是busy的，无法卸载。如果卸载时发现/home分区busy无法卸载，可以通过`lsof +d /home`命令来查看哪些进程在使用/home分区。

## 缩小/home分区的文件系统大小

第二步，通过`resize2fs`命令来缩小/home分区的__文件系统大小__。（注意：文件系统大小和磁盘分区大小是两个不同的概念。我的理解是，文件系统大小表示的是文件系统实际可用的大小，而磁盘分区大小则是文件系统所安装的磁盘分区的真实大小。通过`df -h`命令我们可以查看文件系统大小，通过`lsblk`或者`fdisk`命令可以查看磁盘分区大小。）

在这里，我将我的/home分区大小变成了4G，结果如下所示（需要注意的是，在缩小之前，首先要对文件系统进行检查）：
```bash
root@vv2x:~# e2fsck -f /dev/sda5
# 上面这条命令强制对/dev/sda5的文件系统进行了检查
e2fsck 1.42.13 (17-May-2015)
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information
/dev/sda5: 220/499968 files (3.6% non-contiguous), 69132/1999872 blocks
root@vv2x:~# resize2fs /dev/sda5 4G
resize2fs 1.42.13 (17-May-2015)
Resizing the filesystem on /dev/sda5 to 1048576 (4k) blocks.
The filesystem on /dev/sda5 is now 1048576 (4k) blocks long.

```

## 缩小/home分区的磁盘分区大小

调整好文件系统大小以后，我们就需要来调整磁盘分区大小了，这里我们通过`parted`命令中的`resizepart`命令来调整分区大小。用法如下：

```bash
(parted) help resizepart
  resizepart NUMBER END                    resize partition NUMBER

NUMBER is the partition number used by Linux.  On MS-DOS disk labels, the primary
partitions number from 1 to 4, logical partitions from 5 onwards.

END is disk location, such as 4GB or 10%.  Negative value counts from the end of the
disk.  For example, -1s specifies exactly the last sector.
```

其中NUMBER代表的是分区号，这里我们的/home分区为5，END代表的是结束的位置，我们可以用4GB来表示。（注意：__parted的分区大小计算方式和lsblk不同__，所以我们多留一些空间，防止数据丢失）

运行结果如下：

```bash
root@vv2x:~# parted /dev/sda
GNU Parted 3.2
Using /dev/sda
Welcome to GNU Parted! Type 'help' to view a list of commands.
(parted) resizepart 5 5G
Warning: Shrinking a partition can cause data loss, are you sure you want to continue?
Yes/No? Yes
(parted)
Information: You may need to update /etc/fstab.
```

## 调整/home分区的文件系统大小并重新挂载

在第三步中，为了防止数据丢失，我们多留出了一些空间。在这里我们需要相应地调整文件系统大小，让其和磁盘空间大小匹配，这里我们通过`resize2fs`命令来完成这一步。

```bash
root@vv2x:~# resize2fs /dev/sda7
# resize2fs如果没有指定大小，那么/dev/sda7的文件系统大小默认和磁盘分区大小相同
resize2fs 1.42.13 (17-May-2015)
Resizing the filesystem on /dev/sda7 to 1171295 (4k) blocks.
The filesystem on /dev/sda7 is now 1171295 (4k) blocks long.
```

最后我们重新把/home分区挂载上就可以了。

```bash
root@vv2x:~# mount -a
# 这条命令默认挂载/etc/fstab文件中所有指定的分区
root@vv2x:~# lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda      8:0    0   32G  0 disk
├─sda1   8:1    0  190M  0 part /boot
├─sda5   8:5    0  487M  0 part [SWAP]
├─sda6   8:6    0 23.7G  0 part /
└─sda7   8:7    0  4.5G  0 part /home
sr0     11:0    1 1024M  0 rom
```

## 注意

最后需要注意的是调整磁盘分区大小以后，磁盘分区的UUID可能会改变，`mount -a`命令可能会失败，此时我们需要通过`blkid`命令来查看/home分区的大小，并相应地更改`/etc/fstab`配置文件中指定的/home分区的UUID。
