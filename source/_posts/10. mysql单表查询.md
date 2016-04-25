---
title: '10. mysql单表查询.md'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__: 这是一篇关于MySQL的文章，主要介绍10. mysql单表查询
<!-- more -->
MySQL单表查询
=============

## 0. 试验表

```sql
mysql> desc employee;
+-----------------+-----------------------+------+-----+---------+----------------+
| Field           | Type                  | Null | Key | Default | Extra          |
+-----------------+-----------------------+------+-----+---------+----------------+
| emp_id          | int(11)               | NO   | PRI | NULL    | auto_increment |
| emp_name        | varchar(30)           | YES  |     | NULL    |                |
| sex             | enum('male','female') | YES  |     | NULL    |                |
| hire_date       | date                  | YES  |     | NULL    |                |
| post            | varchar(50)           | YES  |     | NULL    |                |
| job_description | varchar(100)          | YES  |     | NULL    |                |
| salary          | double(15,2)          | YES  |     | NULL    |                |
| office          | int(11)               | YES  |     | NULL    |                |
| dep_id          | int(11)               | YES  |     | NULL    |                |
+-----------------+-----------------------+------+-----+---------+----------------+
9 rows in set (0.06 sec)

```

## 1. 简单查询

+ select 查询字段

+ 避免重复`DISTINCT`，跟在`select`后面

+ 使用简单的四则运算(+, -, *, /或DIV，%或MOD)

+ 使用AS产生新字段

```sql
1. select post, salary*12 AS Annual_Salary from employee;
2. select post, salary*12 Annual_Salary from employee;
```

+ 定义显示格式

`CONCAT`函数用于连接字符串

```sql
select concat(emp_name, ' annual_salary: ', salary * 12) AS annual_salary from employee;
```

## 2. 通过条件查询

+ 条件表达式

比较运算符
`>, <, =, !=, >=, <=`

逻辑运算符
`AND或&&，OR或||，XOR，NOT或!`

+ 语法格式

```
SELECT 字段1，字段2..
  FROM 表名
  WHERE CONDITION[AND CONDITION];
```

+ 关键字BETWEEN

在一个范围之内

可以在`BETWEEN`前加上一个`NOT`

+ 关键字`IS NULL`

查找某个字段是否为`NULL`

+ 关键字`IN`集合查询

```sql
mysql> select emp_name, salary from employee
    -> where salary in (4000, 5000, 6000, 9000);
+----------+---------+
| emp_name | salary  |
+----------+---------+
| jack     | 5000.00 |
+----------+---------+
1 row in set (0.00 sec)

-- 以上语句等价于如下语句
mysql> select emp_name, salary from employee
where salary = 4000 or salary = 5000 or salary = 6000 or salary = 9000;
```

+ 关键字`LIKE`进行模糊查询

通配符

`%`代表的是0到多个字符

`_`代表的是一个字符


## 3. 查询排序

```sql

-- 通过salary来进行升序排序，再根据入职日期按照降序排列。
-- 即如果salary相同，再来比较hire_date

mysql> select emp_name, salary, hire_date from employee order by salary ASC, hire_date DESC;
+-----------+-----------+------------+
| emp_name  | salary    | hire_date  |
+-----------+-----------+------------+
| xff       |      NULL | NULL       |
| tianyun   |    600.00 | 2016-02-22 |
| christine |   2200.00 | 2016-02-26 |
| jack      |   5000.00 | 2016-02-22 |
| tom       |   5500.00 | 2016-02-22 |
| alice     |   7200.00 | 2016-02-23 |
| robin     |   8000.00 | 2016-02-22 |
| harry     |  60000.00 | 2016-02-22 |
| emma      | 200000.00 | 2016-02-22 |
+-----------+-----------+------------+
9 rows in set (0.00 sec)
```

## 4. 限制查询记录数

```sql
-- 限制输出两个
-- 从第三条开始输出，输出两条
select emp_name, dep_id from employee where dep_id = 100 LIMIT 2, 2;

-- LIMIT的起始位置从0开始
```

## 5. 使用集合函数

+ `count`: 对结果进行计数。

+ `max`: 查询结果中的最大值

+ `min`: 查询结果中的最小值

+ `avg`: 查询结果的平均值

+ `sum`: 查询结果的和

## 6. 分组查询

+ `GROUP BY`单独使用显示每个分组的第一个员工

```sql
mysql> select emp_id, dep_id from employee group by dep_id;
+--------+--------+
| emp_id | dep_id |
+--------+--------+
|      9 |   NULL |
|      1 |    100 |
|      5 |    101 |
|      7 |    102 |
+--------+--------+
4 rows in set (0.00 sec)
```

+ `GROUP BY`和`GROUP_CONCAT`一起使用

```sql
-- 将每个分组(dep_id)的对应字段(emp_name)连接起来
mysql> select dep_id,group_concat(emp_name) from employee group by dep_id;
+--------+------------------------+
| dep_id | group_concat(emp_name) |
+--------+------------------------+
|   NULL | xff                    |
|    100 | jack,tom,robin,alice   |
|    101 | tianyun,harry          |
|    102 | emma,christine         |
+--------+------------------------+
4 rows in set (0.00 sec)
```

+ `GROUP BY`和集合函数一起使用

```sql
-- 对每个分组(dep_id)的相应字段(emp_name)进行count统计
mysql> select dep_id,count(emp_name) from employee group by dep_id;

```

+ `GROUP BY`和`HAVING`一起使用

```sql
-- having表示对分组进行条件筛选
mysql> select dep_id,group_concat(emp_name) from employee group by dep_id having count(emp_name)) > 2;
+--------+------------------------+
| dep_id | group_concat(emp_name) |
+--------+------------------------+
|    100 | jack,tom,robin,alice   |
+--------+------------------------+
1 row in set (0.00 sec)
```

+ 按多个字段进行分组

```sql
-- 使用了多个分组条件(dep_id 和 post)
mysql> select dep_id, post, group_concat(emp_name) from employee group by dep_id,post;
+--------+------------+------------------------+
| dep_id | post       | group_concat(emp_name) |
+--------+------------+------------------------+
|   NULL | wife       | xff                    |
|    100 | instructor | jack,tom,robin,alice   |
|    101 | hr         | tianyun,harry          |
|    102 | sale       | emma,christine         |
+--------+------------+------------------------+
4 rows in set (0.00 sec)
```

## 7. 正则表达式

```sql
-- 使用正则表达式对字符类型字段进行匹配
mysql> select emp_name from employee where emp_name REGEXP '^ali';
+----------+
| emp_name |
+----------+
| alice    |
+----------+
1 row in set (0.00 sec)
```
