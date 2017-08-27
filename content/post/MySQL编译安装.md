---
title: 'MySQL编译安装'
date: 2016-04-10 10:56:54
tags: [MySQL]
---

__摘要__:

> 这是一篇关于MySQL的文章，主要介绍 MySQL 编译安装

<!--more-->
MySQL编译安装
=============

## 0. 环境准备

+ 安装依赖包

```sh
yum -y remove mysql mysql-server
rm /etc/my.cnf
yum install ncurses-devel openssl-devel bison gcc make
```

+ 编译安装CMake

```sh
tar -xvf cmake-3.5.0-rc3.tar.gz
cd cmake-3.5.0-rc3
./configure
gmake
make
make install
```

## 1. 编译安装MySQL

```sh
groupadd mysql
# -M 表示不创建Home目录
useradd -M -g mysql -s /sbin/nologin mysql

tar -xvf mysql-5.6.28.tar.gz
cd mysql-5.6.28
cmake \

cmake \
-DCMAKE_INSTALL_PREFIX=/usr/local/mysql \
-DSYSCONFDIR=/etc/ \ # 配置文件目录
-DMYSQL_DATADIR=/usr/local/mysql/data \  # 数据库文件位置
-DMYSQL_TCP_PORT=3306 \
-DMYSQL_UNIX_ADDR=/tmp/mysql.sock \ # 本地套接字位置
-DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_EMBEDDED_SERVER=1 \
-DWITH_SSL=system \
-DWITH_READLINE=1 \
-DDEFAULT_COLLATION=utf8_general_ci \ # 字符集
-DEXTRA_CHARSETS=all \
-DDEFAULT_CHARSET=utf8 # 字符

make
make install
```

## 2. 配置MySQL

+ /usr/local/mysql/ 目录查看

sql-bench 基本测试工具

+ 初始化

```sh
cd /usr/local/mysql/
chown -R mysql:mysql /usr/local/mysql/
./srcipts/mysql_install_db --user=mysql --datadir=/usr/local/mysql/data/ # 初始化脚本
# 初始化完成后data下目录就会多出MySQL,performance_shcema目录
```

+ 配置文件和启动脚本安装

```sh
cp support-files/my-huge.cnf /etc/my.cnf
cp support-files/mysql.server /etc/init.d/mysqld
chmod 755 /etc/init.d/mysqld
chkconfig -add mysqld
chkconfig mysqld on
service mysqld start
```

+ 查看MySQL进程

```sh
[root@localhost mysql]# ps aufx | grep mysql
root      91734  0.1  0.1  11340  1372 pts/1    S    06:57   0:00
      /bin/sh /usr/local/mysql/bin/mysqld_safe
                            --datadir=/usr/local/mysql/data
                            --pid-file=/usr/local/mysql/data/localhost.localdomain.pid
mysql     91837  7.8 44.9 1034904 452048 pts/1  Sl   06:57   0:00
      \_ /usr/local/mysql/bin/mysqld --basedir=/usr/local/mysql
                                     --datadir=/usr/local/mysql/data
                                     --plugin-dir=/usr/local/mysql/lib/plugin
                                     --user=mysql
                                     #错误日志文件位置 !!
                                     --log-error=/usr/local/mysql/data/localhost.localdomain.err
                                     --pid-file=/usr/local/mysql/data/localhost.localdomain.pid
```

+ 配置PATH

```sh
vim /etc/profile

# Path manipulation
# 给所有用户添加上MySQL的执行文件
pathmunge /usr/local/mysql/bin after #此句是我们添加的语句
if [ "$EUID" = "0" ]; then
    pathmunge /sbin
    pathmunge /usr/sbin
    pathmunge /usr/local/sbin
else
    pathmunge /usr/local/sbin after
    pathmunge /usr/sbin after
    pathmunge /sbin after
fi

source /etc/profile
```

## 3. 登陆MySQL

+ 指定登陆密码并登陆

```sh
mysqladmin -uroot password 'passwd'
mysql -u root -p
```

+ 图形登陆工具

  * MySQL WorkBench
  * SQLyog

+ 授权账号进行远程连接

```sql
mysql> grant all on *.* to xff@'%' identified by '123';
Query OK, 0 rows affected (0.00 sec)

mysql> select user, password, host from mysql.user;
+------+-------------------------------------------+-----------------------+
| user | password                                  | host                  |
+------+-------------------------------------------+-----------------------+
| root | *59C70DA2F3E3A5BDF46B68F5C8B8F25762BCCEF0 | localhost             |
| root |                                           | localhost.localdomain |
| root |                                           | 127.0.0.1             |
| root |                                           | ::1                   |
|      |                                           | localhost             |
|      |                                           | localhost.localdomain |
| xff  | *23AE809DDACAF96AF0FD78ED04B6A265E05AA257 | %                     |
+------+-------------------------------------------+-----------------------+
7 rows in set (0.00 sec)
```
