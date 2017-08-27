---
title: 'MySQL多表查询'
date: 2016-04-10 10:56:54
tags: [MySQL]
---

__摘要__:

> 这是一篇关于MySQL的文章，主要介绍11. MySQL多表查询


<!--more-->
MySQL多表查询
=============

## 1. 连接查询

+ 交叉连接: 生成笛卡尔积，它不使用任何匹配条件
+ 内连接: 只连接匹配的行
+ 外连接之左连接: 会显示左边表内所有的值，无论在右边的表内是否匹配
+ 外连接之右连接: 会显示右边表内所有的值，无论在左边的表内是否匹配
+ 全外连接: 包含左右两个表的全部行

## 2. 测试表结构与数据

```sql
mysql> desc department;
+-----------+--------------+------+-----+---------+-------+
| Field     | Type         | Null | Key | Default | Extra |
+-----------+--------------+------+-----+---------+-------+
| dept_id   | int(11)      | YES  |     | NULL    |       |
| dept_name | varchar(100) | YES  |     | NULL    |       |
+-----------+--------------+------+-----+---------+-------+
2 rows in set (0.01 sec)

mysql> desc employee;
+----------+-------------+------+-----+---------+----------------+
| Field    | Type        | Null | Key | Default | Extra          |
+----------+-------------+------+-----+---------+----------------+
| emp_id   | int(11)     | NO   | PRI | NULL    | auto_increment |
| emp_name | varchar(50) | YES  |     | NULL    |                |
| age      | int(11)     | YES  |     | NULL    |                |
| dept_id  | int(11)     | YES  |     | NULL    |                |
+----------+-------------+------+-----+---------+----------------+
4 rows in set (0.00 sec)

mysql> select * from department;
+---------+-----------+
| dept_id | dept_name |
+---------+-----------+
|     200 | hr        |
|     201 | it        |
|     202 | sale      |
|     203 | fd        |
+---------+-----------+
4 rows in set (0.00 sec)

mysql> select * from employee;
+--------+----------+------+---------+
| emp_id | emp_name | age  | dept_id |
+--------+----------+------+---------+
|      1 | tianyun  |   26 |     200 |
|      2 | tom      |   30 |     201 |
|      3 | jack     |   24 |     201 |
|      4 | alice    |   24 |     202 |
|      5 | robin    |   40 |     204 |
|      6 | natasha  |   28 |     204 |
+--------+----------+------+---------+
6 rows in set (0.00 sec)
```

## 3. 连接示例

### 3.1 交叉连接
```sql
mysql> select employee.emp_id, employee.emp_name, department.dept_name
    -> from employee, department;
+--------+----------+-----------+
| emp_id | emp_name | dept_name |
+--------+----------+-----------+
|      1 | tianyun  | hr        |
|      1 | tianyun  | it        |
|      1 | tianyun  | sale      |
|      1 | tianyun  | fd        |
|      2 | tom      | hr        |
|      2 | tom      | it        |
|      2 | tom      | sale      |
|      2 | tom      | fd        |
|      3 | jack     | hr        |
|      3 | jack     | it        |
|      3 | jack     | sale      |
|      3 | jack     | fd        |
|      4 | alice    | hr        |
|      4 | alice    | it        |
|      4 | alice    | sale      |
|      4 | alice    | fd        |
|      5 | robin    | hr        |
|      5 | robin    | it        |
|      5 | robin    | sale      |
|      5 | robin    | fd        |
|      6 | natasha  | hr        |
|      6 | natasha  | it        |
|      6 | natasha  | sale      |
|      6 | natasha  | fd        |
+--------+----------+-----------+
24 rows in set (0.01 sec)

-- 两个表连接产生了笛卡尔积(即两个集合内的元素全部相乘)
```

### 3.2 内连接

```sql
-- 这是一个内连接，只连接匹配的行

mysql> select employee.emp_id, employee.emp_name, department.dept_name
    -> from employee, department
    -> where employee.dept_id = department.dept_id;
+--------+----------+-----------+
| emp_id | emp_name | dept_name |
+--------+----------+-----------+
|      1 | tianyun  | hr        |
|      2 | tom      | it        |
|      3 | jack     | it        |
|      4 | alice    | sale      |
+--------+----------+-----------+
4 rows in set (0.03 sec)
```

### 3.3 左外连接

```sql
-- from 那一句表示employee去左连接department表
-- on 那一句表示条件
-- 左连接即是左边表中的所有字段都会显示出来，不管条件有没有匹配上

mysql> select employee.emp_id, employee.emp_name, department.dept_name
    -> from employee left join department
    -> on employee.dept_id = department.dept_id;
+--------+----------+-----------+
| emp_id | emp_name | dept_name |
+--------+----------+-----------+
|      1 | tianyun  | hr        |
|      2 | tom      | it        |
|      3 | jack     | it        |
|      4 | alice    | sale      |
|      5 | robin    | NULL      |
|      6 | natasha  | NULL      |
+--------+----------+-----------+
6 rows in set (0.01 sec)
```

### 3.4 右外连接

```sql
-- from 那一句表示employee去右连接department表
-- on 那一句表示条件
-- 右连接即是右边表中的所有字段都会显示出来，不管条件有没有匹配上

mysql> select employee.emp_id, employee.emp_name, department.dept_name
    -> from employee right join department
    -> on employee.dept_id = department.dept_id;
+--------+----------+-----------+
| emp_id | emp_name | dept_name |
+--------+----------+-----------+
|      1 | tianyun  | hr        |
|      2 | tom      | it        |
|      3 | jack     | it        |
|      4 | alice    | sale      |
|   NULL | NULL     | fd        |
+--------+----------+-----------+
5 rows in set (0.00 sec)
```

### 3.5 全外连接

```sql
-- 这是一个全外连接，包含左右两个表的所有行
mysql> select * from employee full join department;
+--------+----------+------+---------+---------+-----------+
| emp_id | emp_name | age  | dept_id | dept_id | dept_name |
+--------+----------+------+---------+---------+-----------+
|      1 | tianyun  |   26 |     200 |     200 | hr        |
|      1 | tianyun  |   26 |     200 |     201 | it        |
|      1 | tianyun  |   26 |     200 |     202 | sale      |
|      1 | tianyun  |   26 |     200 |     203 | fd        |
|      2 | tom      |   30 |     201 |     200 | hr        |
|      2 | tom      |   30 |     201 |     201 | it        |
|      2 | tom      |   30 |     201 |     202 | sale      |
|      2 | tom      |   30 |     201 |     203 | fd        |
|      3 | jack     |   24 |     201 |     200 | hr        |
|      3 | jack     |   24 |     201 |     201 | it        |
|      3 | jack     |   24 |     201 |     202 | sale      |
|      3 | jack     |   24 |     201 |     203 | fd        |
|      4 | alice    |   24 |     202 |     200 | hr        |
|      4 | alice    |   24 |     202 |     201 | it        |
|      4 | alice    |   24 |     202 |     202 | sale      |
|      4 | alice    |   24 |     202 |     203 | fd        |
|      5 | robin    |   40 |     204 |     200 | hr        |
|      5 | robin    |   40 |     204 |     201 | it        |
|      5 | robin    |   40 |     204 |     202 | sale      |
|      5 | robin    |   40 |     204 |     203 | fd        |
|      6 | natasha  |   28 |     204 |     200 | hr        |
|      6 | natasha  |   28 |     204 |     201 | it        |
|      6 | natasha  |   28 |     204 |     202 | sale      |
|      6 | natasha  |   28 |     204 |     203 | fd        |
+--------+----------+------+---------+---------+-----------+
24 rows in set (0.00 sec)
```
