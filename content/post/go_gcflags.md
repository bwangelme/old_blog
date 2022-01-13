---
title: "Go gcflags/ldflags 的说明"
date: 2022-01-12T17:56:10+08:00
lastmod: 2022-01-12T17:56:10+08:00
draft: false
tags: [dlv, go]
author: "bwangel"
comment: true
---

Go 链接选项和编译选项的说明

<!--more-->

---

## 编译选项

go build 时可以使用 `-gcflags` 指定编译选项，gcflags 参数的格式是

```
pattern=arg list
```

### pattern

pattern 是选择包的模式，它可以有以下几种定义:

- `main`: 表示 main 函数所在的顶级包路径
- `all`: 表示 GOPATH 中的所有包。如果在 modules 模式下，则表示主模块和它所有的依赖，包括 test 文件的依赖
- `std`: 表示 Go 标准库中的所有包
- `...`: `...` 是一个通配符，可以匹配任意字符串(包括空字符串)。例如:
    - 例如: `net/...` 表示 net 模块和它的所有子模块
    - `./...` 表示当前主模块和所有子模块
    - __注意:__ 如果 pattern 中包含了 `/` 和 `...`，那么就不会匹配 `vendor` 目录
        - 例如: `./...` 不会匹配 `./vendor` 目录。可以使用 `./vendor/...` 匹配 vendor 目录和它的子模块

更多的模式的说明请参考 `go help packages`

### arg list

arg list 是空格分割的编译选项，如果编译选项中含有空格，可以使用引号包起来

下面介绍几种常用的编译选项:

- `-N`: 禁止编译器优化
- `-l`: 关闭内联 (inline)
- `-c int`: 编译过程中的并发数，默认是1

更多编译选项请参考 `go tool compile --help`

## 链接选项

`-ldflags` 可以设置链接选项

- `-w` 不生成 DWARF 调试信息
- `-s` 关闭符号表

`-w` 和 `-s` 通常一起使用，用来减少可执行文件的体积。但删除了调试信息后，可执行文件将无法使用 gdb/dlv 调试

```shell
ø> go build -ldflags="-w -s" ./abc.go
ø> dlv exec ./abc
could not launch process: could not open debug info
```

注意： 使用 `go run main.go` 运行的进程，也无法用 `dlv attach ${pid}` 调试，因为找不到代码的符号信息。

## 参考链接

- `go help packages`
- `go tool compile --help`
- `go help build`
- https://studygolang.com/articles/22803
- https://javasgl.github.io/go-build-args/
- https://github.com/go-delve/delve/issues/1698
