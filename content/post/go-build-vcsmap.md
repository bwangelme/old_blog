---
title: "Golang Build 出错: error obtaining VCS status: exit status 128"
date: 2023-03-21T12:07:05+08:00
lastmod: 2023-03-21T12:07:05+08:00
draft: false
tags: [Golang, git]
author: "bwangel"
comment: true

---

<!--more-->
---

## Go build 时遇到了 error obtaining VCS status 错误

我们的 Golang 项目都是在 docker 中 build 的，最近在 build 的时，遇到了以下的错误:

```
error obtaining VCS status: exit status 128
        Use -buildvcs=false to disable VCS stamping.
```

build golang 项目的 dockerfile 如下，我们会先把代码目录的所有者变成 bwangel, 再执行 go build:

```
FROM golang:1.18-buster

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
RUN apt-get update && apt-get -yq install sudo && rm -rf /var/lib/apt/lists/*;

RUN git clone https://github.com/bwangelme/rdcdemo.git /go/src/
RUN /usr/sbin/useradd \
        --user-group \
        --create-home \
        --uid 1001 --shell '/bin/bash' \
        bwangel && \
    chown bwangel:bwangel -R /go/src

WORKDIR /go/src/
RUN go build .
```

根据 buildvcs 这个关键字，我找到了 Go 1.18 的 [release notes](https://tip.golang.org/doc/go1.18)，其中关于 buildvcs 的描述是这样的

> The go command now embeds version control information in binaries. It includes the currently checked-out revision, commit time, and a flag indicating whether edited or untracked files are present. Version control information is embedded if the go command is invoked in a directory within a Git, Mercurial, Fossil, or Bazaar repository, and the main package and its containing main module are in the same repository. This information may be omitted using the flag -buildvcs=false.

> Additionally, the go command embeds information about the build, including build and tool tags (set with -tags), compiler, assembler, and linker flags (like -gcflags), whether cgo was enabled, and if it was, the values of the cgo environment variables (like CGO_CFLAGS). Both VCS and build information may be read together with module information using go version -m file or runtime/debug.ReadBuildInfo (for the currently running binary) or the new debug/buildinfo package.

从 1.18 开始，Golang 在执行 build 时，会将 Git Commit Revision, Commit 时间，和是否有文件 Untracked 的标记写入到二进制中，使用 `go version -m <file>` 能够查看这些信息。

例如下面的代码中我们查看了 rdcdemo 文件的信息，可以看到执行 build 时 git commit revision 是 `8157a03bdfd846437cd0acdc1a7391ad9a13f6b3`, 这个 Commit 的创建时间是 `2021-09-26`, `vcs.modified=true` 表示有修改尚未提交到 git 中。

```shell
ø> go version -m rdcdemo
rdcdemo: go1.18.9
        path    rdcdemo
        mod     rdcdemo (devel)
        dep     github.com/cespare/xxhash/v2    v2.1.1  h1:6MnRN8NT7+YBpUIWxHtefFZOKTAPgGjpQSxqLNn0+qY=
        dep     github.com/dgryski/go-rendezvous        v0.0.0-20200823014737-9f7001d12a5f      h1:lO4WD4F/rVNCu3HqELle0jiPLLBs70cWOduZpkS1E78=
        dep     github.com/go-redis/redis/v8    v8.11.3 h1:GCjoYp8c+yQTJfc0n69iwSiHjvuAdruxl7elnZCxgt8=
        build   -compiler=gc
        build   CGO_ENABLED=1
        build   CGO_CFLAGS=
        build   CGO_CPPFLAGS=
        build   CGO_CXXFLAGS=
        build   CGO_LDFLAGS=
        build   GOARCH=amd64
        build   GOOS=linux
        build   GOAMD64=v1
        build   vcs=git
        build   vcs.revision=8157a03bdfd846437cd0acdc1a7391ad9a13f6b3
        build   vcs.time=2021-09-26T11:45:50Z
        build   vcs.modified=true
```

在 build 时加上 `-buildvcs=false` 可以不添加这些信息。

## 获取 vcs 信息的时候为什么会出错

报错 `error obtaining VCS status` 表示 Golang 获取 vcs 信息时出错了，但我还想往下深究一下，具体出了什么错误。此时就可以给 go build 加上 `-x -v` 选项，这样 go build 就会输出每一步执行的操作:

修改上述 dockerfile, 添加 build 选项 `-x -v`

```
FROM golang:1.18-buster

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
RUN apt-get update && apt-get -yq install sudo && rm -rf /var/lib/apt/lists/*;

RUN git clone https://github.com/bwangelme/rdcdemo.git /go/src/
RUN /usr/sbin/useradd \
        --user-group \
        --create-home \
        --uid 1001 --shell '/bin/bash' \
        bwangel && \
    chown bwangel:bwangel -R /go/src

WORKDIR /go/src/
RUN go build -x -v .
```

此时出错信息变多了，可以看到，是 Go build 在执行 `git status --porcelain` 的时候出错了，错误信息是 `detected dubious ownership in repository`

```
WORK=/tmp/go-build975996823
cd /go/src
git status --porcelain
# cd /go/src; git status --porcelain
fatal: detected dubious ownership in repository at '/go/src'
To add an exception for this directory, call:

        git config --global --add safe.directory /go/src
error obtaining VCS status: exit status 128
        Use -buildvcs=false to disable VCS stamping.
```

## Git 为什么要检查 .git 目录的 owner

根据关键字 `detected dubious ownership in repository`, 我找到了一篇文章: [Git detect dubious ownership in repository](https://medium.com/@thecodinganalyst/git-detect-dubious-ownership-in-repository-e7f33037a8f)

这篇文章说，Git 命令在执行时，会执行 `.git/` 目录中的文件，如果 `.git/` 目录中的文件被恶意篡改了，那么就会造成安全漏洞。

例如 `/go/src` 这个目录是 bwangel 用户所有的，它修改了 `/go/src/.git/` 中的文件，添加了一个窃取信息的木马。root 用户在 `/go/src` 中执行 git status 时，就会以 root 用户执行这个木马，造成信息泄漏。

所以 Git 在 [895955](https://github.com/git/git/commit/8959555cee7ec045958f9b6dd62e541affb7e7d9) 中添加了安全检查，确保执行 git 命令的用户和 `.git/` 目录的 owner 是同一个人。

如果用户信任某个目录，不想添加这种检查，可以修改配置 `safe.directory`

```
git config --global --add safe.directory /some/repo
```

那么在 `/some/repo` 中执行 git 命令时，就不会检查文件 owner 了。


## 解决 docker build 失败的方案

### 添加 -buildvcs=false 选项

修改 build 命令，加上 `-buildvcs=false` 选项，这样 go 不会收集 vcs 信息，也就不会遇到 git 的错误了

```
RUN go build -buildvcs=false .
```

### 修改执行 go build 的用户

修改执行 build 命令的用户，这样也可以 build 成功

```
FROM golang:1.18-buster

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
RUN apt-get update && apt-get -yq install sudo && rm -rf /var/lib/apt/lists/*;

RUN git clone https://github.com/bwangelme/rdcdemo.git /go/src/
RUN /usr/sbin/useradd \
        --user-group \
        --create-home \
        --uid 1001 --shell '/bin/bash' \
        bwangel && \
    chown bwangel:bwangel -R /go/src

WORKDIR /go/src/
RUN su - bwangel bash -c "cd /go/src; /usr/local/go/bin/go env; /usr/local/go/bin/go build -v ."
```

### Git 中添加 safe directory 的配置

将代码所在目录 `/go/src` 设置成 `safe.directory`, 这样 git 执行时就不会出错了，也可以 build 成功。

```
FROM golang:1.18-buster

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
RUN apt-get update && apt-get -yq install sudo && rm -rf /var/lib/apt/lists/*;

RUN git clone https://github.com/bwangelme/rdcdemo.git /go/src/
RUN /usr/sbin/useradd \
        --user-group \
        --create-home \
        --uid 1001 --shell '/bin/bash' \
        bwangel && \
    chown bwangel:bwangel -R /go/src

WORKDIR /go/src/
RUN git config --global --add safe.directory /go/src
RUN go build .
```
