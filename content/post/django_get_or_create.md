---
title: "Django Get or Create"
date: 2018-01-03T22:31:01+08:00
tags: [Python, Django]
draft: true
---

<!-- -->


感觉@LeoJay这么一解释，我就懂了。文档中这句话针对的应该是这种情况:

```
from django.db import transaction
with transaction.atomic():
     User.objects.get_or_create(nickname='xxx')
```

如果将 `get_or_create`语句包裹在一个事务中，且MySQL的隔离级别设置成可重复读的话，上述语句确实会抛出`IntergrityError`的异常。

我看了一下`get_or_create`的实现，它的执行过程应该是这样的:

![](http://imgs.bwangel.me/2017-12-15-065033.jpg)

由于`get_or_create`实际上执行了三个事务，如果我们没有手动地把它放在一个事务中的话，它应该是不会抛出`IntegrityError`异常的。如果我们手动地把它放在一个事务中的话，而数据库的隔离级别又是可重复读的话，那么就很容易出现 @LeoJay 所说的情况，数据取又取不出来，存又存不进去。

以上就是我们对于`get_or_create`的理解，由于我水平有限，不对的地方还请大家指正。