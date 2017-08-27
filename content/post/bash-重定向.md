---
title: '说说Bash中的几个重定向'
date: 2017-08-13 14:10:48
tags: [Bash, ]
---


> 摘要:

> 1. Bash中`>` `&>` `>&`三者的区别

<!--more-->

最近看脚本的时候，发现了有的地方使用了类似`some-command &> /dev/null`这样的命令，然后不禁想起来还有一种重定向的语法是`>&`，突然就觉得有点混乱了，特来捋一捋。

#  >、&> 和 >&操作符

## 语法说明

这三个操作符的语法分别如下所示：

+ `>` Syntax: `file_descriptor(可选)>file_name`

这里的`file_descriptor`是可选的，如果没有的话，默认是1(stdout)。它的作用是将某个命令的某个输出(file_descriptor所代表的输出)重定向到一个文件，例如`find / > file`和`find / 2> file`这两个命令就分别是将stdout和stderr输出到文件`file`中去。

+ `>&` Syntax: `file_descriptor1(可选)>&file_descriptor2`

这里的`file_descriptor1`是可选的，如果没有的话，默认是1(stdout)。它的作用是将某个命令的`file_descriptor1`描述符的输出(例如1代表标准输出)重定向到此命令的描述符`file_descriptor2`中。例如`find / 1>file 2>&1 `这条命令就是将find命令的stderr(2)重定向到stdout(1)，然后再将stdout输出到文件`file`中。

+ `&>` Syntax: `&> file_name`

这种形式的重定向，在语义上等价于`>filename 2>&1`(参见[参考链接3](https://superuser.com/questions/335396/what-is-the-difference-between-and-in-bash))。例如`find / &> file`等价于`find / >file 2>&1`。

# 参考链接

1. [What does &> do in bash? [duplicate]](http://stackoverflow.com/questions/24793069/what-does-do-in-bash/24793436#24793436)
2. [I/O Redirection](http://www.tldp.org/LDP/abs/html/io-redirection.html)
3. [What is the difference between &> and >& in bash?](https://superuser.com/questions/335396/what-is-the-difference-between-and-in-bash)
