---
title: "Innodb 锁机制"
date: 2018-03-04T13:22:46+08:00
draft: true
tags: [MySQL, ]
---

## 前言

　锁是数据库系统区别于文件系统的一个关键特性，锁机制用于管理对共享资源的并发访问。不同数据库和不同搜索引擎都可能有不同的锁机制，MyISAM 引擎的锁是表锁设计，并发读没有问题，但是并发写入可能就存在一定的问题。

　Microsoft SQL Server 在2005版本之前是页锁设计，相对于 MyISAM 并发性能有所提高，但是对于热点数据页的并发问题仍然无能为力。在2005版本中，SQL Server 开始支持乐观并发和悲观并发，在乐观并发下开始支持行级锁。但其实现方式与 InnoDB 完全不同，在 SQL Server 中锁是一种稀缺资源，锁越多开销越大，当锁过多的时候会出现锁升级，从行锁升级到表锁。

　InnoDB 存储引擎锁的实现和 Oracle 数据库非常类似，提供一致性的非锁定读和行级锁支持。行级锁没有相关额外的开销，可以同时得到并发性和一致性。

## lock 与 latch 的区别

　在 MySQL 中 lock 与 latch 都可以被称为"锁"，但是它们是不同的东西。

+ latch 一般称为闩(shuan, 读一声)锁(轻量级的锁)，它可以分为 mutex(互斥量) 和 rwlock(读写锁) ，它锁定的对象是内存中的共享资源，主要用来保证并发线程操作临界资源的正确性。
+ lock 就是锁，它可以分为排他锁，共享锁，意向锁等，它锁定的对象是事务，主要用来锁定数据库中的对象，包括表，页，行等。

它们具体的区别可以用下表表示:

比较内容|lock|latch
---|---|---
锁定对象|事务|线程
保护内容|数据库内存|内存数据结构
持续时间|整个事务过程|临界资源
模式|行锁，表锁，意向锁等|读写锁，互斥量
死锁检测|通过 waits-for graph, time out等机制检测与处理|无死锁检测机制。仅通过应用程序加锁的顺序保证无死锁的情况发生
存在于| Lock Manager的哈希表中 | 每个数据结构对象中

## 锁的类型

### 行级锁

InnoDB 存储引擎支持如下两种类型的行级锁:

+ 共享锁(S Lock) 允许事务读取一行数据
+ 排他锁(X Lock) 允许事务删除或者更新一行数据

如果一个事务T1已经获得了记录r上的共享锁，另一个事务T2也可以获得记录r上的共享锁，这种情况称为锁兼容。但如果T1获取的是记录r上的排他锁，则T2获取不了记录r上的共享锁，这种情况称为锁不兼容。
共享锁和排他锁的兼容情况如下所示:

 |共享锁|排他锁
---|---|---
共享锁|兼容|不兼容
排他锁|不兼容|不兼容

__注意__: 共享锁和排他锁都是行锁，兼容指的是同一记录上的锁的兼容情况。

### 意向锁

InnoDB 存储引擎支持多粒度(multiple granularity locking)锁定，它允许表锁和行锁共存。为了支持在不同粒度上加锁，InnoDB 额外支持了一种表级锁类型，意向锁(Intention Locks)。

意向锁可以分为意向共享锁(Intention Shared Lock, IS)和意向排他锁(Intention eXclusive Lock, IX)。但它的锁定方式和共享锁和排他锁并不相同，意向锁上锁只是表示一种“意向”,并不会真的将对象锁住，让其他事物无法修改或访问。例如事物T1想要修改表`test`中的行`r1`，它会上两个锁:

  1. 在表`test`上意向排他锁
  2. 在行`r1`上排他锁

事物T1在`test`表上上了意向排他锁，并不代表其他事物无法访问`test`了，它上的锁只是表明一种意向，它将会在`db`中的`test`表中的某几行记录上上一个排他锁。

但是意向锁并不是完全和任何锁都兼容，在表级别上的意向锁也会和表级别的读锁(共享锁)和写锁(排他锁)冲突。比如下面的例子:


```sql
-- 事务A用读锁的方式锁定了表 table_lock
mysql root@(none):hp> start transaction;
Query OK, 0 rows affected
Time: 0.000s
mysql root@(none):hp> lock table table_lock read;
Query OK, 0 rows affected
Time: 0.013s

-- 事务B尝试向表 table_lock 中写入数据，它会在插入数据的语句中阻塞住
mysql root@(none):(none)> start transaction;
Query OK, 0 rows affected
Time: 0.001s
mysql root@(none):hp> insert table_lock select 1;

-- 此时我们查询 informaction_schema 数据中的 INNODB_TRX 表，会发现存在如下两个事务
-- 第一行代表了事务B，可以看到它锁定的表 trx_tables_locked 的数量为0
-- 第二行代表了事务A，可以看到它锁定的表 trx_tables_locked 的数量为1
mysql root@(none):information_schema> select * from `INNODB_TRX`\G
***************************[ 1. row ]***************************
trx_id                     | 421391658438288
trx_state                  | RUNNING
trx_started                | 2018-03-08 19:57:28
trx_requested_lock_id      | <null>
trx_wait_started           | <null>
trx_weight                 | 0
trx_mysql_thread_id        | 15
trx_query                  | insert into table_lock select 2
trx_operation_state        | <null>
trx_tables_in_use          | 0
trx_tables_locked          | 0
trx_lock_structs           | 0
trx_lock_memory_bytes      | 1136
trx_rows_locked            | 0
trx_rows_modified          | 0
trx_concurrency_tickets    | 0
trx_isolation_level        | REPEATABLE READ
trx_unique_checks          | 1
trx_foreign_key_checks     | 1
trx_last_foreign_key_error | <null>
trx_adaptive_hash_latched  | 0
trx_adaptive_hash_timeout  | 0
trx_is_read_only           | 0
trx_autocommit_non_locking | 0
***************************[ 2. row ]***************************
trx_id                     | 421391658436448
trx_state                  | RUNNING
trx_started                | 2018-03-08 19:57:18
trx_requested_lock_id      | <null>
trx_wait_started           | <null>
trx_weight                 | 1
trx_mysql_thread_id        | 6
trx_query                  | <null>
trx_operation_state        | <null>
trx_tables_in_use          | 1
trx_tables_locked          | 1
trx_lock_structs           | 1
trx_lock_memory_bytes      | 1136
trx_rows_locked            | 0
trx_rows_modified          | 0
trx_concurrency_tickets    | 0
trx_isolation_level        | REPEATABLE READ
trx_unique_checks          | 1
trx_foreign_key_checks     | 1
trx_last_foreign_key_error | <null>
trx_adaptive_hash_latched  | 0
trx_adaptive_hash_timeout  | 0
trx_is_read_only           | 0
trx_autocommit_non_locking | 0
2 rows in set
Time: 0.006s

-- 接着我们在事务A中执行解锁语句，并提交事务A
mysql root@(none):hp> unlock tables;
Query OK, 0 rows affected
Time: 0.011s
mysql root@(none):hp> commit;
Query OK, 0 rows affected
Time: 0.000s

-- 事务A在解锁了表后，事务B的插入语句立刻就完成了，此时我们再来看 INNODB_TRX 表，发现事务只有一个了:
-- 第一行代表了事务B，可以看到此时它锁定的表的数量(trx_tables_locked)变成了1
mysql root@(none):information_schema> select * from `INNODB_TRX`\G
***************************[ 1. row ]***************************
trx_id                     | 30221
trx_state                  | RUNNING
trx_started                | 2018-03-08 19:57:28
trx_requested_lock_id      | <null>
trx_wait_started           | <null>
trx_weight                 | 2
trx_mysql_thread_id        | 15
trx_query                  | <null>
trx_operation_state        | <null>
trx_tables_in_use          | 0
trx_tables_locked          | 1
trx_lock_structs           | 1
trx_lock_memory_bytes      | 1136
trx_rows_locked            | 0
trx_rows_modified          | 1
trx_concurrency_tickets    | 0
trx_isolation_level        | REPEATABLE READ
trx_unique_checks          | 1
trx_foreign_key_checks     | 1
trx_last_foreign_key_error | <null>
trx_adaptive_hash_latched  | 0
trx_adaptive_hash_timeout  | 0
trx_is_read_only           | 0
trx_autocommit_non_locking | 0
1 row in set
Time: 0.007s
```

所有表级别的锁的兼容性如下所示(其中S和X代表表级别的读锁和写锁):

 |X|IX|S|IS
---|---|---|---|---
X|Conflict|Conflict|Conflict|Conflict
IX|Conflict|Compatible|Conflict|Compatible
S|Conflict|Conflict|Compatible|Compatible
IS|Conflict|Compatible|Compatible|Compatible

## 一致性非锁定读

一致性非锁定读是指 InnoDB 存储引擎通过行多版本控制(multi version)的方式来读取当前执行时间数据库中行的数据。具体来说就是如果一个事务读取的行正在被锁定，那么它就会去读取这行数据之前的快照数据，而不会等待这行数据上的锁释放。这个读取流程如图1所示:

![图1](https://imgs.bwangel.me/2018-03-06-052802.png)

行的快照数据是通过undo段来实现的，而undo段用来回滚事务，所以快照数据本身没有额外的开销。此外，读取快照数据时不需要上锁的，因为没有事务会对快照数据进行更改。

MySQL 中并不是每种隔离级别都采用非一致性非锁定读的读取模式，而且就算是采用了一致性非锁定读，不同隔离级别的表现也不相同。在 READ COMMITTED 和 REPEATABLE READ 这两种隔离级别下，InnoDB存储引擎都使用一致性非锁定读。但是对于快照数据，READ COMMITTED 隔离模式中的事务读取的是当前行最新的快照数据，而 REPEATABLE READ 隔离模式中的事务读取的是事务开始时的行数据版本。

接下来我们通过一个例子来进行分析:

我们首先创建一个表`lock_test`，并向其中插入一条测试记录，如下所示:

```sql
CREATE TABLE `lock_test` (
  `id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

insert into lock_test select 1
```

接着我们开启一个事务A，事务A更新表中的记录:

```sql
begin;
update lock_test set id = 4 where id = 1;
```

在事务A还未提交的时候，我们再来开启一个事务B，从`lock_test`表中查询这条记录:

```sql
begin;
select * from lock_test where id = 1;

+------+
| id   |
|------|
| 1    |
+------+
1 row in set
Time: 0.006s
```

此时无论是在`READ COMMITTED`隔离级别下，还是在`READ REPEATABLE`隔离级别下，`lock_test`表中id为1的记录都能查找到，这是因为数据库事务的隔离性，未提交事务的更改不会影响到其他的事务。

然后我们把事务A提交，再在事务B中进行查找。

```sql
mysql root@(none):hp> select @@tx_isolation;
+------------------+
| @@tx_isolation   |
|------------------|
| REPEATABLE-READ  |
+------------------+
1 row in set
Time: 0.006s
mysql root@(none):hp> select * from lock_test where id = 1;
+------+
| id   |
|------|
| 1    |
+------+
1 row in set
Time: 0.006s

--------------------------------

mysql root@(none):hp> select @@tx_isolation;
+------------------+
| @@tx_isolation   |
|------------------|
| READ-COMMITTED   |
+------------------+
1 row in set
Time: 0.006s
mysql root@(none):hp> select * from lock_test where id = 1;
+------+
| id   |
|------|
+------+
0 rows in set
Time: 0.006s
```

此时我们可以看到，事务B在`READ COMMITTED`和`READ REPEATABLE`这两种不同的隔离级别下查找的结果不同。这个原因我们在上文中已经提过了，在`READ COMMITTED`隔离级别下读取的是行记录的最新快照版本，而在`READ REPEATABLE`隔离级别下读取的是事务开始时行数据版本。

其实，从数据库理论的角度来看，`READ COMMITTED`的隔离级别违反了事务的ACID特性中的隔离性。

## 一致性锁定读

### 锁的阻塞分析

#### Infomation Schema 中关于事务和锁的表

## 自增长与锁

### MySQL 插入分类

### InnoDB 锁类型

#### AUTO-INC Locking

#### 轻量级互斥量锁

### InnoDB 锁模式

## 外键与锁

在子表中插入时会在父表上一个S锁。

## 锁的算法

### 记录锁

### 区间锁

### next-key 锁

只有一个主键索引的情况:

  + 如果锁定的记录存在，就使用记录锁
  + 如果锁定的记录不存在，那么就锁定这个记录所在的区间

## 死锁的概念

## 参考文献

1. https://dev.mysql.com/doc/refman/5.7/en/innodb-locking.html#innodb-intention-locks
2. https://dev.mysql.com/doc/refman/5.7/en/lock-tables.html
3. https://www.percona.com/blog/2012/07/31/innodb-table-locks/
