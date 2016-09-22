---
title: 'MySQL触发器'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__:
> 这是一篇关于MySQL的文章，主要介绍9. MySQL触发器
<!-- more -->
MySQL触发器
===========

##1. 概念

触发器(Trigger)是一个特殊的存储过程，它的执行不是由程序调用，也不是手工启动，而是由事件触发。
触发器经常用于加强数据的完整性约束和业务规则等。

##2. 语法

```sql
CREATE TRIGGER 触发器名称 BEFORE|AFTER 触发事件
  ON 表名 FOR EACH ROW
  BEGIN
    触发器程序体
  END

-- 触发器名称，它和MySQL中其他对象的命名方式
-- {BEFORE|AFTER} 触发器触发的时机
-- {INSERT|UPDATE|DELETE} 触发器事件
-- FOR EACH ROW 子句通知触发器每隔一行执行一次动作，而不是对整个表执行一次。
--   (针对insert和delete语句，每一行都触发)
```

```sql
mysql> desc student;
+-------+------------------+------+-----+---------+----------------+
| Field | Type             | Null | Key | Default | Extra          |
+-------+------------------+------+-----+---------+----------------+
| id    | int(10) unsigned | NO   | PRI | NULL    | auto_increment |
| name  | varchar(50)      | YES  |     | NULL    |                |
+-------+------------------+------+-----+---------+----------------+
2 rows in set (0.02 sec)

mysql> desc student_total;
+-------+---------+------+-----+---------+-------+
| Field | Type    | Null | Key | Default | Extra |
+-------+---------+------+-----+---------+-------+
| total | int(11) | YES  |     | NULL    |       |
+-------+---------+------+-----+---------+-------+
1 row in set (0.01 sec)

mysql> delimiter &&
mysql> create trigger student_insert_trigger after insert
    -> on student for each row
    -> BEGIN
    ->   update student_total set total=total+1;
    -> END&&
mysql> delimiter ;
```

##3. 查看触发器

通过show语句查看

```sql
show triggers\G
```

通过系统表查看

```sql
use information_shcema;
select * from tirggers\G
select * from triggers where TRIGGER_NAME = '触发器名称'\G
```

##4. 删除触发器

```sql
drop trigger 触发器名称
```

##5. 触发器示例

```sql
--安全地删除表

drop table if exists tab1;
```

###5.1 增加tab1表记录后自动将记录添加到tab2中

####5.1.1表结构

```sql
mysql> desc tab1;
+---------+-------------+------+-----+---------+-------+
| Field   | Type        | Null | Key | Default | Extra |
+---------+-------------+------+-----+---------+-------+
| tab1_id | varchar(50) | YES  |     | NULL    |       |
+---------+-------------+------+-----+---------+-------+
1 row in set (0.02 sec)

mysql> desc tab2;
+---------+-------------+------+-----+---------+-------+
| Field   | Type        | Null | Key | Default | Extra |
+---------+-------------+------+-----+---------+-------+
| tab2_id | varchar(50) | YES  |     | NULL    |       |
+---------+-------------+------+-----+---------+-------+
1 row in set (0.00 sec)
```

####5.1.2 创建触发器

触发器中`new`和`old`的作用

1. 针对update操作，`new`表示的是更新后的值，`old`表示的是原来的数据。
2. 针对insert操作，`new`表示的是插入的值。
3. 针对delete操作，`old`表示的是删除后的值。

触发器命名规范

表名_触发时机_动作

```sql
-- 插入触发器
mysql> delimiter $$
mysql> create trigger tab1_after_insert after insert
    -> on tab1 for each row
    -> BEGIN
    ->   insert into tab2(tab2_id) values(new.tab1_id);
    -> END
    -> $$
Query OK, 0 rows affected (0.02 sec)

mysql> delimiter ;
```

```sql
-- 删除触发器
mysql> delimiter $$
mysql> create trigger tab1_delete_after after delete
    -> on tab1 for each rows
    -> BEGIN
    ->   delete from tab2 where tab2_id = old.tab1_id;
    -> END
    -> $$
Query OK, 0 rows affected (0.01 sec)

mysql> delimiter ;

```

###5.2 记录学生表的更新

####5.2.1 表结构

```sql
-- 学生表
mysql> desc student1;
+--------------+-----------------------+------+-----+---------+----------------+
| Field        | Type                  | Null | Key | Default | Extra          |
+--------------+-----------------------+------+-----+---------+----------------+
| student_id   | int(11)               | NO   | PRI | NULL    | auto_increment |
| student_name | varchar(30)           | NO   |     | NULL    |                |
| student_sex  | enum('male','female') | YES  |     | male    |                |
+--------------+-----------------------+------+-----+---------+----------------+
3 rows in set (0.00 sec)

-- 更新记录表
mysql> desc update_student1;
+---------------+---------+------+-----+---------+----------------+
| Field         | Type    | Null | Key | Default | Extra          |
+---------------+---------+------+-----+---------+----------------+
| update_record | int(11) | NO   | PRI | NULL    | auto_increment |
| student_id    | int(11) | NO   |     | NULL    |                |
| update_date   | date    | YES  |     | NULL    |                |
+---------------+---------+------+-----+---------+----------------+
3 rows in set (0.00 sec)
```

####5.2.2 创建触发器

```sql
-- 更新学生表的同时也更新记录表
delimiter $$
mysql> create trigger student1_update_after after update
    -> on student1 for each row
    -> BEGIN
    ->  if new.student_id != old.student_id then
    ->   update update_student1 set student_id = new.student_id, update_date = now()
    ->   where student_id = old.student_id;
    ->  end if;
    -> END
    -> $$
delimiter ;
```

```sql
-- 删除学生表的时候也删除记录表
mysql> delimiter $$
mysql> create trigger student1_delete_before before delete
    -> on student1 for each row
    -> BEGIN
    ->  delete from update_student1
    ->  where student_id = old.student_id;
    -> END
    -> $$
delimiter ;
```
