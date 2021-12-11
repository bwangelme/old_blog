---
title: "Vagrant 添加挂载目录"
date: 2021-12-02T21:10:27+08:00
lastmod: 2021-12-02T21:10:27+08:00
draft: false
tags: [tips, vagrant]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

`cfg.vm.synced_folder` 可以设置挂载目录

```sh
# 第一个参数为宿主机目录，第二个参数是虚拟机目录
      node.vm.synced_folder "/Users/michaeltsui/Github/Golang/", "/code"
```

## 参考链接

+ https://stackoverflow.com/a/18529697/5161084
+ https://www.vagrantup.com/docs/synced-folders/basic_usage
