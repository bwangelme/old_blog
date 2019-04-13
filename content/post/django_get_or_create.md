---
title: "Django get_or_create 执行过程"
date: 2018-01-03T22:31:01+08:00
tags: [Python, Django]
draft: false
aliases:
  - /2018/01/03/django-get_or_create-执行过程/
---

关于 Django 文档`get_or_create`的解释

<!--more-->

最近在看 Django的 get_or_create 的文档的时候，发现了这样一句话, [文档地址](https://docs.djangoproject.com/en/1.11/ref/models/querysets/#get-or-create)：

> If you are using MySQL, be sure to use the READ COMMITTED isolation level rather than REPEATABLE READ (the default), otherwise you may see cases where get_or_create will raise an IntegrityError but the object won’t appear in a subsequent get() call.

我对于上面这句话的理解就是，如果使用 MySQL的话，需要将数据库的隔离级别从默认的可重复读改成提交读。否则的话，你可能会看到 get_or_create 方法抛出了一个 IntegrityError 异常，但是随后在数据库中查询的时候却找不到你要插入的记录。

我查了一下 get_or_create 的源码：它创建数据库记录的代码是这样的：

```python
def _create_object_from_params(self, lookup, params):
    """
    Tries to create an object using passed params.
    Used by get_or_create and update_or_create
    """
    try:
        with transaction.atomic(using=self.db):
            params = {k: v() if callable(v) else v for k, v in params.items()}
            obj = self.create(**params)
        return obj, True
    except IntegrityError:
        exc_info = sys.exc_info()
        try:
            return self.get(**lookup), False
        except self.model.DoesNotExist:
            pass
        six.reraise(*exc_info)
```

_create_object_from_params 做的事情就是开启一个事务，然后通过 insert 语句插入数据

文档中这句话针对的应该是这种情况:

```python
from django.db import transaction
with transaction.atomic():
     User.objects.get_or_create(nickname='xxx')
```

如果将 `get_or_create`语句包裹在一个事务中，且MySQL的隔离级别设置成可重复读的话，上述语句确实会抛出`IntergrityError`的异常。

我看了一下`get_or_create`的实现，它的执行过程应该是这样的:

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com/2017-12-15-065033.jpg)

由于`get_or_create`实际上执行了三个事务，如果我们没有手动地把它放在一个事务中的话，它应该是不会抛出`IntegrityError`异常的。如果我们手动地把它放在一个事务中的话，而数据库的隔离级别又是可重复读的话，那么就很容易出现 @LeoJay 所说的情况，数据取又取不出来，存又存不进去。

以上就是我们对于`get_or_create`的理解，由于我水平有限，不对的地方还请大家指正。

## 参考链接

+ [python-cn 讨论邮件](https://groups.google.com/forum/#!msg/python-cn/7SYBIPZdnNc/3ha72q7QCgAJ;context-place=forum/python-cn)
