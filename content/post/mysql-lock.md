---
title: "MySQL 乐观锁和悲观锁"
date: 2017-12-09T10:34:15+08:00
draft: true
tags: [MySQL, ]
---


MySQL 乐观锁和悲观锁
==================

## MySQL 悲观锁

`select ... for update`

### 数据库主键对于锁的影响

+ 使用悲观锁需要关闭 MySQL 的`autocommit`
+ 在一个事务中，执行`select ... for update`或锁住当前行
	+ __注意:__
		+ 只有使用主键查询才会使用行锁
		+ 使用非主键查询会使用表锁
		+ 使用主键进行不精确查询会使用行锁锁住多行
+ 当前事务提交或回滚之后才会释放这个锁
+ 如果在另外一个事务中执行`select ...`语句会正常执行，在另一个事务中执行`select ... for update`的时候这条语句会阻塞

### 索引对于锁的影响

## 参考链接

1. [mysql悲观锁总结和实践](http://chenzhou123520.iteye.com/blog/1860954)