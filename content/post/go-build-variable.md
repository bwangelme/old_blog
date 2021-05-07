---
title: "Golang 链接时注入额外信息"
date: 2021-05-07T17:04:21+08:00
lastmod: 2021-05-07T17:04:21+08:00
draft: false
tags: [Golang]
author: "bwangel"
comment: true
---

<!--more-->
> Go 编译器注入 git 版本，时间等信息到可执行文件中
---

## Go 链接时的 -X 选项

> -X importpath.name=value
> 
> Set the value of the string variable in importpath named name to value.
This is only effective if the variable is declared in the source code either uninitialized
or initialized to a constant string expression. -X will not work if the initializer makes
a function call or refers to other variables.
Note that before Go 1.5 this option took two separate arguments.
 
__链接:__ go 编译工具读取 package main 和它的依赖(是 archive 文件或对象)，将它们组合在一起生成一个可执行文件。

Go 在链接时支持 `-X` 选项，它的用法为 `-X importpath.name=value`，它将会替换 __字符串变量__ `importpath.name`的值，将其设置为`value`。


+ __注意1__: 只有在`importpath.name`未初始化或者初始化为常量字符串的时候才会生效。如果 `importpath.name` 是通过一个函数调用或者变量来初始化的话，`-X`选项将不会生效。

+ __注意2__: `value`中有空格时， -X 后面的值都要用单引号包起来，例如 `-X '${REPO_PATH}/version.BuildTimeStamp=${BuildTimeStamp} UTC'`

+ __注意3__: Go 1.5 版本以下 -X 选项的格式是 `-X importpath.name value`

## 运行效果

+ 源码: [bwangelme/build_git_version](https://github.com/bwangelme/build_git_version)

```sh
ø> ./build.sh && ./bin/runme
Git Version c530ca1
Build TimeStamp 2021-05-07_04:01:35AM UTC
Build Go Version go version go1.16 darwin/amd64
```

## 参考链接

+ [Go cmd Link](https://golang.org/cmd/link/)
+ [Golang -ldflags 的一个技巧 go version 信息注入](https://ms2008.github.io/2018/10/08/golang-build-version/)
+ [v1.5 -ldflags -X change breaks when string has a space](https://groups.google.com/forum/#!topic/golang-nuts/aNDB4FrmEiA)
