
> `sort`命令是Redis中最强大的命令之一，本文试图通过一些例子来总结Redis Sort的常用方法。

<!--more-->

## 对列表排序的简单例子

```bash
127.0.0.1:6379> RPUSH users 3 4 5 1 33 8
(integer) 6
127.0.0.1:6379> SORT users
1) "1"
2) "3"
3) "4"
4) "5"
5) "8"
6) "33"
```

在上面的例子中，我们对一系列的数字进行了排序，得到了排序后的结果。

## 列表排序的更高级的例子

```bash
127.0.0.1:6379> RPUSH users 3 4 5 1 33 8
(integer) 6
127.0.0.1:6379> SORT users limit 1 4 asc alpha
1) "3"
2) "33"
3) "4"
4) "5"
```

在上面的例子中，我们使用了三个参数，`limit`, `asc`和`alpha`。
`limit`表示对结果进行分页，其中`1`表示页数，`4`表示一页中元素的个数。
`asc`表示对结果进行正序排序。
`alpha`表示对结果使用字母序排序，而不是数字序。

## 基于引用对象进行排序

```bash
# 首先添加一组用户ID
127.0.0.1:6379> RPUSH users 13 84 23 454
(integer) 4
# 然后添加一些user_age:id key用来表示用户的年龄
127.0.0.1:6379> set user_age:13 20
OK
127.0.0.1:6379> set user_age:84 23
OK
127.0.0.1:6379> set user_age:23 34
OK
127.0.0.1:6379> set user_age:454 11
# 使用sort命令基于用户年龄对用户进行排序
127.0.0.1:6379> sort users by user_age:* desc
1) "23"
2) "84"
3) "13"
4) "454"
```

在上面的例子中，我们使用一些值`user_age:*`，来对列表进行排序。
我们通过`sort`命令强大的`by`参数来设置排序的规则。`by`参数除了可以指定基于键值对数据进行排序外，也可以基于哈希对象进行排序，请看下面这个例子:

```bash
# 添加一组用户ID
127.0.0.1:6379> RPUSH users 13 84 23 454
(integer) 4
# 添加了一组哈希对象来表示用户
127.0.0.1:6379> hmset user:13 age 20 name user_13
OK
127.0.0.1:6379> hmset user:84 age 23 name user_84
OK
127.0.0.1:6379> hmset user:23 age 34 name user_23
OK
127.0.0.1:6379> hmset user:454 age 11 name user_454
OK
# 基于哈希对象的来对上面的例子进行排序
127.0.0.1:6379> sort users by user:*->age
1) "454"
2) "13"
3) "84"
4) "23"
# 基于哈希对象的来对上面的例子进行排序，并获取用户名称
127.0.0.1:6379> sort users by user:*->age get user:*->name
1) "user_454"
2) "user_13"
3) "user_84"
4) "user_23"
```

在这个例子中，`users`是一个列表用来表示用户ID，`user:*`为哈希对象用来表示用户。
在第一个`sort`命令中，我们基于用户哈希对象的`age`字段来进行排序，得到的结果为排序过后的用户ID列表。
如果想要取的返回值不是用户ID的话，也可以通过`get`参数来指定获取的字段。
在第二个`sort`命令中，我们还是通过用户哈希对象的`age`字段来排序，获取的结果为用户哈希对象的`name`字段组成的数组。

## 存储查询结果

```bash
# 添加一组用户ID
127.0.0.1:6379> RPUSH users 13 84 23 454
# 添加一组key用来表示用户年龄
127.0.0.1:6379> set user_age:13 20
OK
127.0.0.1:6379> set user_age:84 23
OK
127.0.0.1:6379> set user_age:23 34
OK
127.0.0.1:6379> set user_age:454 11
OK
# 根据用户年龄对用户ID进行排序，并将排序结果存储在users_sort_result所代表的列表中
127.0.0.1:6379> SORT users by user_age:* desc store users_sort_result
(integer) 4
# 为排序结果设置过期时间
127.0.0.1:6379> expire users_sort_result 30
(integer) 1
```

在上面的例子中，我们根据用户年龄对用户ID进行了排序，同时为排序结果设置了一个过期时间，这样我们就可以将排序结果缓存起来了。
然后每回获取排序结果的时候，我们可以先查缓存，如果缓存不存在的话，则进行排序。
需要注意的是，为了避免多个客户端同时操作排序结果，我们需要使用`SETNX`命令来为缓存结果设置一个锁，详见[SETNX key value](https://redis.io/commands/setnx)
