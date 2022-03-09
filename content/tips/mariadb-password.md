---
title: "Mariadb 修改 root 密码"
date: 2022-03-09T14:26:24+08:00
lastmod: 2022-03-09T14:26:24+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

```sql
FLUSH PRIVILEGES;


-- MySQL 5.7.6 and newer as well as MariaDB 10.1.20 and newer
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';

-- MySQL 5.7.5 and older as well as MariaDB 10.1.20
SET PASSWORD FOR 'root'@'localhost' = PASSWORD('new_password');
```

## 参考链接

https://www.digitalocean.com/community/tutorials/how-to-reset-your-mysql-or-mariadb-root-password
