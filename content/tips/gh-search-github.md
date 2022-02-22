---
title: "Github 客户端 gh 添加搜索仓库的命令"
date: 2021-10-19T00:01:12+08:00
lastmod: 2021-10-19T00:01:12+08:00
draft: false
tags: [tips, gh]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

```
gh alias set s 'api -X GET search/repositories -f q="$1" --template "{{range .items}}{{ printf \"%v\\n--------------\\n%v\\n\\n\" .full_name .description }}{{ end }}"'
```

## 参考链接

+ [Gh 添加 repoSearch alias](https://github.com/cli/cli/pull/830#issuecomment-812972624)
