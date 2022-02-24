---
title: "Ubuntu 将 capslock 映射成 esc"
date: 2022-02-24T20:45:00+08:00
lastmod: 2022-02-24T20:45:00+08:00
draft: false
tags: [tips, ubuntu]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

```
sudo apt-get install dconf-tools
dconf write /org/gnome/desktop/input-sources/xkb-options "['caps:escape']"
```

## 参考链接

- [How to permanently switch Caps Lock and Esc](https://askubuntu.com/a/365701/581894)
