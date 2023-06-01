---
title: "Golang Build 出错: error obtaining VCS status: exit status 128"
date: 2023-03-21T12:07:05+08:00
lastmod: 2023-03-21T12:07:05+08:00
draft: false
tags: [go, git]
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

- safe.directory 只负责一个目录，不会关心子目录中的 git 仓库
- 使用 `*` 可以让所有仓库忽略 safe.directory 的检查

```
git config --global --add safe.directory '*'
```

## go install 时遇到的相似问题

当 GOPATH 目录的 owner 是 bwangel， 使用 root 用户运行 `go install` 安装私有仓库的命令时，也会遇到相同的问题。

比较有迷惑性的是，`go install`显示的错误是 `fatal: 'origin' does not appear to be a git repository`

表面上看起来，这是下载的 git 仓库找不到 origin 这个 remote。但我们加上 `-x -v` 参数，输出一下详细的步骤，就能找到原因了。

```
root@551114e99eea:/go# go install -x -v github.private.repo/org/repo/cmd/dag@latest
# get https://github.private.repo/?go-get=1
# get https://github.private.repo/org?go-get=1
# get https://github.private.repo/org/repo/cmd?go-get=1
# get https://github.private.repo/org/repo/cmd/dag?go-get=1
# get https://github.private.repo/org/repo?go-get=1
# get https://github.private.repo/org/repo/cmd?go-get=1: 200 OK (0.103s)
# get https://github.private.repo/org/repo?go-get=1: 200 OK (0.103s)
# get https://github.private.repo/org/repo/cmd/dag?go-get=1: 200 OK (0.103s)
get "github.private.repo/org/repo/cmd": found meta tag vcs.metaImport{Prefix:"github.private.repo/org/repo", VCS:"git", RepoRoot:"https://github.private.repo/org/repo.git"} at //github.private.repo/org/repo/cmd?go-get=1
get "github.private.repo/org/repo/cmd": verifying non-authoritative meta tag
get "github.private.repo/org/repo/cmd/dag": found meta tag vcs.metaImport{Prefix:"github.private.repo/org/repo", VCS:"git", RepoRoot:"https://github.private.repo/org/repo.git"} at //github.private.repo/org/repo/cmd/dag?go-get=1
get "github.private.repo/org/repo/cmd/dag": verifying non-authoritative meta tag
# get https://github.private.repo/org/repo?go-get=1
get "github.private.repo/org/repo": found meta tag vcs.metaImport{Prefix:"github.private.repo/org/repo", VCS:"git", RepoRoot:"https://github.private.repo/org/repo.git"} at //github.private.repo/org/repo?go-get=1
mkdir -p /go/pkg/mod/cache/vcs # git3 https://github.private.repo/org/repo.git
# lock /go/pkg/mod/cache/vcs/a1b9ef7e71cba11b98501177ca2d4f9fd012c258b967f915f68ee79a228ddf92.lock# /go/pkg/mod/cache/vcs/a1b9ef7e71cba11b98501177ca2d4f9fd012c258b967f915f68ee79a228ddf92 for git3 https://github.private.repo/org/repo.git
cd /go/pkg/mod/cache/vcs/a1b9ef7e71cba11b98501177ca2d4f9fd012c258b967f915f68ee79a228ddf92; git ls-remote -q origin
0.003s # cd /go/pkg/mod/cache/vcs/a1b9ef7e71cba11b98501177ca2d4f9fd012c258b967f915f68ee79a228ddf92; git ls-remote -q origin
# get https://github.private.repo/org/repo.git
# get https://github.private.repo/org/repo?go-get=1: 200 OK (0.040s)
# get https://github.private.repo/?go-get=1: 200 OK (0.154s)
# get https://github.private.repo/org?go-get=1: 200 OK (0.276s)
# get https://github.private.repo/org/repo.git: 200 OK (0.171s)
go: github.private.repo/org/repo/cmd/dag@latest: module github.private.repo/org/repo/cmd/dag: git ls-remote -q origin in /go/pkg/mod/cache/vcs/a1b9ef7e71cba11b98501177ca2d4f9fd012c258b967f915f68ee79a228ddf92: exit status 128:
        fatal: 'origin' does not appear to be a git repository
        fatal: Could not read from remote repository.

        Please make sure you have the correct access rights
        and the repository exists.
```

在 go install 执行过程中，会首先下载仓库到 `/go/pkg/mod/cache/vcs/a1b9ef7e71cba11b98501177ca2d4f9fd012c258b967f915f68ee79a228ddf92` 目录中

然后在该目录执行 `git ls-remote -q origin` 获取 tag 列表，并得到最新的 repo tag.

因为 `safe.directory` 的检查，导致 `git ls-remote -q origin` 执行失败，git 认为 origin remote 不存在，才会显示异常 `fatal: 'origin' does not appear to be a git repository`

go install 安装 github 上的仓库时，就不会遇到上述问题，因为安装 github 的仓库是从 GOPROXY 上获取的缓存文件，不需要经过 git 来查询 tag 了，不执行 git 命令，也就不会遇到上述问题了。

## 参考链接

- [go 1.18 release note](https://tip.golang.org/doc/go1.18)
- [Git detect dubious ownership in repository](https://medium.com/@thecodinganalyst/git-detect-dubious-ownership-in-repository-e7f33037a8f)
- [解决 Golang 升级到 1.18+ 版本后在容器中构建时出现 error obtaining VCS status: exit status 128 的问题](https://idushu.com/%E8%A7%A3%E5%86%B3-golang-%E5%8D%87%E7%BA%A7%E5%88%B0-1-18-%E7%89%88%E6%9C%AC%E5%90%8E%E5%9C%A8%E5%AE%B9%E5%99%A8%E4%B8%AD%E6%9E%84%E5%BB%BA%E6%97%B6%E5%87%BA%E7%8E%B0-error-obtaining-vcs-status-exi/)
