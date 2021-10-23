---
title: "Redis 备份恢复的正确步骤"
date: 2021-10-23T17:36:43+08:00
lastmod: 2021-10-23T17:36:43+08:00
draft: false
tags: [tips, redis]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

0. 清空数据目录下的 dump.rdb 和 appendonly.aof 文件
1. 将备份的 rdb 文件拷贝到 redis 的数据目录下 (`dir`选项配置了数据目录)
2. 修改配置文件，设置 `appendonly no`
3. 启动 redis-server
4. 通过 redis-cli 开启 appendonly 备份: `CONFIG SET appendonly yes`
5. 同时修改配置文件，开启 aof 备份

## 注意

必须要关闭 appendonly 后，rdb 备份才能正确回复，否则恢复出来的数据是空的

## 原因

redis server 启动后会生成 appendonly.aof 文件，在 dump.rdb 和 appendonly.aof 文件同时存在的时候，会优先恢复 appendonly.aof 文件，由于 appendonly.aof 是空的，redis server 中的数据也会变成空的。

