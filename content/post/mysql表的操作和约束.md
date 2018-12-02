---
title: 'MySQL表的操作和约束'
date: 2016-04-10 10:56:54
tags: [MySQL]
---

__摘要__:

> 这是一篇关于MySQL的文章，主要介绍MySQL表的操作和约束


<!--more-->
## 1. 表的完整性约束

|表的约束关键字|作用|
|----|----|
|NOT NULL(UK)|约束强制列不接受NULL值|
|UNIQUE KEY(UK)|约束字段值唯一|
|DEFAULT|设置字段默认值|
|AUTO_INCREMENT|设置字段自增(类型必须是整数)|
|UNSIGNED|无符号，正数|

## 2. 唯一约束UNIQUE

```sql
# 创建命名的约束

mysql> create table dep2(
    -> dept_id int,
    -> dept_name varchar(30),
    -> comment varchar(50),
    -> constraint uk_dept_name unique(dept_name)
    -> );
```

## 3. 设置主键约束

```sql
# 创建命名的主键约束

create table dept6(
dept_id int,
dept_name varchar(30),
comment varchar(50),
constraint pk_id primary key(dept_id)
);
```

MySQL通过`show create table dept6`无法看到主键约束名字，正在寻找解决办法。

## 4. 外键约束

创建父表

```sql
CREATE TABLE `employees` (
  `name` varchar(20) NOT NULL,
  `mail` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1
```

创建子表

```sql
CREATE TABLE `payroll` (
  `id` int(5) NOT NULL,
  `name` varchar(20) NOT NULL,
  `payroll` float(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_name` (`name`),
  CONSTRAINT `fk_name` FOREIGN KEY (`name`) REFERENCES `employees` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1

```

**外键和主键的类型必须相同，varchar的长度也必须相同**

同步删除:`on delete cascade`
同步更新:`on update cascade`

上面那两个约束，父表改变，子表也回改变
