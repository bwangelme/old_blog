---
title: "[未完成]Promise and Asynchronous Programming"
tags: [JavaScript, Promise]
---

__摘要__:
> 1. 本文翻译自 [Promises and Asynchronous Programming](https://github.com/nzakas/understandinges6/blob/master/manuscript/11-Promises.md#returning-promises-in-promise-chains)
> 2. 主要讲述了 JavaScript 的 Promise

<!-- more -->

## Promise和异步编程

JavaScript 最有影响的一个方面就是能够简单地处理异步编程的机制。作为一门诞生在 Web 上面的语言，JavaScript 从一开始就需要能够对异步的用户交互做出响应(例如点击和键盘按键)。Node.js 通过使用回调函数来替换事件，进一步在 JavaScript 中推广了异步编程。由于越来越多的程序员开始使用异步编程，事件和回调不再能够强有力地支持开发者们去做任何他们想做的事情。Promise 的出现正是为了解决这一问题。

Promise 是异步编程的另外一种选择，它们的功能就和其他语言中的 futures 和 deferreds 一样。一个 Promise 指定随后将要被执行的一些代码(伴随着事件和回调)。同时，它也能精确地表示一段代码在执行时的是失败还是成功。你可以基于成功或者失败状态将 Promise 链在一起，从而使你的代码更容易理解和调试。

然而，为了能够去更好地理解 Promise 是如何工作的，去理解一些 Promise 相关的基础概念就是个很重要的任务啦。

## 异步编程背景

JavaScript 引擎建立在单线程事件循环的概念上。单线程意味着在某一时刻只有一段代码被执行。对比其他语言(例如 Java 或者 C++ )，其线程机制允许在同一时刻能够运行多段代码。维持，保护，改变一个能被多个线程访问的状态是一个困难的问题，而基于线程的软件也是一个常见的 BUG 来源。

JavaScript 引擎能够在同一时刻仅运行一段代码，所以它需要保持那些“运行”(看起来像是在运行着的)着的代码的执行环境。代码被保存在一个`job`队列中。当一段代码准备去被执行的时候，它就被添加到了`job`队列中，当 JavaScript 引擎执行完这段代码以后，事件循环就去执行`job`队列中的下一段代码。事件循环是 JavaScript 引擎内部的一个过程，用来监控代码的执行和管理`job`队列。请记住那是一个队列，`job`队列中的任务被从队列的首部个一个一个地执行到队列的尾部。

### 事件模型
