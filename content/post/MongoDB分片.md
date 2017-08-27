---
title: MongoDB分片
date: 2016-04-22 11:18:06
tags: [MongoDB]
---

__摘要__:

> 本文主要讲述MongoDB分片的原理以及MongDB如何配置分片服务，设置ChunkSize大小。

<!--more-->

## MongoDB分片原理概述

分片需要如下要素:

1. 要有N个MongoD服务器存储数据做片节点
2. 要有Config Server维护meta信息
3. 要启动MongoS做路由
4. 要设定好数据的分片规则(Config Server才能维护)

如下图所示

![原理图](/images/MongoDB_shard_1.png)

## 启动过程

### 启动两台shard实例

```sh
mongod --dbpath /home/m17/ --logpath /home/mlog/m17.log --fork --port 27017 --smallfiles
mongod --dbpath /home/m18/ --logpath /home/mlog/m18.log --fork --port 27018 --smallfiles
```

### 启动Config Server服务器

```sh
mongod --dbpath /home/m20/ --logpath /home/mlog/m20.log --fork --port 27020 --configsvr
```

### 启动MongoS服务器

```sh
mongos --logpath /home/mlog/m30.log --port 30000 --configdb 192.168.21.130:27020 --fork
```

### 为COnfig Server添加分片节点

```sh
root@vv2x:/home/michael# mongo --port 30000
MongoDB shell version: 3.2.0
connecting to: 127.0.0.1:30000/test
Welcome to the MongoDB shell.
mongos> sh.addShard('192.168.21.130:27017');
{ "shardAdded" : "shard0000", "ok" : 1 }
mongos> sh.addShard('192.168.21.130:27018');
{ "shardAdded" : "shard0001", "ok" : 1 }
mongos> sh.sta
mongos> sh.status();
--- Sharding Status ---
  sharding version: {
    "_id" : 1,
    "minCompatibleVersion" : 5,
    "currentVersion" : 6,
    "clusterId" : ObjectId("57198ba481bf26385e2a2bc1")
}
  shards:
    {  "_id" : "shard0000",  "host" : "192.168.21.130:27017" }
    {  "_id" : "shard0001",  "host" : "192.168.21.130:27018" }
  active mongoses:
    "3.2.0" : 1
  balancer:
    Currently enabled:  yes
    Currently running:  no
    Failed balancer rounds in last 5 attempts:  0
    Migration Results for the last 24 hours:
        No recent migrations
  databases:
```

### 为Config Server设置分片规则

```sh
mongos> sh.enableSharding('shop'); #设置某个数据库开启分片
{ "ok" : 1 }
mongos> sh.shardCollection('shop.goods', {goods_id: 1});
# 设置某个collection的分片规则，依据goods_id分片, goods_id为片键
{ "collectionsharded" : "shop.goods", "ok" : 1 }
```

## MongoDB chunk规则

+ N篇文档形成一个块`Chunk`， 优先放在某个片上。
+ 当这片上的chunk，与另一个片的chunk，区别比较大时，(>=3)，会把本片上的chunk，移到另一个片上。
+ 以chunk为单位，维护片之间的平衡。

更改`ChunkSize`

```sh
# 登陆到MongoS服务器
use config;
db.settings.save({_id: 'chunksize', value: 1}); # 单位为M
```
