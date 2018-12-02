---
title: "Go mod 说明"
author: "bwangel"
tags: ["Go", "mod"]
date: 2018-10-11T08:44:25+08:00
draft: false
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

### Go mod 版本管理

+ __注意__: 使用 go mod 进行管理的仓库必须放置在`GOPATH`外
+ Go mod 通过 Git 的标签来标记版本 `git tag v1.0.0 && git push --tags`
+ 建议为每个主版本新建一个分支(`git checkout -b v1`)
+ `go mod init reponame`可以创建一个库
+ `go build`命令会自动分析代码中的依赖，并获取相应版本的库
+ `go get -u`将会升级依赖的副版本号或者修订号
+ `go get -u=patch`将会升级修订号，但是不会升级副版本号
+ `go get package@version`表示安装特定版本的的依赖
+ Go会将依赖写在仓库下的`go.mod`和`go.sum`文件中

### 主版本升级

+ 当仓库的主版本发生变化时，其导入路径也应该随之改变，具体就是将`go.mod`中的`github.com/user/repo`改成`github.com/user/repo/v2`

在Golang中，一个依赖可以同时存在两个主版本不同的`import`。

```go
import (
    "github.com/user/repo"
    repov2 "github.com/user/repo/v2"
)
```

故当一个仓库需要升级某个依赖的主版本时，其代码导入路径要随之改变。如果依赖的API变了，那么仓库也要进行相应的更改。

### 清除依赖

`go mod tidy`命令可以移除`go.mod`中不再使用的依赖

### Go mod 和 Vendoring

+ Go 1.12 支持使用`go mod verdor`命令将依赖安装在仓库的`vendor`目录下
+ `go build`命令会忽略掉`vendor`目录，`go build -mod vendor`命令会从当前目录的`vendor`目录下寻找依赖

### 其他说明

Go 将依赖安装在`GOPATH/pkg/mod`中，并且依赖的每个版本会分开安装

```sh
>>> tree $GOPATH/pkg/mod/github.com/bwangelme/                         08:42:57 (10-11)
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
