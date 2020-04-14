---
title: "Leetcode 第343题"
date: 2020-04-14T23:43:14+08:00
lastmod: 2020-04-14T23:43:14+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
---

> + [LeetCode 343题](https://leetcode.com/problems/integer-break/)

<!--more-->
---

## 题目描述

https://leetcode.com/problems/integer-break/

__注意:__

1. 给定的整数和被分解的整数都是正数，整数应该被分解成__至少__两个整数。
2. 输入的 n 应该不小于 2，不大于 58

__相关主题:__

+ 动态规划

## 解题思路

令求分解整数最大积的函数为 P，初始情况 `P(2) = 1`

```py
P(N) = max([
    # 注意，因为 P 函数将整数至少分解成了两个整数， P(N-1) 的 max 比较整数集中，不包括 N - 1
    1 * P(N-1), 1 * (N - 1),
    2 * P(N-2), 2 * (N - 2),
    3 * P(N-3), 3 * (N - 3),
    ...
    # 注意 P(1) 是不存在的，为了方便运算，我们将其设置为 1
    (N - 1) * P(1), (N - 1) * 1,
])
```

从上面的公式可以看出，求出 `P(1) ~ P(N-1)` 后，才能求 `P(N)`

这是`P(N)`的递归公式，如果用递归实现的话，会存在大量的重复计算，所以我们使用动态规划的方式来解这个题目。

令记录中间结果的表格为`dp`，`dp[n] = P(N)`

```py
# 初始化 dp, 设置dp中的每一个值都是 0

dp[1] = 1
dp[2] = 1

# 对于任意一个正整数i, P(i)的计算函数为
for j := i - 1; j >= 1; j -= 1 {
    dp[i] = max([
        (i-j) * dp[j],
        (i-j) * j,
        # dp[i] 表示上一次(j+1)求出的最大值
        dp[i],
    ])
}
```

整个程序的思路就是，对于输入的正整数N，求出 `dp[3] ~ dp[N]` 的所有值，然后返回 `dp[N]` 即可


## 代码

https://github.com/bwangelme/LeetCode-Go/tree/master/l343
