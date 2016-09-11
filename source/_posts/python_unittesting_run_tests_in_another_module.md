---
title: "Python unittesting: run tests in another module"
date: 2016-09-11 11:46:43
tags: [python, unittest]
---

__摘要__:
> 记录一次解决问题的过程。

<!-- more -->

## 前言

最近在写一个网站，用来树形显示一些信息。然后我开发的时候用到了TDD的方法，也就意味着要写很多测试。运行测试代码的时候，我就想，能不能像Django那样来运行测试代码呢（我用的是tornado）？写一个入口文件为`manage.py`，`python manage.py run`运行服务器，`python manage.py test`运行测试代码。

首先是解析参数的问题，这个我找到了argparse模块的[子命令](https://docs.python.org/3/library/argparse.html)，利用这个就可以解析出`run`和`test`命令来。但是运行测试的时候我又遇到了问题，平常运行测试是直接运行测试文件，而现在需要从其他模块import测样样例再来运行，这个该怎么做呢？


## 寻找解决办法

有了这个问题以后，我就去StackOverflow上面搜索解决的办法，找到了这个相似的问题：[Python unittesting: run tests in another module](http://stackoverflow.com/questions/15334042/python-unittesting-run-tests-in-another-module)。然后我就按着rparent的答案来编写我的测试代码，如下所示：

```python
if __name__ == '__main__':
    args = parser.parse_args()
    # 下面这条语句用来判定第二个位置参数是不是run
    if args.__dict__.get('run'):
        console.info("Starting Web Server at port {}".format(args.port))
        start_tornado_server(args.port)
    # 下面这条语句用来判定第二个位置参数是不是test
    elif args.__dict__.get('test'):
        console.info("Run the unit tests")
        import unittest
        import sys
        from tree.tests import TestTreeApp
        unittest.main()
```

## 遇到新的错误

但是照着上面的代码编写了以后，发现程序并不能正确地执行，它报出了以下的错误：

```shell
E
======================================================================
ERROR: test (unittest.loader._FailedTest)
----------------------------------------------------------------------
AttributeError: module '__main__' has no attribute 'test'

----------------------------------------------------------------------
Ran 1 test in 0.000s

FAILED (errors=1)
```

这里错误是`unittest.loader._FailedTest`中抛出的`AttributeErro`，说在模块`__main__`中找不到属性`test`,到了这里我又不知道该咋办了，然后继续去网上搜索原因，也没发现相应的答案。

## 查看调用代码

这时候感觉自己已经被逼得山穷水尽了，没办法，只能去看源码来寻找答案了。

首先，从异常入手，异常是在`unittest.loader._FailedTest`中抛出来的，我就沿着这个调用栈向上走，最终还原出调用栈为：

```python
6 unittest.loader._FailedTest
5 unittest.loader._make_failed_test
4 unittest.loader.TestLoader.loadTestFromName
3 unittest.loader.TestLoader.loadTestFromNames
2 unittest.main.TestProgram.createTests
1 unittest.main.TestProgram.parseArgs
0 unittest.main()
```

通过查看这个函数调用栈，最终发现错误的原因就出在`unittest.main.TestProgram.createTests`中。

## 找到错误原因

在`unittest.main.TestProgram.createTests`中，它的代码是这样的

```python
def createTests(self):
    if self.testNames is None:
        self.test = self.testLoader.loadTestsFromModule(self.module)
        # loadTestsFromModule函数的作用是从self.module这个模块中寻找测试样例，即unittest.TestCase的子类
    else:
        self.test = self.testLoader.loadTestsFromNames(self.testNames,
                                                       self.module)
        # loadTestsFromName函数的作用是从self.module这个模块中寻找名字为self.testNames的测试样例(unittest.TestCase的子类)
```

这里调用的是loadTestFromNames函数，传入的`self.testNames`为`test`，就是这个`test`，再后面无法找到，被抛出为异常。

然后我又去找了一下这个`self.testNames`中从何而来，发现是在`unittest.main.TestProgram.parseArgs`函数中从`unittest.main.TestProgram.argv`中解析出来的，而`unittest.main.TestProgram.argv`又来自于`sys.argv`。

至此，我终于明白了错误是出在哪里了。

python的unittest是可以接受命令行参数的，比如下面这样：

```
python exam.py TestStringMethods
```

其中`examp.py`是[Python官方文档给出的例子](https://docs.python.org/3/library/unittest.html#basic-example)，在这个例子中有一个测试样例`TestStringMethods`类。上面的调用语句的意思就是说去`exam.py`模块中寻找`TestStringMethods`测试样例，并运行这个测试样例。其实上面的测试方法就是将`TestStringMethods`存放在`sys.argv`中，而unittest.main会根据`sys.argv`中的名字来查找相应的测试样例。

而我调用的方式是`python manage.py test`，这里在`sys.argv`中添加了一个参数`test`，而`unittest`认为这个`test`是一个测试样例，会去执行的模块中寻找这个`test`属性，但是又找不到，最终就会抛出一开始的属性异常：`module '__main__' has no attribute 'test'`

## 最终解决方案

最终解决其实也很简单，我们只需要将argv改变就好。其中，`unittest.main`函数含有一个参数`argv`，如果这个参数为空，就会使用`sys.argv`，所以，我们只需要传入这个参数即可，不需要改变`sys.argv`。最终代码如下：

```python
if __name__ == '__main__':
    args = parser.parse_args()
    # 下面这条语句用来判定第二个位置参数是不是run
    if args.__dict__.get('run'):
        console.info("Starting Web Server at port {}".format(args.port))
        start_tornado_server(args.port)
    # 下面这条语句用来判定第二个位置参数是不是test
    elif args.__dict__.get('test'):
        console.info("Run the unit tests")
        import unittest
        import sys
        from tree.tests import TestTreeApp
        unittest.main(argv=sys.argv[:1])
```

## 感言

### 多余的废话

事先声明，这一部分完全和技术编程无关，不感兴趣的读者可以直接跳过。

写到这里，我不禁想起了那个德国工程师的故事（也不知道是真是假）。就是话说有家工厂机器坏了，然后厂子里面的人怎么修也修不好，于是就去请了一个德国老外来修。老外来了，研究了三天，然后告诉厂子里面的人，打开这个地方，里面有个线圈，减少十圈就可以了。然后就修好了，然后老外就要好多好多钱，厂子里面的人就觉得不值，就一个线圈而已，干嘛要这么多钱。然后老外就说，线圈不值钱，找到问题所在却很值钱。

我感觉我的解决问题的经历很相似啊，解决起来很简单，多传一个参数就可以了，但是为了找到这个问题，我花了一下午和一晚上的时间，来跟踪调用栈，查看源代码。

好吧，感觉一解决了问题，就不禁自大起来，扯了很多无关的话，下面说点正经的感言，如果更好更快地解决问题。

### 工具很重要

首先，真的感觉工具很重要。我用的是IPython中集成的ipdb来跟踪调用栈，然后利用PyCharm来查看源代码。不得不说，虽然平常一直用vim来编写代码。但是真的觉得PyCharm在查找定义和查找引用方面，真的是完爆vim，毕竟vim不是IDE。我突然觉得，所有的vim教程其实在一开始都得加上一句话，**vim不是IDE，该用IDE的时候就要用IDE。**感觉这比整天声明vim是编辑器之神要实用的多。

除了PyCharm，还发现IPython真是个好东西，可以调用ipdb，还可以方便地查看Python文档。

### 不足之处

尽管最终解决了这个问题，但是发现自己还是有很多的地方浪费了时间。

#### 心慌

感觉自己遇到问题还是会心慌，为了解决问题，也不思考问题的具体原因，就去网上找原因，然后瞎试，完全靠运气来解决问题。感觉这种心态很不好，而这种做法其实是最浪费时间的做法。

究其原因，还是因为内心焦急，总是想着我晚上应该完成什么什么功能的，怎么又遇到这么一个该死的问题，怎么才能快点解决啊，拜托快点啊，我还要赶着写接下来的功能呢。遇到这种心态呢，如果是在工作中呢，我也不知道咋办，快到deadline，然后遇到问题了，不心急才怪，但还是要努力安慰自己，因为越心急，越解决不了。

如果在平常个人项目中遇到了，我就觉得可以这样想，自己做项目为了什么，不就是为了学习吗，遇到问题了，不正是学习的良机吗？应该把握这个大好机会，把这个问题解决透彻，这样才是真正学习了啊。如果一点问题都没遇到，那才是失败的，因为你只不过是把自己以前做过的工作重复了一遍而已。

#### 没有很好地利用工具

这里我跟踪函数调用栈的办法，还是用的非常笨的办法，就是自己手动去查。
首先查到异常在哪里抛出，然后沿着调用栈往上，这个方法是被那个方法调用的，下一个方法是被哪个方法调用的。
但其实还有更好的办法，我们完全可以让 Python 自己打印出函数调用栈。

我们可以利用[ traceback ](https://docs.python.org/3/library/traceback.html)标准库，
在代码中抛出一个异常，然后利用 traceback 打印出调用栈。
具体使用方法可以参考官方文档给出的[例子](https://docs.python.org/3/library/traceback.html#traceback-examples)。
