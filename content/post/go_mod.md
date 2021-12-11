---
title: "Go mod 说明"
author: "bwangel"
tags: ["go", "gomod"]
date: 2018-10-11T08:44:25+08:00
draft: false
aliases:
  - /2018/10/11/go-mod-说明/
---

关于 Go mod 的介绍

<!--more-->

+ [Introduction to Go Modules](https://roberto.selbach.ca/intro-to-go-modules/)
+ [Github 仓库](https://github.com/bwangelme/testmod)
+ [使用这个仓库的Demo](https://github.com/bwangelme/testmod_demo)

## 版本号的说明

+ 版本号由三个部分组成: `主版本.副版本.修订号`
+ 修订号的增加表示修复了一些BUG
+ 副版本号的增加表示修改了一些内部实现的逻辑，但是对外提供的接口没有改变
+ 主版本号的增加表示修改了对外提供的接口，主版本之间是可以不兼容的

## Go Module 模式下的核心原则

Go Module 模式是指 `GO111MODULE=on` 时:

1. 一个包的导入路径定义了该包的唯一标识。
    + 具有不同导入路径的包被视为不同的包。
    + 具有相同导入路径的包被视为相同的包（即使 VCS 标签说这些包有不同的主要版本，Go 也认为它们是同一个包）。
2. 没有 `/vN` 的导入路径被视为v1或v0模块，即使导入的包没有选择加入模块模式(无 go.mod 文件)，并且 VCS 标签显示主版本号大于1，Go 也认为其主版本号是 V0 或 V1。
3. 在一个模块的 go.mod 文件的开头所声明的模块路径（如模块foo/v2）有两层含义。
    + 对该模块身份的明确声明
    + 关于该模块该如何被消费代码导入的正确声明

## Go mod 版本管理

+ __注意__: 使用 go mod 进行管理的仓库必须放置在`GOPATH`外
+ Go mod 通过 Git 的标签来标记版本 `git tag v1.0.0 && git push --tags`
+ 建议为每个主版本新建一个分支(`git checkout -b v1`)
+ `go mod init reponame`可以创建一个库
+ `go build`命令会自动分析代码中的依赖，并获取相应版本的库
+ `go get -u`将会升级依赖的副版本号或者修订号
+ `go get -u=patch`将会升级修订号，但是不会升级副版本号
+ `go get package@version`表示安装特定版本的的依赖
+ Go会将依赖写在仓库下的`go.mod`和`go.sum`文件中

## 主版本升级

+ 当仓库的主版本发生变化时，其导入路径也应该随之改变，具体就是将`go.mod`中的`github.com/user/repo`改成`github.com/user/repo/v2`

在Golang中，一个依赖可以同时存在两个主版本不同的`import`。

```go
import (
    "github.com/user/repo"
    repov2 "github.com/user/repo/v2"
)
```

故当一个仓库需要升级某个依赖的主版本时，其代码导入路径要随之改变。如果依赖的API变了，那么仓库也要进行相应的更改。

## 清除依赖

`go mod tidy`命令可以移除`go.mod`中不再使用的依赖

## Go mod 和 Vendoring

+ Go 1.12 支持使用`go mod verdor`命令将依赖安装在仓库的`vendor`目录下
+ `go build`命令会忽略掉`vendor`目录，`go build -mod vendor`命令会从当前目录的`vendor`目录下寻找依赖

## 安装位置

Go 将依赖安装在`GOPATH/pkg/mod`中，并且依赖的每个版本会分开安装

```sh
>>> tree $GOPATH/pkg/mod/github.com/bwangelme/
/Users/michaeltsui/go/pkg/mod/github.com/bwangelme/
├── testmod
│   └── v2@v2.0.0
│       ├── README.md
│       ├── go.mod
│       └── testmod.go
├── testmod@v1.0.0
│   ├── README.md
│   ├── go.mod
│   └── testmod.go
└── testmod@v1.0.1
    ├── README.md
    ├── go.mod
    └── testmod.go
```

## 查看依赖

+ 查看当前仓库依赖的所有 module

```sh
go list -m -json all
```

+ 查看 github.com 域名下所有的 module

```
go list -m -json 'github.com/...'
```

`-m` 选项让 go list 列出所有的 module 而不是包。在这种模式下，`go list` 的参数可以是模块或模块模式(包含 `...` 通配符)，[Version Query](https://go.dev/ref/mod#version-queries)，或者特殊模式 `all`(匹配[构建列表](https://go.dev/ref/mod#glos-build-list)中的所有模块)。如果没有指定参数，[主模块](https://go.dev/ref/mod#glos-main-module)将被列出。

## 关于 incompatible 版本标签的说明

+ 被导入的包没有选择加入 module 模式，无 go.mod 文件
+ 被导入的包有语义化版本号 VCS 标签，且该标签表示的版本主版本号大于1
+ Go Module 核心原则第2点生效，导入路径中没有 `/vN`，它将被视为 v1 或 v0 模块，VCS 标签不生效

当 Go 处于 Module 模式时，它将假设一个非 module 模式的 V2+ 版本的包不理解 `语义化导入版本控制(Semantic Import Versioning)`，从而将其视为该包 V1 版本系列的不兼容扩展。`incompatible` 后缀即表示该包是一个不兼容 V1 旧版本的 V1 扩展版本。

## 版本选择

如果你在你的代码中添加了一个新的导入，而这个导入还没有被 go.mod 中的 require 指令所覆盖。
大多数go命令如 `go build` 和 `go test` 会自动查找合适的模块，并将这个新的直接依赖的最高版本作为 require 指令添加到你的模块的 go.mod 中。

例如，如果你的新导入对应的依赖 M 包的最新标签发布版本是v1.2.3，你的模块的 go.mod 中将添加指令 `require M v1.2.3`，这表明模块 M 是一个允许版本 `>= v1.2.3` 的依赖关系，并且 `< v2`，因为v2被认为与v1不兼容。

`最小版本选择算法 (Minimal Version Selection Algorithm)` 被用来选择在构建中使用的所有模块的版本。对于构建中的每个模块，通过最小版本选择算法所选择的版本总是语义上最高的版本，该版本由主模块或其依赖关系中的 require 指令明确列出。

例如，主模块依赖模块A，而模块A有一个 require D v1.0.0，主模块也依赖模块B，而模块B有一个 require D v1.1.1，那么最小版本选择算法会选择 D 的 v1.1.1 版本用来包含在构建中（因为它是列出的最高 require 版本）。
即使后来 D 的 v1.2.0 版本发布了，在构建中仍然会选择 v1.1.1。这是一个模块系统如何提供 100% 可重复构建的例子。
当准备就绪时，模块作者或用户可以选择升级到D的最新可用版本或为D选择一个明确的版本。

## 参考链接

+ https://go.dev/ref/mod
+ https://github.com/golang/go/wiki/Modules
