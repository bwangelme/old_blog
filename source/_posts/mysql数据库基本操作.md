---
title: 'MySQL数据库基本操作'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__:
> 这是一篇关于MySQL的文章，主要介绍MySQL数据库基本操作


<!-- more -->
## 初识SQL语言

SQL语言分为3类

DDL语句（数据库定义语言）：定义数据库的结构

DML语句（数据库操作语言）：对数据进行增删改查

DCL语句（数据库控制语言）：控制用户访问权限GRANT，REVOKE

## 系统数据库

performance_schema: 存放性能参数

```
# 查看连接
show processlist;

```

information_schema: 系统中数据库的对象信息（类似于文件系统元数据）,没有存储在磁盘上

mysql: 授权库，存储用户的授权信息

```
select user(); # 查看当前登录用户
select database(); # 查看当前使用的数据库
```


test: 测试库，任何人都可以操作这个库


## 忘记MySQL密码

vim /etc/my.conf

```
[mysqld]
skip-grant-table
```

service mysql restart

```
update mysql.user set passwd=passwd('456') where user="root" and host="localhost"

flush privileges;

语句结尾\c会清除输入缓存
```


## 创建数据库

### 数据库命名名字

数据库名字由字母，数字，下划线，@，//, $

数据库名字区分大小写

不能使用关键字，`select`，`create`

不能单独使用数字

长度不超过128位

SQL语句关键字使用大写，名字使用小写
