
__摘要__:

> 这是一篇关于MySQL的文章，主要介绍 MySQL 常用函数

<!--more-->
MySQL常用函数
=============

## 1. 字符串函数

+ 合并字符串函数: `CONCAT()`

```sql
mysql> select concat('love', ' xff');
+------------------------+
| concat('love', ' xff') |
+------------------------+
| love xff               |
+------------------------+
1 row in set (0.01 sec)

-- 遇到空值，整个结果为NULL
mysql> select concat('love', ' xff', NULL);
+------------------------------+
| concat('love', ' xff', NULL) |
+------------------------------+
| NULL                         |
+------------------------------+
1 row in set (0.00 sec)
```

+ 合并字符串函数: `CONCAT_WS()`,可以指定分隔符

```sql
-- 第一个参数为分隔符

mysql> select concat_WS('-', 'love', 'xff');
+-------------------------------+
| concat_WS('-', 'love', 'xff') |
+-------------------------------+
| love-xff                      |
+-------------------------------+
1 row in set (0.00 sec)
```

+ 字符串比较函数: `STRCMP()`

```sql
mysql> select STRCMP('ab', 'aa'),        STRCMP('ab', 'ab'),        STRCMP('ab', 'ac');
+--------------------+--------------------+--------------------+
| STRCMP('ab', 'aa') | STRCMP('ab', 'ab') | STRCMP('ab', 'ac') |
+--------------------+--------------------+--------------------+
|                  1 |                  0 |                 -1 |
+--------------------+--------------------+--------------------+
1 row in set (0.00 sec)
```

+ 获取字符串长度: `LENGTH()`

```sql
mysql>  select length('xff');
+---------------+
| length('xff') |
+---------------+
|             3 |
+---------------+
1 row in set (0.00 sec)
```

+ 大小写转换: `UPPER(), LOWER()`

```sql
mysql> select UPPER('xff'), LOWER('XFF');
+--------------+--------------+
| UPPER('xff') | LOWER('XFF') |
+--------------+--------------+
| XFF          | xff          |
+--------------+--------------+
1 row in set (0.00 sec)
```

+ 字符串位置查找: `FIND_IN_SET()`

```sql
mysql> select FIND_IN_SET('BEIJING', 'HONGKANG,BEIJING');
+--------------------------------------------+
| FIND_IN_SET('BEIJING', 'HONGKANG,BEIJING') |
+--------------------------------------------+
|                                          2 |
+--------------------------------------------+
1 row in set (0.00 sec)
```

+ 截取字符串函数: `LEFT()`, `RIGHT()`, `SUBSTRING()`, `MID()`

```sql
mysql> select left('beijing', 3), right('beijing', 4), mid('beijing welcome you', 9, 7);
+--------------------+---------------------+----------------------------------+
| left('beijing', 3) | right('beijing', 4) | mid('beijing welcome you', 9, 7) |
+--------------------+---------------------+----------------------------------+
| bei                | jing                | welcome                          |
+--------------------+---------------------+----------------------------------+
1 row in set (0.00 sec)

-- SUBSTRING函数和MID函数相同
```

+ 字符串去除空格函数: `LTRIM`, `RTRIM`, `TRIM`

```sql
-- 三个函数分别为去除左边空格，右边空格和两边空格
mysql> select concat('|', LTRIM('     xff        '), '|'),
    ->        concat('|', RTRIM('     xff        '), '|'),
    ->        concat('|', TRIM('     xff        '), '|')\G
*************************** 1. row ***************************
concat('|', LTRIM('     xff        '), '|'): |xff        |
concat('|', RTRIM('     xff        '), '|'): |     xff|
 concat('|', TRIM('     xff        '), '|'): |xff|
1 row in set (0.00 sec)
```

+ 字符串替换函数: `REPLACE`

```sql
mysql> select replace('Beijing welcome you', 'Beijing', 'MySQL');
+----------------------------------------------------+
| replace('Beijing welcome you', 'Beijing', 'MySQL') |
+----------------------------------------------------+
| MySQL welcome you                                  |
+----------------------------------------------------+
1 row in set (0.00 sec)
```

## 2. 数值函数

+ 获取随机数: `RAND()`

```sql
-- 返回0 ~ 1之间的随机数
mysql> select RAND();
+---------------------+
| RAND()              |
+---------------------+
| 0.25700983522181386 |
+---------------------+
1 row in set (0.00 sec)
```

+ 四舍五入函数(圆整): `ROUND()`

```sql
-- 第二个参数为精度，如果没有指定精度则返回的是整数
mysql> select ROUND(3.14159), ROUND(3.145927, 3);
+----------------+--------------------+
| ROUND(3.14159) | ROUND(3.145927, 3) |
+----------------+--------------------+
|              3 |              3.146 |
+----------------+--------------------+
1 row in set (0.00 sec)
```

## 3. 时间和日期函数

+ 当前时间和日期

```sql
-- 分别为获取当前日期，时间，日期和时间
mysql> select CURDATE(), CURTIME(), NOW();
+------------+-----------+---------------------+
| CURDATE()  | CURTIME() | NOW()               |
+------------+-----------+---------------------+
| 2016-02-26 | 08:14:05  | 2016-02-26 08:14:05 |
+------------+-----------+---------------------+
1 row in set (0.00 sec)
```

+ 获取时间和日期各部分

```sql
-- 顾名思义
mysql> select  now(),
               year(now()),
               quarter(now()), -- 季度
               month(now()),
               week(now()),    -- 第几周
               dayofmonth(now()),
               hour(now()),
               minute(now()),
               second(now())\G
*************************** 1. row ***************************
            now(): 2016-02-26 08:17:02
      year(now()): 2016
   quarter(now()): 1
     month(now()): 2
      week(now()): 8
dayofmonth(now()): 26
      hour(now()): 8
    minute(now()): 17
    second(now()): 2
1 row in set (0.00 sec)
```
## 4. 系统信息函数

```sql
mysql> select version(),
    ->        database(),
    ->        user(),
    ->        last_insert_id(); --最近一次auto_increment的数值
+-------------------------+------------+----------------+------------------+
| version()               | database() | user()         | last_insert_id() |
+-------------------------+------------+----------------+------------------+
| 5.6.28-0ubuntu0.14.04.1 | NULL       | root@localhost |                0 |
+-------------------------+------------+----------------+------------------+
1 row in set (0.00 sec)
```
