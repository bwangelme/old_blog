---
title: "Caps-lock mapping 成 Esc 在 vscode 中不生效"
date: 2021-10-18T11:27:39+08:00
lastmod: 2021-10-18T11:27:39+08:00
draft: false
tags: [tips, vscode]
author: "bwangel"
comment: true

---

<!--more-->

---

## Tips

+ 问题: Linux 下将 caps-lock 键映射为 Esc。在 vscode 中失效。
+ 解决方案:

打开 `Preferences → Settings → Application → Keyboard → Dispatch` 设置为 `keyCode`

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-10-18-113151.png)


## 参考链接

+ [Howto: Fix Caps Lock Escape Swap Not Working in VS Code](https://linuxdev.io/howto-fix-caps-lock-escape-swap-not-working-in-vs-code/)
