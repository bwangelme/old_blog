
__摘要__:

> 今天读了《A Curious Course on Coroutines and Concurrency》的第一部分，以下为我的碎碎念。
> 1. 生成器和协程的异同
> 2. 协程的一些特性


<!--more-->

## 生成器和协程的异同

今天看过这本书以后，对于生成器和协程的理解突然增加了不少，特写与此，以备记录。

生成器和协程都是通过python中的`yield`的关键字实现的，不同的是，生成器只会调用`next`来不断地生成数据，而协程却会调用`next`和`send`来返回结果和接收参数。

作者还一再地强调，尽管生成器和协程看起来很像，但是它们代表的却是完全不同的设计理念。生成器是用来生成数据的，而协程从某种意义上来说是消耗数据的，而且作者还一再地强调，__协程和迭代无关__，尽管协程也会用`next`来获取数据，但是__协程和迭代无关__，不要尝试像使用生成器那样去迭代地使用协程。

个人理解就是生成器是通过迭代来不断地获取数据的一个东西。而协程呢，根本和生成器没有半毛钱关系（尽管它们都用`yield`），我在协程的维基百科里面看到，协程是和子例程（也就是编程语言中的函数）比较着说的。

+ 子例程调用完了就结束了，但是协程`yield`返回后并没有结束，只要你愿意，可以无限调用下去
+ 子例程只有一个入口(参数)和一个出口(返回值)，但是对于协程，一个`yield`就是一个入口或者出口，也就是说，协程可以拥有任意多的入口和出口
+ 子例程之间是相互调用的关系(函数a调用函数b)，但是协程之间是平等的关机，通过`yield`来转移执行权

这就是协程，用维基百科的话来说，就是和子例程一样，也是一种程序组件。

## 关于协程

除了协程和生成器的比较外，还看到书中讲了一些关于协程的一些比较有意思的东西，特在此写出来，以备查阅。

### 协程的启动

先举个例子，比如下面这个模拟Unix grep的协程:


```python
import re


def grep(pattern):
    pattern = re.compile(pattern)
    while True:
        line = (yield)
        m = pattern.search(line)
        if m:
            print(m.string)


g = grep(r'^abcd')
g.send('abcd')
```


    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-14-6248a9077ec9> in <module>()
         12
         13 g = grep(r'^abcd')
    ---> 14 g.send('abcd')


    TypeError: can't send non-None value to a just-started generator


如上所示，我们构造了一个协程`g`，如果我们直接向其中发送查询字符串，就会抛出一个`TypeError`，显示`cann't send non-None value to a just-started generator`。也就是说，我们需要先启动协程。其实这个启动过程，就是让上面那个函数先运行，运行到`yield`处，然后这个协程才能通过`send`来接收值。

那么如何启动协程呢，其实也很简单，只需要执行`next(g)`或者`g.send(None)`就可以了。

但是，每次都这样手动地去启动协程，太容易忘掉了，我们可以去写一个装饰器，加到协程函数上，让其自动启动，代码如下所示:


```python
import re


def coroutine(func):
    def start(*args, **kwargs):
        cr = func(*args, **kwargs)
        next(cr)
        return cr
    return start


@coroutine
def grep(pattern):
    pattern = re.compile(pattern)
    while True:
        line = (yield)
        m = pattern.search(line)
        if m:
            print(m.string)

g = grep(r'^abcd')

g.send('abcd')  # True
g.send('1234abcd') # False
```

    abcd


### 协程的关闭

接下来我们再来说说协程的关闭，还以上面的那个`grep`协程为例子，由于它的`yield`语句是写在一个死循环里面的，所以只要我们一直`send`，这个协程就会一直运行下去，那么该如何停止这个协程呢，其实也很简单，只要调用协程的`close`函数即可，如下所示：


```python
import re


def coroutine(func):
    def start(*args, **kwargs):
        cr = func(*args, **kwargs)
        next(cr)
        return cr
    return start


@coroutine
def grep(pattern):
    pattern = re.compile(pattern)
    while True:
        line = (yield)
        m = pattern.search(line)
        if m:
            print(m.string)

g = grep(r'^abcd')
g.send('abcd')
g.close()
g.send('1abcd')
```

    abcd



    ---------------------------------------------------------------------------

    StopIteration                             Traceback (most recent call last)

    <ipython-input-9-1958b0399f9e> in <module>()
         22 g.send('abcd')
         23 g.close()
    ---> 24 g.send('1abcd')


    StopIteration:


从上面的代码可以看出，当我们关闭了协程以后，如果再通过`send`向其中发送值的话，就会抛出一个`StopIteration`异常了。

需要注意的是，`close`函数其实是向协程内部抛出了一个`GeneratorExit`异常，我们当然也可以捕获这个异常,不过就算捕获了这个异常，协程一样会退出，而且对于这个异常唯一合理的做法就是清理环境并退出。

### 向协程抛出异常

除了可以向协程中发送值以外，也可以通过`throw`函数向协程中抛出异常，而这个异常像普通的异常一样，也可以通过`try-except`来捕获，请看下面这段代码:


```python
import re


def coroutine(func):
    def start(*args, **kwargs):
        cr = func(*args, **kwargs)
        next(cr)
        return cr
    return start


@coroutine
def grep(pattern):
    pattern = re.compile(pattern)
    while True:
        try:
            line = (yield)
        except RuntimeError as e:
            print('I catch you |%s| haha!' % e)
            continue
        m = pattern.search(line)
        if m:
            print(m.string)

g = grep(r'^abcd')
g.send('abcd')
g.throw(RuntimeError, "You can't catch me!")
```

    abcd
    I catch you |You can't catch me!| haha!


在上面的代码中，我们通过`throw`函数向协程内部抛出了一个`RuntimeError`的异常，而这个异常在协程内部被捕获到了！

## 参考文献

1. [A Curious Course on Coroutines and Concurrency](http://www.dabeaz.com/coroutines/) authored by `David Beazley`
2. [协程](https://www.wikiwand.com/zh/%E5%8D%8F%E7%A8%8B) authored by `维基百科`
