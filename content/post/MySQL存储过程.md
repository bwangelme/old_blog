---
title: 'MySQL存储过程'
date: 2016-04-10 10:56:54
tags: [MySQL]
---

__摘要__:

> 这是一篇关于MySQL的文章，主要介绍 MySQL 存储过程

<!--more-->
MySQL存储过程
=============

## 1. 存储过程简介

代码的封装，具有自己的变量和控制语句

## 2. 创建储存过程

+ 基本语法

```sql
  -- 重新定义分隔符
  delimiter $$

  create procedure sp_name()
    begin
    ...
    end$$

  -- 更改分隔符
  delimiter ;

  -- 调用
  call sp_name()
```

## 3. 查看存储过程

+ 通过`show`语句

```sql
show procedure status\G
```

+ 通过查看系统表

```sql
desc information_shcema.routines;
select * from information_shcema.routines\G
```

+ 查看详细状态

```sql
show create procedure_user procedure_name\G
```

## 4. 删除存储过程

```sql
mysql> drop procedure if exists database_name.procedure_name;
```

## 5. 流程控制

### 5.1 循环

+ while

```sql
mysql> create table t1(id int);
mysql> delimiter $$
mysql> create procedure proce_while()
    -> begin
    -> declare i int; --声明了一个int类型的变量i
    -> set i = 1;
    -> while i < 5 do
    ->  insert into t1 values(i);
    ->  set i = i + 1;
    -> end while;
    -> end$$
mysql> delimiter ;
```

+ repeat

```sql
-- repeat 类似于do while
mysql> delimiter $$
mysql> create procedure proce_repeat()
    -> begin
    -> declare i int default 1; --创建一个int型变量且默认为1
    -> repeat
    ->   insert into t1 values(i);
    ->   set i = i + 1;
    ->   until i >= 6
    -> end repeat;
    -> end$$
Query OK, 0 rows affected (0.00 sec)
mysql> delimiter ;
```

+ loop

```sql
mysql> delimiter $$
mysql> create procedure proce_loop()
    -> begin
    -> declare i int default 1;
    -> xff: loop
    ->  insert into t1 values('xff'i);
    ->  set i = i + 1;
    ->  if i >= 6 then
    ->   leave xff;
    ->  end if;
    -> end loop;
    -> end$$
```

## 6. 输入输出类型

### 6.1 参数类型

+ in

这种类型的参数只在存储过程内部起作用

```sql
mysql> delimiter $$
mysql> create procedure proce_param_in(in id int)
    -> begin
    ->  if(id is null) then
    ->   select 'id is null' as id_null; --会打印一句话
    ->  else
    ->   set id = id + 1;
    ->  end if;
    ->  select id as id_inside;  -- 会打印出id的值
    -> end$$
Query OK, 0 rows affected (0.01 sec)

mysql> delimiter ;
mysql> call proce_param_in(null);
+------------+
| id_null    |
+------------+
| id is null |
+------------+
1 row in set (0.00 sec)

+-----------+
| id_inside |
+-----------+
|      NULL |
+-----------+
1 row in set (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

mysql> set @id = 20; --设置一个变量id = 20
Query OK, 0 rows affected (0.00 sec)

-- 存储过程里面的值改变并不影响存储过程外部的值
mysql> call proce_param_in(@id);
+-----------+
| id_inside |
+-----------+
|        21 |
+-----------+
1 row in set (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

mysql> select @id;
+------+
| @id  |
+------+
|   20 |
+------+
1 row in set (0.00 sec)

```

+ out

需要传入一个变量，存储过程会改变这个变量，变量的值是无法传入的

```sql
mysql> delimiter $$
mysql> create procedure proce_param_out(out id int)
    -> begin
    ->   select id as id_inside_1;
    ->   if(id is not null) then
    ->     set id = id + 1;
    ->     select id as id_inside_2;
    ->   else
    ->     select 100 into id;
    ->   end if;
    ->   select id as id_inside_3;
    -> end$$
Query OK, 0 rows affected (0.01 sec)

mysql> delimiter ;

mysql> set @id = null;
Query OK, 0 rows affected (0.00 sec)

-- 不会把参数的值传入到存储过程中
mysql> call proce_param_out(@id);
+-------------+
| id_inside_1 |
+-------------+
|        NULL |
+-------------+
1 row in set (0.00 sec)

+-------------+
| id_inside_3 |
+-------------+
|         100 |
+-------------+
1 row in set (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

-- 这里更改了id变量的值
mysql> select @id;
+------+
| @id  |
+------+
|  100 |
+------+
1 row in set (0.00 sec)
```

+ in out

```sql
mysql> delimiter $$
mysql> create procedure proce_param_inout(inout id int)
    -> begin
    ->  select id as id_inside_1;
    ->  if(id is not null) then
    ->   set id = id + 1;
    ->   select id as id_inside_2;
    ->  else
    ->   select 100 into id;
    ->  end if;
    ->  select id as id_inside_3;
    -> end$$
Query OK, 0 row affected (0.00 sec)

mysql> select 100 into @id;
Query OK, 1 row affected (0.00 sec)

-- 会把id的值传入存储过程并改变
mysql> call proce_param_inout(@id);
+-------------+
| id_inside_1 |
+-------------+
|         100 |
+-------------+
1 row in set (0.00 sec)

+-------------+
| id_inside_2 |
+-------------+
|         101 |
+-------------+
1 row in set (0.00 sec)

+-------------+
| id_inside_3 |
+-------------+
|         101 |
+-------------+
1 row in set (0.00 sec)

Query OK, 0 rows affected (0.00 sec)

mysql> select @id;
+------+
| @id  |
+------+
|  101 |
+------+
1 row in set (0.00 sec)
```
