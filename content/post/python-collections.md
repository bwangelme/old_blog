---
title: Python的collections模块小结
date: 2017-08-13 14:06:24
tags: [Python, Python标准库]
---

> __摘要__:

> 1. 本文章的目标是逐步总结Python中[collection](http://devdocs.io/python~3.6/library/collections)模块的用法，会不定期进行更新。
> 2. 目前总结了Counter类的用法

<!--more-->

## ChainMap

## Counter

### Counter的说明

`Counter`是`dict`的子类，用来统计可哈希的对象。它本身是一个无序集合，使用对象来当做字典的key，对象的次数当做字典的值，它的值可以是0或者负数以内的任何整数。`Counter`类的功能类似于其他语言中的`bags`或者`multisets`类型。

### Counter的常用方法

#### elements()

`elements`方法用户迭代地展示`Counter`内的所有元素，按元素的计数重复该元素，如果该元素的计数小于1，那么Counter就会忽略该元素，不进行展示。

```py
In [1]: from collections import Counter

In [2]: c = Counter({'a': 1, 'b': 2, 'c': 0, 'd': -2})

# elements()函数返回的是一个可迭代对象
In [3]: c.elements()
Out[3]: <itertools.chain at 0x106063b70>

In [4]: list(c.elements())
Out[4]: ['a', 'b', 'b']
```

#### most_common([n])

`most_common`函数返回`Counter`中次数最多的N个元素，如果N没有提供或者是`None`，那么就会返回所有元素。

```py
>>> from collections import Counter
>>> c = Counter({'a': 1, 'b': 2, 'c': 0, 'd': -2})
>>> c.most_common()
[('b', 2), ('a', 1), ('c', 0), ('d', -2)]
>>> c.most_common(2)
[('b', 2), ('a', 1)]
```

#### subtract([iterable-or-mapping])

`substract`方法接收一个可迭代或者可映射的对象，针对每个元素减去参数中的元素对应的次数。

```py
>>> from collections import Counter
>>> c = Counter({'a': 1, 'b': 3, 'c': -2, 'd': 0})
>>> c.subtract(['a', 'a', 'b', 'b', 'b', 'b'])
>>> c
Counter({'d': 0, 'a': -1, 'b': -1, 'c': -2})
# 注意这里减去一个负的次数相当于加上一个正的次数
>>> c.subtract({'d': -3})
>>> c
Counter({'d': 3, 'a': -1, 'b': -1, 'c': -2})
```

#### update([iterable-or-mapping])

`update`方法的功能和`substract`方法的功能正好相反，它接收一个可迭代或者可映射的对象，针对每个元素加上参数中的元素对应的次数。

```py
>>> from collections import Counter
>>> c = Counter({'a': 1, 'b': 3, 'c': -2, 'd': 0})
>>> c.update({'a': 2, 'c': 5, 'd': 3})
>>> c
Counter({'a': 3, 'b': 3, 'c': 3, 'd': 3})
```

### Counter的其他工作模式

除了上面提到的方法外，`Counter`类还提供了一些其他的通用模式，让我们可以更方面地进行操作。

__说明__：下面代码中全部省略了导入`Counter`类的过程

+ 统计所有元素的次数之和

```py
>>> c = Counter(a=1, b=-2, c=3, d=4)
>>> sum(c.values())
6
```

+ 清除所有元素的统计次数

```py
>>> c = Counter(a=1, b=-2, c=3, d=4)
>>> c.clear()
>>> c
Counter()
>>> c = Counter(a=1, b=-2, c=3, d=4)
```

+ 列出所有元素

```py
>>> c = Counter(a=1, b=-2, c=3, d=4, f=0)
>>> list(c)
['a', 'b', 'c', 'd', 'f']
>>> set(c)  # 这里将所有元素以集合的方式来展现
{'b', 'c', 'a', 'd', 'f'}
```

+ 获取Counter中(元素，次数)的元祖

```py
>>> c = Counter(a=1, b=-2, c=3, d=4, f=0)
>>> dict(c)  # 将Counter转换成一个字典
{'a': 1, 'b': -2, 'c': 3, 'd': 4, 'f': 0}
>>> c.items()  # 获取Counter中(元素，次数)的元祖
dict_items([('a', 1), ('b', -2), ('c', 3), ('d', 4), ('f', 0)])
# 将一个(元素，次数)元祖列表转换成Counter
>>> Counter(dict([('a', 1), ('b', 2), ('c', 3)]))
Counter({'c': 3, 'b': 2, 'a': 1})
```

+ 获取N个次数最少的元素

```py
>>> c = Counter(a=1, b=-2, c=3, d=4, f=0)
>>> c.most_common()[:2:-1]
[('b', -2), ('f', 0)]
```

+ 删除掉所有次数小于等于0的元素

```py
>>> c = Counter(a=1, b=-2, c=3, d=4, f=0)
>>> +c
Counter({'d': 4, 'c': 3, 'a': 1})
```

### Counter上的数学运算

Counter之间还能进行数学运算，__在数学运算的结果中，次数小于等于0的元素将会被删除掉__。

```py
>>> c = Counter(a=3, b=1)
>>> d = Counter(a=1, b=2)
>>> c + d  # 将元素的次数进行相加
Counter({'a': 4, 'b': 3})
>>> c - d  # 将元素的次数进行相减
Counter({'a': 2})
>>> f = Counter(a=3, b=2, c=1)
>>> c & f  # 两个Counter的元素取交集，并且元素的次数取较小的那个
Counter({'a': 3, 'b': 1})
>>> c | f  # 两个Counter的元素取并集，并且元素的次数取较大的那个
Counter({'a': 3, 'b': 2, 'c': 1})
```

+ 单目运算符`+`或者`-`

```py
>>> c = Counter(a=2, b=-4)
>>> +c
Counter({'a': 2})
>>> -c
Counter({'b': 4})
```

### 注意事项

+ `Counter`类是字典的子类，它的键和值都没有限制，值一般是一个数字用来表示某个元素出现的次数，但是它可以是任何值

+ `Counter`类的`most_common`方法需要`Counter`的值是可排序的

+ 一些便捷操作，比如`c[key] += 1`仅仅需要值是支持加或者减操作，所以`Counter`的值支持整型，浮点数，负数等，同样`update`和`subtract`方法的输入和输出也支持负数和0。

+ 集合运算仅仅支持正数，负数和0都会被忽略掉，集合运算理论上对于值没有限制，只要支持加，减，比较操作就可以。

+ `elements()`方法需要正数，负数和0将会被忽略掉。
