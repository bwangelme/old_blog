MySQL日志管理
=============


## 1. MySQL日志分类

+ 错误日志: 记录MySQL服务器启动、关闭及运行错误等信息
+ 二进制日志: 以二进制的方式记录数据库中除SELECT以外的所有操作
+ 查询日志: 记录查询的信息
+ 慢查询日志: 记录执行时间超过指定时间的操作
+ 中继日志: 备库将主库的日志复制到自己的中继日志中
+ 通用日志: 审计哪个账号、在哪个时段、做了哪些事情
+ 事务日志或称redo日志: 记录InnoDB事务相关如事务执行时间，检查点等

## 2. 二进制日志

二进制日志记录了对 MySQL 数据库执行更改的所有操作，但是不包括`SELECT`和`SHOW`这类操作，因为这类操作对数据本身没有修改。

### 2.1 作用

+ __恢复(recovery)__: 在一个数据库的全备文件恢复后，可以通过二进制日志进行 point-in-time 的恢复

+ __复制(replication)__: 在 MySQL 复制中，主数据库发送记录了数据更改的事件给从数据库，从数据库应用这些事件来和主数据库进行同步

+ __审计(audit)__: 用户可以通过二进制日志中的信息来进行审计，判断是否有对数据库的注入攻击

### 2.2 二进制日志格式

MySQL 中一共存在着三种二进制日志格式`STATEMENT`, `ROW`, `MIXED`，可以配置`--binlog-format`选项来选择不同的格式。关于这三种格式的说明如下:

#### STATEMENT

基于SQL语句的二进制日志，这种格式对于复制有一定的要求:

+ 如果主数据库上执行了包含`rand`，`uuid`等语句的日志，会导致主从数据库的数据不一致。
+ 数据库的事务隔离级别如果是读提交的话，也可能会造成主从数据库的数据不一致。InnoDB 默认的事务隔离级别为可重复读，就是受日志格式的影响。

#### ROW

在这种模式下，二进制日志记录的不再是简单的SQL语句了，而是记录表的行更改情况。同时，这种格式还解决了`STATEMENT`格式在复制时遇到的问题。如果设置了`binlog-format`为`ROW`，可以将 MySQL 的事务隔离级别改成读提交，以获得更改的并发性。

#### MIXED

MIXED 格式默认使用 STATEMENT 格式来记录，但是在某些情况下会使用 ROW 格式来记录。可能的情况有:

1. 使用了`UUID()`, `USER()`, `CURRENT_USER()`, `FOUND_ROWS()`, `ROW_COUNT()`等不确定函数
2. 使用了`INSERT DELAY`语句
3. 使用了用户定义函数(UDF)
4. 使用了临时表 (temporary table)
5. 更多的情况请参看 [5.4.4.3 Mixed Binary Logging Format](https://dev.mysql.com/doc/refman/5.7/en/binary-log-mixed.html)。

### 2.3 日志格式的注意事项

+ 每台 MySQL 服务器只能设定自己的二进制日志格式，主服务器更改了日志格式后，并不会影响从服务器。
+ 如果使用的是 InnoDB 存储引擎，且事务隔离级别是`读提交`或`读未提交`的时候，只能设置日志格式为`ROW`。此时你也可以将二进制日志格式改成`STATEMENT`，但是此时 MySQL 会快速地报很多错误，因为 InnoDB 不能够再执行插入操作了。
+ 不建议在运行时切换 MySQL 复制的格式，因为临时表仅仅可以通过`ROW`格式的复制来记录，`STATEMENT`格式的复制并不会记录临时表。
+ 当使用`MIXED`的复制时，临时表通常都会记录，但是当使用了用户自定义函数或使用了`UUID()`函数就不会记录了。
+ 我们通常可以使用`ROW`日志格式来获得更好的可靠性，但是`ROW`日志格式会导致二进制日志文件非常大。

### 2.4 启用

```sh
# 编辑 MySQL 配置文件，添加以下的选项

[mysqld]
server-id = 1
log-bin[=base_name]
```

`base_name`是二进制日志文件的文件名，如果不指定`base_name`，默认会使用主机名作文二进制日志的文件名，后缀名是二进制日志的序列号，所在目录为数据库所在目录(`datadir`)。

开启了二进制日志后，会产生如下文件:

```
>>> ls /var/log/mysql/mysql-bin.*
/var/log/mysql/mysql-bin.000001  /var/log/mysql/mysql-bin.index
/var/log/mysql/mysql-bin.000002
```

`mysql-bin.index`为二进制日志的索引文件，用来存储过往产生的二进制日志序号。

`mysql-bin.000001`和`mysql-bin.000002`为实际存储数据的文件，每次重启MySQL，都会产生一个新的mysql-bin的日志。

### 2.5 暂停二进制日志记录(当前会话)

```sh
# 暂停
mysql> SET SQL_LOG_BIN=0;

# 启用
mysql> SET SQL_LOG_BIN=1;
```

### 2.6 查看日志

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
