---
title: "Golang 中空数组是否是 nil"
date: 2021-10-19T00:03:44+08:00
lastmod: 2021-10-19T00:03:44+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

```go
var t1 []string
t2 := []string{}
fmt.Println("t1", t1 == nil, len(t1)) // t1 true 0
fmt.Println("t2", t2 == nil, len(t2)) // t2 false 0
```

在上述的声明中，

+ t1 未初始化，所以它是 nil
+ t2 已经初始化了一个底层数组，底层数组的长度是0，所以它不是 nil

## 参考链接

+ [小贴士：Golang的空数组是否为nil](https://ieevee.com/tech/2019/07/26/slice-nil-empty.html)
