---
title: MongoDB复制集
date: 2016-04-20 10:34:01
tags: [MongoDB]
---

__摘要__:

> 本文主要讲述了MongoDB复制集的配置，动态修改及部分原理，最后创建了一个自动化部署的脚本。

<!--more-->

## 原理

`replication set` 多台服务器维护相同的数据副本，提高服务器的可用性

主服务器负责读写，从服务器保持和主服务器同样的数据集，从服务器为只读状态

![复制集原理示意图](/images/MongoDB_replication_set_1.jpg)

查看复制集的帮助`rs.help()`

## 创建复制集过程

### 创建目录

```sh
sudo mkdir /home/m17 /home/m18 /home/m19 /home/mlog
```

### 启动3个实例

```sh
sudo mongod --dbpath /home/m17 --logpath /home/mlog/m17.log --fork --port 27017 --replSet rs3
sudo mongod --dbpath /home/m18 --logpath /home/mlog/m18.log --fork --port 27018 --replSet rs3
sudo mongod --dbpath /home/m19 --logpath /home/mlog/m19.log --fork --port 27019 --replSet rs3

# --replSet声明这个实例属于某个复制集
```

### 配置复制集

登陆到任意一台服务器上

```javascript
/* 复制集的配置 */
var rsconf = {
  _id: 'rs3',
  members: [
  {
    _id:0,
    host: '192.168.21.130:27017'
  },
  {
    _id: 1,
    host: '192.168.21.130:27018'
  },
  {
    _id: 2,
    host: '192.168.21.130:27019'
  }
  ]
}
```

### 复制集的初始化

```javascript
rs.initiate(rsconf);

rs3:OTHER> rs.status()  /* 查看复制集状态 */
{
    "set" : "rs3",
    "date" : ISODate("2016-04-20T01:27:29.900Z"),
    "myState" : 1,
    "term" : NumberLong(1),
    "heartbeatIntervalMillis" : NumberLong(2000),
    "members" : [  /* 表示了当前复制集的成员 */
        {
            "_id" : 0,
            "name" : "192.168.21.130:27017",
            "health" : 1,
            "state" : 1,
            "stateStr" : "PRIMARY",
            "uptime" : 686,
            "optime" : {
                "ts" : Timestamp(1461115634, 2),
                "t" : NumberLong(1)
            },
            "optimeDate" : ISODate("2016-04-20T01:27:14Z"),
            "infoMessage" : "could not find member to sync from",
            "electionTime" : Timestamp(1461115634, 1),
            "electionDate" : ISODate("2016-04-20T01:27:14Z"),
            "configVersion" : 1,
            "self" : true
        },
        {
            "_id" : 1,
            "name" : "192.168.21.130:27018",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 26,
            "optime" : {
                "ts" : Timestamp(1461115634, 2),
                "t" : NumberLong(1)
            },
            "optimeDate" : ISODate("2016-04-20T01:27:14Z"),
            "lastHeartbeat" : ISODate("2016-04-20T01:27:28.052Z"),
            "lastHeartbeatRecv" : ISODate("2016-04-20T01:27:29.707Z"),
            "pingMs" : NumberLong(1),
            "syncingTo" : "192.168.21.130:27017",
            "configVersion" : 1
        },
        {
            "_id" : 2,
            "name" : "192.168.21.130:27019",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 26,
            "optime" : {
                "ts" : Timestamp(1461115634, 2),
                "t" : NumberLong(1)
            },
            "optimeDate" : ISODate("2016-04-20T01:27:14Z"),
            "lastHeartbeat" : ISODate("2016-04-20T01:27:28.054Z"),
            "lastHeartbeatRecv" : ISODate("2016-04-20T01:27:29.708Z"),
            "pingMs" : NumberLong(0),
            "syncingTo" : "192.168.21.130:27017",
            "configVersion" : 1
        }
    ],
    "ok" : 1
}
```

### 动态修改复制集成员

```javascript
/* 在primary实例上运行 */

/* 删除成员 */
rs3:PRIMARY> rs.remove('192.168.21.130:27019')

/* 添加成员 */
rs3:PRIMARY> rs.add('192.168.21.130:27018')
```

### 查看数据状态

secondary默认不能读写，只和primary保持通信

在secondary上添加`rs.slaveOk()`来确保能够正常读

在primary上添加数据，可以在secondary上看到数据被同步了。

### 数据库实例的角色切换

```javascript
/* 关闭primary */
rs3:PRIMARY> use admin
switched to db admin
rs3:PRIMARY> db.shutdownServer()

/* 此时其他实例会自动变成primary */
```

### 自动化部署

```sh
#!/bin/bash
#History:
#   Michael  4月,20,2016
#Program:
#

MONGOD=/usr/local/mongodb/bin/mongod
MONGO=/usr/local/mongodb/bin/mongo
IP=192.168.21.130
NA=rs3

sudo pkill -9 mongo
if [ -d /home/mlog ]
then
    sudo rm -rf /home/mlog || exit 1
fi
sudo mkdir -p /home/mlog || exit 2

for item in 17 18 19
do
    if [ -d /home/m${item} ]
    then
        sudo rm -rf /home/m${item} || exit 1
    fi
    sudo mkdir -p /home/m${item} || exit 2

    sudo $MONGOD --dbpath /home/m${item} --logpath /home/mlog/m${item}.log --port 270${item} --fork --smallfiles --replSet ${NA}
done

${MONGO} <<EOF
use admin
var rsconf = {
  _id: 'rs3',
  members: [
    { _id:0, host: '${IP}:27017' },
    { _id:1, host: '${IP}:27018' },
    { _id:2, host: '${IP}:27019' }
  ]
}
rs.initiate(rsconf);
EOF
```
