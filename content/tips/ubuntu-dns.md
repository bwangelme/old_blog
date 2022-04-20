---
title: "Ubuntu 使用默认的 DNS Server 地址"
date: 2022-04-20T02:07:00+08:00
lastmod: 2022-04-20T02:07:00+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

Ubuntu 使用 `/etc/resolv.conf` 中设置的地址为 DNS Server 地址

```sh
# 关闭 systemd-resolved 服务
sudo systemctl disable systemd-resolved
sudo systemctl stop systemd-resolved
```

在 `/etc/NetworkManager/NetworkManager.conf` 文件的 `[main]` 部分添加配置

```
dns=default
```

删除原来的软链接文件

```
sudo unlink /etc/resolv.conf
```

重启 NetworkManager

```
sudo systemctl restart NetworkManager
```

## 参考链接

- https://askubuntu.com/a/907249/581894
- https://www.gabriel.urdhr.fr/2020/03/17/systemd-revolved-dns-configuration-for-vpn/
