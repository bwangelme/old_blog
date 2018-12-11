
__摘要__:

> 1. 针对[PEP 492](https://www.python.org/dev/peps/pep-0492/)部分进行了翻译
> 2. 主要讲述了 Python 的`async`, `await`关键字


<!--more-->

# 规范

这个提案介绍了新的语法和语义来增强Python 对协程的支持。这个规范假设你拥有 Python 协程实现的相关知识(PEP 342 和 PEP 380)。这个语法改变的动机是在 asyncio 框架(PEP 3156)和 *协作函数* 提案(PEP 3152，为了有利于本规范现在被拒绝了)。

从文档这一点我们使用 *原生协程* 的关键字去索引使用新语法生成的函数。*基于生成器的协程* 关键字用来描述基于生成器语法生成的协程。*协程* 关键字根据上下文，在两种语义中都适用。

## 新的生成器声明语法

如下的新语法用来去生成一个新的 *原生协程* :

```py
async def read_data(db):
    pass
```

协程的关键属性是：

+ `async def` 定义的函数总是协程，甚至它们不包含 `await` 表达式
+ 在`async`函数中有`yield`或者`yield from`关键字会抛出`SyntaxError`
+ 在内部，两个新的代码对象标记被使用：
  + `CO_COROUTINE` 用来去标记 *原生协程* (使用新语法定义的)
  + `CO_ITERABLE_COROUTINE` 用来去生成 *基于生成器的协程* 和 *原生协程兼容* (由 `types.coroutine()` 函数来设定)
+ 通常生成器在被调用的时候返回一个 *生成器对象*，相似的，协程返回一个 *协程* 对象。
+ `StopIteration`异常不会在协程外传播，而是替换成了 `RuntimeError`。普通的生成器如果要这种行为需要一个 `future import` (参考 PEP 479)
+ 当一个协程被GC回收时，如果它没有被`await` 的话它将会抛出一个 `RuntimeWaring`。(参考 [Debugging Features](https://www.python.org/dev/peps/pep-0492/#debugging-features))
+ 这部分内容也可以在[Coroutine objects](https://www.python.org/dev/peps/pep-0492/#coroutine-objects)部分看到

## types.coroutine()

这是一个在 types 模块中新添加的方法`coroutine(fn)`。它允许在已经存在的异步IO中 *基于生成器的协程* 和 本PEP介绍的 *原生协程* 之间进行交互。

```python
@types.coroutine
def process_data(db):
    data = yield from read_data(db)
    ...
```

这个函数将 `CO_ITERABLE_COROUTINE` 标志应用到生成器函数代码对象上，使它返回一个协程对象。

如果参数`fn`不是一个生成器函数的话，它将会将它封装。如果它返回了一个生成器，它将会将它封装成为一个 *awaitable* 的代理对象(参见下面 *awaitable* 对象的定义)。

注意，`CO_COROUTINE` 标记没有被应用到`types.coroutine()`上，这使得从基于生成器协程中分离出一个使用新语法定义的原生协程成为可能。

## Await 表达式

如下的新的await表达式用来获取一个协程执行的结果。

```python
async def read_data(db):
    data = await db.fetch('SELECT ...')
    ...
```

`await` 相似于 `yield from`，暂停 `read_data` 协程的执行，直到`db.fetch()`这个 *awaitable* 对象完成并且返回数据。

它使用了 `yield from` 的实现，并添加上了额外的验证参数的步骤。`await` 仅仅接收一个 *awaitable* 对象，它可以是如下几种形式：

+ 从一个 *原生协程函数* 返回的 *原生协程* 对象。
+ 一个*基于生成器协程* 对象，并且使用了 `types.coroutine()` 修饰符。
+ 一个对象拥有 `__await__` 方法并且返回了一个迭代器。

> 任何一个 `yield from` 链都会以一个 `yield` 来结束。这是一个基本的 *Futures* 实现的机制。因为，内部来说，协程是一种特殊类型的生成器。每个`await`都被`await`调用链下一级的某个`yield`给暂停了(请参考 PEP 3156 查看更多的细节解释)。
> 去为协程开启这个特性，一个叫做 `__await__` 的新的魔法方法被添加了。在异步IO中，例如，去在 await 语句中开启 Future 对象，仅仅需要做的改变就是为`asyncic.Future`类添加一行 `__await__ = __iter__`。
> 在本 PEP 的剩余部分，拥有`__await__` 的对象就被叫做 *Future-like* 对象。
> 如果 `__await__` 方法返回的不是一个迭代器，将会抛出一个`TypeError`
+ 使用CPython C API 函数`tp_as_async.am_await`定义的对象将会返回一个迭代器(类似于`__await__`方法)

如果在`async def`函数外使用`await`语句将总会抛出一个语法错误(就像在`def`外部使用`yield`语句)。

如果在`await`语句后跟的不是一个*awaitable*对象，将会抛出一个`TypeError`

### 更新操作符优先级表

`await`关键字是被如下定义的:

    power ::= await ["**" u_expr]
    await ::= ["await"] primary

primay 代表了语言中最紧紧绑定的操作符，它的语法是：

`primary ::= atom | attributeref | subscription | slicing | call`

参见 Python 文档 [Primaries](https://docs.python.org/3/reference/expressions.html#primaries) 查看更多细节

关键字`await`不同于`yield`和`yield from`操作符，`await`表达式大部分时间不需要在他们周围加上括号。

同样的，`yield from`允许一个表达式作为它的参数，包括表达式像`yield from a() + b()`，将会被解析成`yield from (a() + b())`，这通常都是一个BUG。一般来说，任何算数运算的结果都不是一个`awaitable`的对象。为了避免这种类型的错误，我们决定让`await`比`[]`，`()`和`.`有更低的优先级，但是比`**`操作符的优先级要高。

| Operator | Description |
| -------- | ---------- |
| yield x , yield from x | Yield expression |
| lambda | Lambda expression |
| if -- else | Conditional expression |
| or | Boolean OR |
| and | Boolean AND |
| not x | Boolean NOT |
| in , not in , is , is not , < , <= , > , >= , != , == | Comparisons, including membership tests and identity tests |
| &#124; | Bitwise OR |
| ^ | Bitwise XOR |
| & | Bitwise AND |
| << , >> | Shifts |
| + , - | Addition and subtraction |
| * , @ , / , // , % | Multiplication, matrix multiplication, division, remainder |
| +x , -x , ~x | Positive, negative, bitwise NOT |
| ** | Exponentiation |
| await x | Await expression |
| x[index] , x[index:index] , x(arguments...) , x.attribute | Subscription, slicing, call, attribute reference |
| (expressions...) , [expressions...] , {key: value...} , {expressions...} | Binding or tuple display, list display, dictionary display, set display |

### "await" 表达式的例子

有效的语法例子:

| 表达式 | 表达式将会被解析成 |
| ---------- | --------------- |
| if await fut: pass | if (await fut): pass |
| if await fut + 1: pass | if (await fut) + 1: pass |
| pair = await fut, 'spam' | pair = (await fut), 'spam' |
| with await fut, open(): pass | with (await fut), open(): pass |
| await foo()['spam'].baz()() | await ( foo()['spam'].baz()() ) |
| return await coro() | return ( await coro() ) |
| res = await coro() ** 2 | res = (await coro()) ** 2 |
| func(a1=await coro(), a2=0) | func(a1=(await coro()), a2=0) |
| await foo() + await bar() | (await foo()) + (await bar()) |
| -await foo() | -(await foo()) |

无效的语法例子:


| 表达式 | 应该被写成 |
| ---------- | -------------------- |
| await await coro() | await (await coro()) |
| await -coro() | await (-coro()) |

## 异步上下文管理器和 “async with”

一个异步的上下文管理器是一种特殊的上下文管理器，能够在它的 enter 和 exit 方法中暂停。

为了使这种设想成为可能，一种新的协议用来支持异步的上下文管理器被提出了。两个魔法方法被添加了，`__aenter__`和`__aexit__`。这两个都必须返回一个`awaitable`的对象。

一个异步的上下文管理器的例子是：

```py
class AsyncContextManager:
    async def __aenter__(self):
        await log('enter context')

    async def __aexit__(self, exc_type, exc, tb):
        await log('exiting context')
```

### 新的语法

针对异步的上下文管理器，一种新的语法被提出来了：

```python
async with EXPR as VAR:
    BLOCK
```

它在语义上等价于：

```py
mgr = (EXPR)
aexit = type(mgr).__aexit__
aenter = type(mgr).__aenter__(mgr)
exec = True

VAR = await aenter

try:
    block
except:
    if not await(mgr, *sys.exc_info()):
        raise
else:
    await aexit(mgr, None, None, None)
```

就像普通的`with`语句一样，`async with`语句也能够指定多个上下文管理器。

将一个普通的没有`__aenter__`和`__aexit__`方法的上下文管理器传递给`async with`语句是错误的。同时，在`async def`函数外部使用`async with`语句也是一个语法错误。

### 例子

使用异步的上下文管理器很容易去正确实现协程的数据库事物管理：

```python
async def commit(session, data):
    ...
    async with sesson.transaction():
        ...
        await session.update(data)
        ...
```

同时，代码需要看起来更轻量级一些：

```python
async with lock:
    ...
```

而不是:

```python
with (yield from lock):
    ...
```

## 异步迭代器和 “async for”

一个异步可迭代对象能够在它的迭代器实现中异步地调用代码，异步迭代器能够在它的`next`方法中调用异步代码，为了支持异步迭代:

> 1. 一个对象必须实现一个`__aiter__`方法(或者使用了 CPython 的C API 的`tp_as_async.am_aiter`接口)，返回一个异步迭代器对象。
> 2. 一个异步迭代器对象必须实现一个`__anext__`方法(或者也可以使用 CPython 的 C API 的`tp_as_async.am_next`接口)，返回一个`awaitable`对象。
> 3. 为了停止迭代，`__anext__`必须抛出一个`StopAsyncIteration`异常。

一个异步迭代的例子如下所示：

```python
class AsyncIterable:
    def __aiter__(self):
        return self

    async def __anext__(self):
        data = await self.fetch_data()
        if data:
            return data
        else:
            raise StopAsyncIteration

    async def fetch_data(self):
        ...
```

### 新的语法

一种通过异步迭代器进行迭代的新的语句被提出来了：

```python
async for TARGET in ITER:
    BLOCK
else:
    BLOCK2
```

它在语义上等于：

```python
iter = (ITER)
iter = type(iter).__aiter__(iter)
running = True
while running:
    try:
        TARGET = await type(iter).__anext__(iter)
    except StopAsyncIteration:
        running = False
    else:
        BLOCK
```

对`async for`语句抛出一个没有`__aiter__`方法的普通迭代器将会抛出一个`TypeError`。在`async for`外部使用`async for`语句将会抛出一个`SyntaxError`。

就像普通的`for`语句一样，`async for`有可选的`else`子句。

### 例子1

使用异步迭代协议可以在迭代期间异步缓存数据：

```python
async for data in cursor:
    ...
```

`cursor`是一个异步迭代器，在N次迭代后从数据库中取出N行的数据。

如下的代码说明了一种新的异步迭代协议：

```python
class Cursor:
    def __init__(self):
        self.buffer = collections.deque()

    async def _prefetch(self):
        ...

    def __aiter__(self):
        return self

    async def __anext__(self):
        if not self.buffer:
            self.buffer = await self._prefetch()
            if not self.buffer:
                raise StopAsyncIteration
        return self.buffer.popleft()
```

`Cursor`类能够按下面的方式进行使用：

```python
async for row in Cursor():
    print(row)
```

它将会等价于如下的代码：

```python
i = Cursor().__aiter__()
while True:
    try:
        row = await i.__anext__()
    except StopAsyncIteration:
        break
    else:
        print(row)
```

### 例子2

如下的例子是一个使用类将普通迭代器转换成异步的。虽然这并不是一个非常有用的事情，但是如下的代码说明了普通迭代器和异步迭代器之间的关系：

```python
class AsyncIteratorWrapper:
    def __init__(self, obj):
        self._it = iter(obj)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            value = next(self._it)
        except StopIteration:
            raise StopAsyncIteration
        return value

async for letter in AsyncIteratorWrapper("abc"):
    print(letter)
```

## 为什么是`StopAsyncIteration`异常

协程对象内部仍然是基于生成器的。所以，在`PEP 479`之前，在下面这两种代码中没有基本的区别：

```python
def g1():
    yield from fut
    return 'spam'
```

```python
def g2():
    yield from fut
    raise StopIteration('spam')
```

因为 PEP 479 被接受了，而且默认在协程对象中开启，所以如下的例子将会把它的`StopIteration`包裹在一个`RuntimeError`中：

```python
async def a1():
    await fut
    raise StopIteration('spam')
```

唯一的方式就是由迭代器告诉外部的代码，迭代结束了而不能使用`StopIteration`异常。因此，一个新的内建的异常类`StopAsyncIteration` 被添加了。

此外，由`PEP 479`的语义可得，所有协程中的`StopIteration`将会由一个`RuntimeError`来包裹。

