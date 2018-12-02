---
title: npm小记
date: 2016-05-06 15:10:25
tags: [Node.js]
---

__摘要__:

> 关于npm的小记，记录自己平常学习到的零碎知识点

<!--more-->

## npm ls

### 用法

```sh
    npm ls [[<@scope>]<pkg> ...]
    别名: list, la, ll
```

### 说明

+ 这条命令将会在stdout中打印出所有已经安装的包和他们的依赖包，以树形目录的形式打印出来。

+ 位置参数是`name@version-range`形式的标识符，它将会打印结果，只打印出命名包的路径中所含有的包。

+ 可以通过加上-g参数来打印全局安装的包。

## npm registry

+ npm模块仓库提供了一个查询服务，叫做registry。例如[https://registry.npmjs.org/](https://registry.npmjs.org/)

+ 在网址后面跟上模块名即可以查询相关模块的信息。例如[https://registry.npmjs.org/react](https://registry.npmjs.org/react)

+ 在模块名后面还可以跟上版本号，例如[https://registry.npmjs.org/react/v0.14.6](https://registry.npmjs.org/react/v0.14.6)

+ 返回的JSON对象里面，有一个dist.tarball属性，是该版本压缩包的地址，将该压缩包解压，即可得到相关模块的源码，npm即通过这种方式来安装模块。

## npm 缓存

+ npm的缓存目录在Linux下是$HOME/.npm

+ 可以通过`npm config get cache`获取缓存目录

+ 可以通过`npm cache ls`查看当前缓存的模块

+ 可以通过`npm cache clean`来清除缓存

+ 在`{cache}/{hostname}/{path}/.cache.json`文件中，存放了`{path}`这个模块的版本信息，以及模块最近修改时间和最新一次请求时服务器返回的ETag

+ 对于一些不关键的操作(例如`npm search`和`npm view`)，npm会先查看.cache.json里模块的最近更新时间，跟当前时间的差距，看是不是在可接受的范围内。如果是，就不再向远端服务器请求，而是直接返回.cache.json的数据
