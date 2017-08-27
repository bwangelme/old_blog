---
title: 'NodeJS 笔记'
date: 2016-04-10 10:56:54
tags: [Node.js]
---

__摘要__:

> 1. 阮一峰的[Node.js](http://javascript.ruanyifeng.com/#toc10)教程笔记


<!--more-->

## Node.js概述

+ Node约定，如果需要某个回调函数作为参数，则回调函数是最后一个参数。
+ 回调函数本身的第一个参数，约定为上一步传入的错误对象。


## 模块化结构

+ 每个模块通过module.exports来导出对象，函数，变量等
+ 其他模块通过require函数来获取某个模块倒数的exports


## 模块的加载机制

+ CommonJS模块的加载机制是，输入是输出值的拷贝，一旦输出一个值，模块内部的变化就影响不到这个值。


## package.json文件

`scripts`字段定义通过`npm run`运行的命令
