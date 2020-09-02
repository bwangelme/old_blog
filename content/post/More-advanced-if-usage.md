---
title: "More advanced if usage"
date: 2016-10-03 09:52:51
tags: [翻译, Bash]
draft: false
---

__摘要__:

> 1. 本文是对[More advanced if usage](http://tldp.org/LDP/Bash-Beginners-Guide/html/sect_07_02.html)的翻译
> 2. 主要讲述了 Bash 中 if 的一些高级用法

<!--more-->

## if/then/else 结构体

### 虚构的例子

这是一个结构体，在 if 运行结果为真的时候执行一个动作过程，如果 if 运行结果为假则执行另外一个动作过程。下面是一个例子:


```sh
freddy scripts> gender="male"
freddy scripts> if [[ "$gender" == "f*" ]]
More input> then echo "Pleasure to meet you, Madame."
More input> else echo "How come the lady hasn't got a drink yet?"
More input> fi
How come the lady hasn't got a drink yet?
freddy scripts>
```

> __注意__:
> 和 *[* 相反，*[[* 阻止变量值的单词分割。所以，如果`VAR="var with spaces"`，你不需要在 test 的过程中在`$VAR`周围使用双引号 - 即使使用引号仍然是一个好习惯。 *[[* 阻止了文件路径名的扩展，所以如果一个文件字符串中含有通配符的话，它不会去扩展成文件名。使用*[[*，*==* 和 *!=* 会将右边的值解释为 shell 的 [glob](http://tldp.org/LDP/GNU-Linux-Tools-Summary/html/x11655.htm) 模式，而不是左边的值。例如：`[[ "value" == val* ]]`

就像下面 then 语句块中列出的连续命令列表一样，else 语句块中可替换的连续命令列表能够拥有任何 Unix 风格的命令来返回一个退出状态。

另一个例子，从 [ Section 7.1.2.1](http://tldp.org/LDP/Bash-Beginners-Guide/html/sect_07_01.html#sect_07_01_02_01) 扩展而来：

```sh
anny ~> su -
Password:
[root@elegance root]# if ! grep ^$USER /etc/passwd 1> /dev/null
> then echo "your user account is not managed locally"
> else echo "your account is managed from the local /etc/passwd file"
> fi
your account is managed from the local /etc/passwd file
[root@elegance root]#
```

我们切换到 root 账户去演示 else 语句的效果 - 你的 root 通常是一个本地账户，而你自己的账户可能通过一个中央系统来管理，就比如一个 LDAP 服务器。
