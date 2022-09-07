---
title: "MySQL 修改 root 密码"
date: 2022-03-09T14:26:24+08:00
lastmod: 2022-03-09T14:26:24+08:00
draft: false
tags: [tips, mariadb]
author: "bwangel"
comment: true
---

<!--more-->

---

## 旧版本修改 root 密码

- MySQL 5.7.6 and newer as well as MariaDB 10.1.20 and newer

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

- MySQL 5.7.5 and older as well as MariaDB 10.1.20 and older

```sql
SET PASSWORD FOR 'root'@'localhost' = PASSWORD('new_password');
FLUSH PRIVILEGES;
```

## Ubuntu 下 MySQL 8.0 以上版本修改 root 密码

- MySQL 8 默认不开启 root 用户，默认用户是 `debian-sys-maint`，其默认密码存储在 `/etc/mysql/debian.conf` 中
- MySQL 8 已经抛弃了 `PASSWORD()` 函数。
- MySQL 8 的 user 表已经没有 password 字段了，使用 `authentication_string` 存储密码 hash

在 `/etc/mysql/debian.conf` 中查看 MySQL `debian-sys-maint` 用户的密码，登录上之后，修改 root 的密码


```sql
alter user 'root'@'localhost' identified with mysql_native_password by 'passwd';
flush privileges;
```

然后就可以用 root 用户登录了。

## 参考链接

- https://www.digitalocean.com/community/tutorials/how-to-reset-your-mysql-or-mariadb-root-password
- https://blog.csdn.net/qq285744011/article/details/120743369
