---
title: 'MySQL存储引擎'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__:
> 这是一篇关于MySQL的文章，主要介绍mysql存储引擎

<!-- more -->
## 存储引擎

是表的类型，存储数据，简历索引，更新查询数据等技术的实现方法。

MySQL 有多种存储引擎，是插入式存储引擎

## 选择存储引擎

```
# 查看支持的存储引擎
show engines\G
```

### MyISAM (常见)

不支持事务(Transactions)
不支持保存点(Savepoints)
不支持外键(Foreign Key)

访问速度快，崩溃修复较差

### InnoDB (常见)

支持事务(与崩溃修复能力相关)
支持行级锁粒度
支持外键

优先选择

### Memory (常见)

将数据放在内存中，只会在磁盘上保存表结构
支持Hash索引技术

访问速度快，安全没有保障
使用与临时表和需要快速访问的表

### ndbcluster

用于集群的存储引擎

```
# 查看当前支持的存储引擎
show variables like 'have%'

# 查看当前存储引擎
show variables like 'storage_engine'

# 选择存储引擎
create table innodb1(id int)engine=innode; #创建表的时候选择

/etc/my.cnf
[mysqld]
default-storage-engine=INNODB #修改配置文件中默认搜索引擎

# 查看表的信息
show create table innodb1;
```

## 数据类型
