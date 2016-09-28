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

JavaScript 引擎能够在同一时刻仅运行一段代码，所以它需要保持那些“运行”(看起来像是在运行着的)着的代码的执行环境。代码被保存在一个 *job* 队列中。当一段代码准备去被执行的时候，它就被添加到了 *job* 队列中，当 JavaScript 引擎执行完这段代码以后，事件循环就去执行 *job* 队列中的下一段代码。事件循环是 JavaScript 引擎内部的一个过程，用来监控代码的执行和管理 *job* 队列。请记住那是一个队列， *job* 队列中的任务被从队列的首部个一个一个地执行到队列的尾部。

### 事件模型

当用户点击一个按钮，或者在键盘上按下一个按键的时候，一个像`onclick`的事件就被触发了。这个事件可能通过在任务队列的尾部添加一个新任务的方式来对交互做出响应。这是 Javascript 中异步编程最基础的形式。事件处理器的代码直到事件触发才会执行，当它执行的时候，它有一个合适的上下文环境。例如下面的例子：

```js
let button = document.getElementById("my-btn");
button.onclick = function(event) {
    console.log("Clicked")
};
```

在上面的代码中，`console.log("Clicked")`直到`button`被点击的时候才会执行。当`button`被点击了之后，赋值给`onclick`的函数将会被添加到工作队列的尾部，当它前面工作都被执行完了以后，它就会被执行。

对于简单的交互事件工作地很好，但是链接对个分离的异步回调在一起就会变得更复杂一些，因为你必须对每个事件保持事件目标的追踪(前一个例子中的`button`)。此外，你还要确保在事件发生之前所有合适的事件处理器已经被正确地添加。例如，如果`button`在`onclick`被赋值之前就被点击了，那么将不会发生任何事情。所有尽管事件对于响应用户交互和一些相似的罕见功能是有用的，但是对于更复杂的需求就不是那么灵活了。

### 回调模式

当 Node.js 创建的时候，它通过推广编程的回调模式来推进异步编程模型。回调模式和事件模型很相似，因为异步代码不会立刻执行直到稍后的事件点才会执行。有点不同的是它传递给回调一个函数来作为参数，如下所示：

```js
readFile("example.txt", function(err, contents) {
    if(err) {
        throw err;
    }

    console.log(contents);
});
console.log("Hi!")
```

这里例子使用了传统的 Node.js *error-first* 的回调风格。`readFile` 函数想要从磁盘上的文件(由第一个参数指定)读取内容并且当读取完成以后执行一个回调函数(第二个参数)。如果这里出现一个异常的话，回调函数的`err`参数将会是一个 error 对象；`content`参数作为一个字符串包含了文件的内容。

使用回调模式的时候，`readFile()`立刻开始执行，而且会在从磁盘开始读文件的时候暂停。那意味着`console.log("Hi!")`会在`readFile()`被调用之后，在`console.log(content)`打印任何东西之前立刻输出。当`readFile()`结束的时候，它会把回调函数和它的参数作为一个任务添加到任务队列尾部。在它前面所有工作完成了以后，这个工作就会被去执行。

回调模式比起事件模式来更灵活，因为通过回调将多个调用链接在一起更容易一些。例如下面的例子：

```js
readFile("example.txt", function(err, contents){
    if(err) {
        throw err;
    }

    writeFile("example.txt", function(err) {
        if(err) {
            throw err;
        }

        console.log("File was written")
    });
});
```

在上面的代码中，`readFile()`的一个成功回调引起了另外一个异步回调，这次是对于`writeFile()`函数。注意两个函数都有同样的基础的错误检查模式。当`readFile()`完成的时候，它添加了一个任务到任务队列，使得`writeFile()`被调用(假设没有错误的话)。然后，当`writeFile()`完成的时候，它也添加了一个工作到任务队列。

这个模式相当的好，但是你很快就会发现自己处于*回调地狱*中，当你使用了太多回调的时候，就会产生回调地狱，比如下面这样：

```js
method1(function(err, result) {
    if(err) {
        throw err;
    }
    method3(function(err, result) {
        if(err) {
            throw err;
        }

        method4(function(err, result) {
            if(err) {
                throw err;
            }

            method5(result);
        });
    });
});
```

在上面的例子中，嵌套多个回调方法创造了一种紊乱的 web 代码，而且很难理解和调试。当你想要实现更复杂的功能的时候，回调也显示出了一些问题。例如，当你想要两个异步操作同时运行，当它们都完成的时候提醒你，该如何去做？或者你想在某一时刻开启两个异步操作，但是仅仅想要获取先完成的那个任务的操作结果，又该怎么做呢？

在上面的情况中，你需要去跟踪多个回调和函数和清除操作，但是 promises 极大地改善了这种情况。

## Promise 基础

一个 Promise 是一个异步操作结果的占位符，比起注册一个事件回调和传递一个回调到一个函数中，函数能够返回一个 Promise 对象，比如像下面这样：

```
// readFile promise 代表了在未来某些点完成的操作。
let promise = readFile("example.txt")
```

### Promise 生命周期

每个 Promise 穿过一个很短的生命周期然后就开始了 *pending* 状态，那表示着异步操作还没有被完成。一个阻塞的 promise 可以被认为是 *unsettled*。在上面例子中的 Promise ，当`readFile()`函数立刻返回它的时候是阻塞状态。一旦异步操作完成了，Promise 就被认为是 *settled* 的了，将会进入下面两种可能的状态之一：

> 1. *Fullfiled*: Promise 的异步操作已经被成功完成了。
> 2. *Rejected*: Promise 的异步操作没有成功完成，由于产生了一个错误或者其他的某种情况。

一个内部的`[[PromiseState]]`属性将会被设置成`"pending"`，`"Fullfiled"`，`"rejected"`来反映 Promise 的状态。
