---
title: "Leetcode 142: 环形链表 II(TODO)"
date: 2022-09-11T10:54:04+08:00
lastmod: 2022-09-11T10:54:04+08:00
draft: false
tags: [Tag1, Tag2]
author: "bwangel"
comment: true

---

<!--more-->
---

f = 2slow
f = slow + nb

slow = nb
f = 2nb

任意一个节点，走到入口节点的距离为 k 步

k = a+nb (a 为 从 head 到入口节点的距离)

slow 已经走了 nb 步，再走 a 步就能到入口

定义一个追赶者 pursuer，从头开始走，pursuer 和 slow 相遇时，正好走了 a 步，它们正好都停留在入口节点处


## 参考链接

- [环形链表 II（双指针法，清晰图解）](https://leetcode.cn/problems/linked-list-cycle-ii/solution/linked-list-cycle-ii-kuai-man-zhi-zhen-shuang-zhi-/)
