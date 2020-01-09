---
title: "Leetcode 第338题"
date: 2019-04-21T23:37:34+08:00
lastmod: 2019-04-21T23:37:34+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
---

> + [LeetCode 338题](https://leetcode.com/problems/reverse-words-in-a-string/)

<!--more-->

## 题目描述

Given a non negative integer number num. For every numbers i in the range 0 ≤ i ≤ num calculate the number of 1's in their binary representation and return them as an array.

Example 1:
```
Input: 2
Output: [0,1,1]
```
Example 2:
```
Input: 5
Output: [0,1,1,2,1,2]
```
Follow up:

It is very easy to come up with a solution with run time O(n*sizeof(integer)). But can you do it in linear time O(n) /possibly in a single pass?
Space complexity should be O(n).
Can you do it like a boss? Do it without using any builtin function like __builtin__ popcount in c++ or in any other language.

## 解题思路

求一个非负整数的二进制表示中有多少个1, 这个问题可以用分治法来解决。

令非负整数 N 中的1有 f(N) 个，N的个位数为 S(N)

$$
f(N) = f(N/2) + (S(N) == 1)
$$
$$
...
$$
$$
f(0) = 0
$$

根据上述的思路，我们可以写出如下的伪代码:

```
def count_bit(N):
  if N == 0:
    return 0

  if N & 1 == 1:
    return count_bit(N/2) + 1
  else:
    return count_bit(N/2)
```

这个题需要求`1..N`每个数的二进制表示中1的个数，所以我们可以将中间结果存储起来，没必要每个数都从0开始运算一遍。

## 代码

+ solution.go

```go
package l338

func CountBits(num int) []int {
	var result []int
	var bitCount int

	result = append(result, 0)
	for i := 1; i <= num; i++ {
		if i&1 == 1 {
			bitCount = result[i>>1] + 1
		} else {
			bitCount = result[i>>1]
		}

		result = append(result, bitCount)
	}

	return result
}
```

+ solution_test.go

```go
package l338

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCountBits(t *testing.T) {
	assert.Equal(t, []int{0, 1, 1}, []int{0, 1, 1})
	assert.Equal(t, CountBits(2), []int{0, 1, 1})
	assert.Equal(t, CountBits(5), []int{0, 1, 1, 2, 1, 2})
}
```
