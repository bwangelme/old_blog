---
title: '17. MySQL日志管理.md'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__: 这是一篇关于MySQL的文章，主要介绍17. MySQL日志管理
<!-- more -->
MySQL日志管理
=============


## 1. MySQL日志

错误日志: 记录MySQL服务器启动、关闭及运行错误等信息
二进制日志: 以二进制的方式记录数据库中除SELECT以外的所有操作
查询日志: 记录查询的信息
慢查询日志: 记录执行时间超过指定时间的操作
中继日志: 备库将主库的日志复制到自己的中继日志中
通用日志: 审计哪个账号、在哪个时段、做了哪些事情
事务日志或称redo日志: 记录InnoDB事务相关如事务执行时间，检查点等

## 2. 二进制日志

### 2.1.1 启用

```sh
# /etc/my.cnf

[mysqld]
log-bin[=dir\[filename]]
# server mysqld restart
```

### 2.2 暂停二进制日志记录(当前会话)

```sh
# 暂停
mysql> SET SQL_LOG_BIN=0;

# 启用
mysql> SET SQL_LOG_BIN=1;
```

### 2.3 日志说明

重启MySQL，就会产生一个新的mysql-bin的日志

### 2.4 查看日志

```sh
# 查看MySQL二进制的日志

pwd
/usr/local/mysql/data
mysqlbinlog mysql-bin.000002

# at 120 表名从第120个字节开始
# 下面这句表名了执行时间(年月日 时分秒)和服务器id
#160314  2:07:47 server id 1  end_log_pos 214 CRC32 0xa10bdfa4 	Query	thread_id=1	exec_time=0	error_code=0
SET TIMESTAMP=1457892467/*!*/;
SET @@session.pseudo_thread_id=1/*!*/;
SET @@session.foreign_key_checks=1, @@session.sql_auto_is_null=0, @@session.unique_checks=1, @@session.autocommit=1/*!*/;
SET @@session.sql_mode=1075838976/*!*/;
SET @@session.auto_increment_increment=1, @@session.auto_increment_offset=1/*!*/;
/*!\C utf8 *//*!*/;
SET @@session.character_set_client=33,@@session.collation_connection=33,@@session.collation_server=33/*!*/;
SET @@session.lc_time_names=0/*!*/;
SET @@session.collation_database=DEFAULT/*!*/;
create database xff1
/*!*/;
DELIMITER ;
# End of log file
```
