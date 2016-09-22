---
title: 'MySQL安全机制'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__:
> 这是一篇关于MySQL的文章，主要介绍 MySQL 安全机制
<!-- more -->
MySQL安全机制
=============

## 1. 权限表

mysql数据库中的表

+ mysql.user

用户字段: Host, User, Password
权限字段: _priv结尾的字段
安全字段: ssl x509字段
资源控制字段: max_开头的字段

+ mysql.db

用户字段: Host, User, Db
权限字段: 剩下的_priv结尾的字段

+ mysql.tables_priv, mysql.columns_priv, procs_priv

授权表

+ 授权级别排列

mysql.user # 全局授权
mysql.db  # 数据库级别授权
其他  # 表级，列级授权

## 2. 用户管理

### 2.1 登陆和退出MySQL

```sql
mysql -h host -p port -u user -ppassword -e 'SQL语句'
```

mysql.user表中授权什么主机的什么用户可以登陆


### 2.2 创建用户

```sql
-- 刷新授权表
mysql> flush privileges;
```
+ 创建用户

```sql
mysql> create user xff@'%' identified by '123456';
Query OK, 0 rows affected (0.01 sec)

-- 查看权限基本为空
mysql> select * from mysql.user where user='xff'\G
*************************** 1. row ***************************
                  Host: %
                  User: xff
              Password: *6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9
           Select_priv: N
           Insert_priv: N
           Update_priv: N
           Delete_priv: N
           Create_priv: N
             Drop_priv: N
           Reload_priv: N
         Shutdown_priv: N
          Process_priv: N
             File_priv: N
            Grant_priv: N
       References_priv: N
            Index_priv: N
            Alter_priv: N
          Show_db_priv: N
            Super_priv: N
 Create_tmp_table_priv: N
      Lock_tables_priv: N
          Execute_priv: N
       Repl_slave_priv: N
      Repl_client_priv: N
      Create_view_priv: N
        Show_view_priv: N
   Create_routine_priv: N
    Alter_routine_priv: N
      Create_user_priv: N
            Event_priv: N
          Trigger_priv: N
Create_tablespace_priv: N
              ssl_type: 
            ssl_cipher: 
           x509_issuer: 
          x509_subject: 
         max_questions: 0
           max_updates: 0
       max_connections: 0
  max_user_connections: 0
                plugin: mysql_native_password
 authentication_string: 
      password_expired: N
1 row in set (0.01 sec)
```

```sql
-- 创建用户并且授权
grant select on *.* to user3@'localhost' identified by '123456';
```

+ 删除用户

```sql
mysql> drop user xff;
Query OK, 0 rows affected (0.00 sec)
```

```sql
mysql> delete from user where user='user3';
Query OK, 1 row affected (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)
```

+ 修改密码

    1. `mysqladmin -u root -ppasswd password 'passwd'`
    2.
    ```sql
    -- 普通用户对于user表没有权限的话，只能修改自己的密码
    mysql> set password for username@'localhost'=password('mysql123');
    Query OK, 0 rows affected (0.00 sec)

    mysql> flush privileges;
    Query OK, 0 rows affected (0.00 sec)
    ```
    3.
    ```sql
    mysql> update user set password = password('passwd') where user='root';
    Query OK, 1 row affected (0.01 sec)
    Rows matched: 1  Changed: 1  Warnings: 0
    mysql> flush privileges;
    Query OK, 0 rows affected (0.01 sec)
    ```

## 3. 权限管理

### 3.1 权限应用的顺序

user(Y|N) >= db >= tables_priv >= columns_priv

相应权限对于的表为:

mysql.user >= mysql.db >= mysql.tables_priv >= mysql.columns_priv

一个用户对一个数据库有权限则可以创建，删除这个数据库


### 3.2 语法格式

grant 权限列表 on 库名.表名 to '用户名'@'客户端主机' [identified by '密码' with grant option];

+ 权限列表

all <==> 所有权限(不包括授权权限，如果有了grant语句最后有grant option则有了授权权限)
select(列1, 列2, ...), update

+ 数据库.表名

|参数|说明|
|--|--|
|*.*|所有库的所有表|

+ 客户端主机

|参数|说明|
|--|--|
|%|所有主机|
|192.168.1.%|192.168.2.0网段的所有主机|
|192.168.2.1|某个特定的主机|

+ with_option 参数

|参数|说明|
|--|--|
|GRANT OPTION|授权选项|
|MAX_QUERIES_PER_HOUR|允许每小时执行的查询数|
|MAX_UPDATES_PER_HOUR|允许每小时执行的更新数|
|MAX_CONNECTIONS_PER_HOUR|允许每小时可以建立连接数|
|MAX_USER_CONNECTIONS|定义单个用户同时可以建立的连接数|

### 3.3 查看权限

```sql
-- 查看当前用户所有授权
show grants\G

-- 管理员查看其它用户权限
show grants for username\G
```

### 3.4 权限的回收

```sql
-- 不会删除用户
revoke 权限列表 on 数据库名 from 用户名@'客户端主机'
```

```sql
revoke delete on *.* from admin1@'%'; -- 回收删除权限
revoke grant option on *.* from admin1@'%'; -- 取消授权权限
-- 删除用户
delete from mysql.user where user='admin1'
flush privileges
```
