---
title: "TCP Naggle 算法"
date: 2021-10-18T23:54:13+08:00
lastmod: 2021-10-18T23:54:13+08:00
draft: false
tags: [tips, tcp]
author: "bwangel"
comment: true

---

<!--more-->

---

## Tips

```
if 有数据要发送 {
    if 可用窗口大小 >= MSS and 可发送的数据 >= MSS {
        立刻发送MSS大小的数据
    } else {
        if 有未确认的数据 {
            将数据放入缓存等待接收ACK
        } else {
            立刻发送数据
        }
    }
}
```

## 参考链接

+ [深入浅出TCPIP之Nagle算法](https://cloud.tencent.com/developer/article/1784570)
