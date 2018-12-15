---
title: Git-submodule
date: 2016-04-11 07:18:43
tags: [Git]
---

__摘要__:

> + `git submodule`就是git主仓库在本仓库的配置中记录着子模块仓库对应的名字，路径，远端url，然后创建一个特殊文件去记录子模块仓库目前的`commit-id`，每次更新子模块就是通过远端路径和`commit-id`来进行更新

<!--more-->
## 参考文章
[Git Submodule使用完整教程 - 咖啡兔 - HenryYan](http://www.kafeitu.me/git/2012/03/27/git-submodule.html)

## Git 子模块的原理

在`.git/config`和`.gitmodules`中记录的子模块仓库的远端地址和路径，然后使用一个特殊的模式为`160000`的文件来记录子模块仓库当前的`commit id`

## Git 子模块的添加

```sh
git submodule add origin:/submd/repos/lib2.git libs/lib2 # 添加远端origin上的仓库lib2到当前仓库的libs/lib2位置
```

## Git 子模块的初始化及更新

`git submodule init`会初始化当前仓库中存在的子模块(根据.gitmodules文件去查找子模块)。

`git submodule update`就是更新当前仓库存在子模块，拉取最新代码。

`git submodule update`是根据父仓库中记录的子模块仓库的`commit-id`去更新子模块仓库，如果子模块仓库commit了但是父仓库并没有`add`，那么`git submodule update`会还原子模块仓库的提交。

`git submodule foreach <command>` 进入到每个子模块，然后执行`<command>`命令

## Git 子模块的移除

执行以下命令删除 Git 子模块，相关内容请参考[Stack Overflow](http://stackoverflow.com/questions/1260748/how-do-i-remove-a-submodule/21211232#21211232)。

```sh
git rm the_submodule
rm -rf .git/modules/the_submodule
```
