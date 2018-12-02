---
title: "MySQL 外键分析"
date: 2018-03-05T23:42:44+08:00
draft: false
tags: [MySQL, ]
---

本文主要介绍了 MySQL 外键的一些特性
<!--more-->

## 定义

外键用来保证参照完整性，MySQL 数据库的 MyISAM 存储引擎本身并不支持外键，对于外键的定义只是起一个注释的作用，而 InnoDB 存储引擎则完整支持外键约束。

外键的定义如下：

```sql
[CONSTRAINT [symbol]] FOREIGN KEY [index_name] (index_col_name,...)
REFERENCES tbl_name (index_col_name,...)
  [MATCH FULL | MATCH PARTIAL | MATCH SIMPLE]
  [ON DELETE RESTRICT | CASCADE | SET NULL | NO ACTION | SET DEFAULT]
  [ON UPDATE RESTRICT | CASCADE | SET NULL | NO ACTION | SET DEFAULT]
```

## REFERENCE OPTION

一般来说，将被引用的表称为父表，将引用的表称为子表。当我们创建外键约束时，可以使用`ON UPDATE`和`ON DELETE`定义当父表发生`UPDATE`或者`DELETE`时，对子表做的操作。

+ `CASCADE`表示当父表进行`DELETE`或`UPDATE`操作时，对相应的子表中的数据也进行`DELETE`或`UPDATE`操作
+ `SET NULL`表示当父表发生`DELETE`或`UPDATE`操作时，相应的子表中的数据被设置称为了`NULLL`值，但是子表中相对应的列必须允许设置为`NULL`值
+ `NO ACTION`和`RESTRICT`表示当父表发生`DELETE`或`UPDATE`操作时，抛出错误，不允许这类操作发生
+ `SET DEFAULT`选项能够被 MySQL 解析器识别，但是 InnoDB 不支持在外键定义中使用`SET DEFAULT`选项

在其他数据库中，如 Oracle 数据库，有一种称为延时检查的外键约束，即检查在SQL语句运行完成后再执行。而目前 MySQL 数据库的外键约束都是即时检查，因此从上面的定义中可以看出在 MySQL 数据库中`NO ACTION`和`RESTRICT`的功能是相同的。

## 外键和索引

在 Oracle 数据库中，如果创建了外键以后，没有在外键上添加索引。那么当更新父表时，会锁定子表，对子表进行全表扫描来进行一次更新，当父表有多个操作同时进行时，频繁对子表上表锁，容易造成死锁。
在 InnoDB 存储引擎中，创建外键时会自动地对外键列添加索引，从而避免了外键列上无索引导致的死锁问题。

## 忽略外键检查

对于参照完整性约束，外键能够起到非常好的作用，但是对于数据库的导入操作，外键往往导致在外键检查上花费大量的时间，因此我们可以设定 MySQL 在导入外键时忽略外键检查的选项。

```sql
mysql> set foreign_key_checks = 0;
mysql> LOAD DATA...
mysql> set foreign_key_checks = 1;
```

## 参考资料

1. [MySQL 文档: 13.1.17.6 Using FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/5.5/en/create-table-foreign-keys.html)
2. [MySQL 技术内幕: 4.6.7节](https://book.douban.com/subject/24708143/)
3. [Oracle 外键引起的死锁](http://tivan.iteye.com/blog/1184187)
4. [Oracle 中的外键与锁](https://yemengying.com/2017/09/04/oracle-foreignkey-lock/)
