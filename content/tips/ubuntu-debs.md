---
title: "Ubuntu 必装软件"
date: 2022-05-08T10:42:22+08:00
lastmod: 2022-05-08T10:42:22+08:00
draft: false
tags: [tips, linux]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

```sh
# vagrant

curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"\n
sudo apt-get update && sudo apt-get install vagrant
```

## 参考链接

- [Vagrant](https://www.vagrantup.com/downloads)
