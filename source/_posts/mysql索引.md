---
title: 'MySQL索引'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__:
> 这是一篇关于MySQL的文章，主要介绍MySQL索引


<!-- more -->
MySQL索引
=========

##1. 索引简介

索引在MySQL中也叫作键，是存储引擎用于快速找到记录的一种数据结构

索引优化应该是对查询性能优化最有效的手段了

相当于字典中的音序表，如果没有音序表，则需要一页一页去查

##2. 索引分类

|说明|普通索引|唯一索引|全文索引|单列索引|多列索引|空间索引|
|--|--|--|--|--|--|--|
|存储引擎|所有存储引擎支持(同样的索引，不同存储类型，实现不同)|只有Memory支持|5.5及之前前仅MyISAM支持| | | |
|特点|允许字段重复|不允许字段重复|针对`varchar`类型支持| |select语句条件有第一个字段时才会使用多列索引| | |

##3. 测试

###利用存储过程插入数据

```sql
mysql> delimiter $$ --设置分隔符为$$
-- 定义一个存储过程
mysql> create procedure autoinsert1()
    -> BEGIN
    -> declare i int default 1;
    -> while(i<20000)do
    -> insert into school.t2 values(i, 'xff');
    -> set i=i+1
    -> end while;
    -> END$$
mysql> delimiter ; --还原分隔符为;
mysql> call autoinsert1(); --调用存储过程
```

创建存储过程要选择对应数据库，否则可能会报错

###创建索引

####1. 在创建表的时候创建索引

```sql
create table table_name(
字段名1 数据类型 [完整性约束条件],
字段名2 数据类型 [完整性约束条件],
[UNIQUE|FULLTEXT|SPATIAL] INDEX|KEY
[索引名] (字段名[(长度)] [ASC|DESC]) --ASC|DESC表示对索引进行排序
--字段名后的长度针对varchar类型
);
```

####2. 创建多列索引

select在条件中使用第一个字段时才会使用索引

```sql
--创建表
--这里第一个字段为dept_name

mysql> show create table dept4\G
*************************** 1. row ***************************
       Table: dept4
Create Table: CREATE TABLE `dept4` (
  `dept_id` int(11) NOT NULL,
  `dept_name` varchar(30) DEFAULT NULL,
  `comment` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`dept_id`),
  KEY `index_dept_name` (`dept_name`,`comment`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1
```

```sql
-- 使用了索引
-- explain 解释这句如何执行，但是并不实际执行
mysql> explain select * from dept4 where dept_name='sale'\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: dept4
         type: ref
possible_keys: index_dept_name  --这句表示使用了的索引的名字
          key: index_dept_name
      key_len: 33
          ref: const
         rows: 1                -- 一共查询了多少行
        Extra: Using where; Using index
1 row in set (0.01 sec)

mysql> explain select * from dept4 where comment='sale001'\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: dept4
         type: index
possible_keys: NULL           -- 这句表示没有使用索引
          key: index_dept_name
      key_len: 86
          ref: NULL
         rows: 4              -- 一共查询了多少行
        Extra: Using where; Using index
1 row in set (0.00 sec)
```

####3. 在已存在的表上创建索引

```sql
create [UNIQUE|FULLTEXT|SPATIAL] INDEX 索引名
    ON 表名(字段名[(长度)] [ASC|DESC]);

alter table 表名 ADD [UNIQUE|FULLTEXT|SPATIAL] INDEX 索引名(字段名[(长度)] [ASC|DESC]);
```

复制表

```sql
-- 复制了表的内容和结构，但是没有复制表的key(约束)
mysql> create table t3 select * from t2;

-- 下面两条，复制了表的结构，但是没有内容，也没有复制表的key(约束)
mysql> create table t4 select * from t2 where 1=2;
mysql> create table t5 like t2;
```


##4. 管理索引

查看索引
`show create table 表名\G`

测试示例
`explain select * from t2 where id = 1;`
查看查询优化器做了哪些操作

`DROP INDEX 索引名 ON 表名`
删除索引

##5. 扩展

[Sphinx](http://zh-sphinx-doc.readthedocs.org/en/latest/contents.html) 一个全文检索引擎，但是不支持中文。
[Coreseek](http://www.coreseek.cn/) 是一个可供企业使用的，基于Sphinx(可独立于Sphinx原始版本运行)的中文全文检索引擎
