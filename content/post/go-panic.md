---
title: "Go Panic 的触发及恢复过程"
date: 2019-04-08T22:14:43+08:00
lastmod: 2019-04-08T22:14:43+08:00
draft: false
tags: [ARTS, Go]
author: "bwangel"
comment: true
toc: true

---

> + Panic 过程
> + recover 函数
> + defer 函数

<!--more-->

## Panic 过程

+ 当代码触发`panic`的时候，`panic详情`就会被初始化。随后程序的控制权从最底端的调用函数一级一级向上传递到最顶端的调用函数。
+ 到了最顶端调用函数后，控制权会被移交给 Go 语言的运行时系统，Go 语言的运行时系统打印出`panic详情`，并结束程序的运行。
+ 在控制权传递的过程中`panic详情`会被逐渐积累起来。所以最后程序输出`panic详情`的时候，会从最底端的函数一直输出到最顶端的函数。我们查看调用栈的信息的时候，应该从底部`exit status 2`这一行向上看。

## recover 函数

+ 因为`panic`发生的时候，`panic`函数后面的语句都不会执行了，所以`recover`函数不能放在`panic`语句后面执行，而要放在`defer`函数中执行。

## defer 函数

+ defer 函数的执行顺序和它的定义顺序是完全相反的
+ defer 语句每次执行的时候，Go 会把它携带的 defer 函数及其参数值存储到另一个栈中，这个栈是遵循 FILO(First Input Last Output)原则的。
+ defer 函数中也可以引发`panic`，这样可以把`recover`捕获的`panic`包装一下再抛出去。
