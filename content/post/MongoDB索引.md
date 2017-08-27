---
title: 'MongoDB索引'
date: 2016-04-10 10:56:54
tags: [MongoDB]
---

__摘要__:

> 这是一篇关于MongoDB的文章，主要介绍索引


<!--more-->
查看查询计划

```js
db.stu.find(query).explain()
	"cursor" : "BasicCursor",   --- 说明索引没有发挥作用
	"nscannedObjects" : 1000,    --- 理论上要扫描多少行
	"cursor" : "BtreeCursor sn_1",  -- 用到了btree索引
```

索引
====

默认利用btree来创建索引

相关操作

查看当前索引
```js
db.student.getIndexes();
```

创建索引

```js
db.student.ensureIndex({name:-1}) -- 降序创建索引
```

删除索引

```js
db.student.dropIndex({name: -1}) -- 删除单个索引

db.student.dropIndexes();  -- 删除所有索引
```

多列创建索引
------------

```js
db.student.ensureIndex({sn:1, name:1})
```

把两个列的值绑定成一个整体来看

子文档索引
----------

查询子文档： `db.shop.find({'spc.area': 'taiwan'}, {_id: 0})`

给子文档添加文档：`db.shop.ensureIndex({'spc.area': 1});`

索引性质
--------

创建唯一索引：`db.teacher.ensureIndex({email:1},{unique: true})`

创建稀疏索引：`db.teacher.ensureIndex({email: 1}, {sparse: true})`

```js
> db.teacher.find()
{ "_id" : ObjectId("5678c99fff917ea632e5a6ca"), "email" : "a@gmail.com" }
{ "_id" : ObjectId("5678c9a3ff917ea632e5a6cb"), "email" : "b@gmail.com" }
{ "_id" : ObjectId("5678ca14ff917ea632e5a6cd"), "email" : "c@gmail.com" }
{ "_id" : ObjectId("5678ca5fff917ea632e5a6cf") }
```

其中最后一行没有email列，如果分别加普通和稀疏索引，
那么对于最后一行的email分别当初null和忽略最后一行来处理。
根据{email: nulll}来查询，前者能查到，而稀疏索引查不到


创建哈希索引：`db.teacher.ensureIndex({email: 1}, {sparse: true})`



重建索引
--------

一个表如果经过很多次修改后，导致表的文件产生空洞，索引文件也是

可以通过索引的重建来提高索引的效率，类似MySQL中的optimize tbale

`db.collections.reindex()`  -- 减少索引文件碎片
