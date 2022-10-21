---
title: "Ubuntu 下 alacritty 终端中安装 nvim-tree 插件"
date: 2022-10-21T15:43:43+08:00
lastmod: 2022-10-21T15:43:43+08:00
draft: false
tags: [tips, nvim]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

使用 packer 安装 nvim-tree 的步骤比较简单，这里不再赘述。

- 从 [nerdfonts](https://www.nerdfonts.com/font-downloads) 选择一个你喜欢的字体并下载下来，我下载的是 DejaVuSansMono.zip
- 安装 nerd 字体

```sh
unzip -d ~/.fonts/DejaVuSansMono DejaVuSansMono.zip
# 刷新字体缓存
fc-cache -fv
```

- 获取字体名称，打开终端，在 __配置文件首选项__ 中查看字体名称

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com/2022-10-21-155055.png)

可以看到字体名称是: __DejaVuSansMono Nerd Font Mono__

- 修改 `~/.alacritty.yml` 文件，将 `font -> normal -> family` 改成对应的字体名称
- 最终，我们就能够在终端里看到，图标被正确显示了

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com/2022-10-21-155427.png)

## 参考链接

- [www.nerdfonts.com](https://www.nerdfonts.com/font-downloads)
