---
title: MongoDB备份与回复
date: 2016-04-19 11:58:26
tags: [MongoDB]
---

__摘要__:

> 主要介绍了JSON/CSV格式备份与二进制格式备份两种方式。

<!--more-->
# 概览

JSON或CSV格式的备份与回复为了与其他数据库进行同步。
二进制格式的备份与回复主要起到了备份的功能。

# JSON or CSV格式导入导出

MongoDB导出

```sh
mongoexport -d xff -c stu -f _id,name -q '{_id: {$lte:1000}}' -o ./xff.stu.json

-d 数据库
-c 集合名字
-f 列名
-q 查询语句
--csv 输出csv格式 #建议用--type=csv替代
```

MongoDB导入

```sh
mongoimport -d xff -c stu2 --file ./xff.stu.json
# 导入JSON格式

mongoimport -d xff -c stu3 --type=csv --headerline --file ./xff.stutest.csv
# 导入CSV格式

-d 数据库
-c 集合名字
```

# 二进制的导入导出


```sh
mongodump -d xff -o dump

-d 代表数据库
-o 代表备份文件的位置
```

```sh
mongorestore --dir=dump

# 恢复dump文件夹中的所有数据库

mongorestore -d xff2 --dir=dump/xff

# 恢复备份的xff数据库到xff2数据库中
```
