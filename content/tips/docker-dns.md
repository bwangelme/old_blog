---
title: "Ubuntu 中 Docker 设置容器中 DNS 服务器的地址"
date: 2023-03-20T18:28:08+08:00
lastmod: 2023-03-20T18:28:08+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

修改 `/etc/docker/daemon.json` 文件，写入以下配置:

```
{
  "dns": [
    "10.8.0.1",
    "192.168.45.155",
  ]
  "dns-opts": [ "ndots:1" ]
}
```

这样相当于在 `/etc/resolv.conf` 设置了

```
nameserver 10.8.0.1
nameserver 192.168.45.155
options ndots:15
```

修改完成后重启 docker daemon 生效

## 参考链接

- [ndots:0 #32093](https://github.com/moby/moby/issues/32093)
