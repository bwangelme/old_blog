---
title: 'MySQL视图'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__:
> 这是一篇关于MySQL的文章，主要介绍MySQL视图


<!-- more -->
MySQL视图
=========

##1. 基本概念

视图里存储的内容和原始表一样，但是里面存储的是SQL查询语句的定义，存储的是SQL的定义

视图的优点

1. 安全：可以隐藏一些数据
2. 一些复杂的数据可以便于理解与使用

##2. 创建视图

```sql
CREATE [ALGORITHM = {UNDEFINED|MERGE|TEMPTABLE}]
  view 视图名[(字段1，字段2)]
  as select 语句
  [with [CASCADED|LOCAL|] CHECK OPTION]

  --CHECK OPTION约束虚表的操作
```

```sql
create view 视图名
  as select 语句
```

建议用一个单独的数据库来存放视图

##3. 查看视图

查看某个数据库中的视图或者表
```sql
show table status from 数据库名字\G

*************************** 1. row ***************************
           Name: view_user
         Engine: NULL
        Version: NULL
     Row_format: NULL
           Rows: NULL
 Avg_row_length: NULL
    Data_length: NULL
Max_data_length: NULL
   Index_length: NULL
      Data_free: NULL
 Auto_increment: NULL
    Create_time: NULL
    Update_time: NULL
     Check_time: NULL
      Collation: NULL
       Checksum: NULL
 Create_options: NULL
        Comment: VIEW  --这里表示是视图
1 row in set (0.01 sec)

```

查看某一个具体视图
```sql
show table status from view like 'view_user'\G
```

查看某个视图的具体信息
```sql
show create view view_user\G
```

##4. 修改视图

###4.1 替换原有视图
```sql
mysql> create or replace view view_user as select
    -> Host, User, Password from mysql.user;
```

###4.2 利用`alter`修改视图

```sql
alter view view_user as select Host, User from mysql.user;
```

##5. 删除视图

```sql
DROP VIEW view_name;
```

##6. 通过视图操作基表

`SELECT`, `INSERT`, `UPDATE`都可以

`INSERT`只能应用于存在于一个表上的视图(多表连接的视图不行)，而且如果省略的值没有默认值也回有警告。
