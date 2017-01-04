---
title: 'MySQL数据类型_数值类型'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__:
> 这是一篇关于MySQL的文章，主要介绍MySQL数据类型_数值类型


<!-- more -->
## 1. 整数类型

|字段|mysql自带|字节数|
|----|---------|------|
|TINYINT|YES|1|
|SMALLINT| |2|
|MEDIUMINT|YES|3|
|INT或者INTEGER| |4|
|BGIINT|YES|8|

```sql
show warnings; # 查看警告

# 创建无符号整数字段, 默认是有符号的
create table test2(
    tinyint_test tinyint unsigned,
    int_test int unsigned
    );
```

```sql
mysql> create table test4(
    -> id1 int zerofill,
    -> id2 int(6) zerofill)
    -> ;

# 如果不够显示字段，自动补充0，由于是以0开始，所以默认会是unsigned的
```

## 2. 浮点数类型

|类型|字节|
|Float|4|
|Double|8|

也有精度和标度的概念,超过精度会四舍五入

**错误示例**

```sql
create table test5(float_test float(5,2))

insert into test5 values(1111.2)

# 最终存入的会是999.99,因为已经超出整数位了(三位)
```

## 3. 定点数类型

在MySQL内部以字符串存储,精度比浮点数更高。

```sql
DEC(M, D)

# M: 精度，一共的位数
# D: 标度，小数点后的位数

默认情况下，M=10，D=0，不能存储小数。
```

## 4. 位类型

多位二进制数，范围是1-64二进制数，默认是一位

字节是1 - 8

```sql
create table test6(id, bit(位数))

# id是一个bit类型的整型，表示一个二进制数，括号里面跟位数，默认是1

select bin(id), oct(id), hex(id) from test6;

# 将二进制数id，以二进制，八进制，十六进制的数字字符串的形式来显示。
```

## 5. 日期和时间类型

日期和时间类型|字节|最大值|最小值
----|----|
DATE|4|
DATETIME|8|1000-01-01 00:00:00|9999-12-31 23:59:59|
TIMESTAMP|4|19700101080001|2038年的某个时刻|
TIME|3|-835:59:59|838:59:59|
YEAR|1|1901|2155

```
YEAR <=69 会以20开头，>=70会以19开头
```

## 6. 建议

### 1. 浮点数

用户身高，体重，薪水等。

### 2. 定点数

存储货币等高精度要求的数据。

### 3. 位类型

注意使用相应函数`bin oct hex`去查看相应的数据。
