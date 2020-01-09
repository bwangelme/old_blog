---
title: "Leetcode 第29题"
date: 2019-05-13T23:27:08+08:00
lastmod: 2019-05-13T23:27:08+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
---

> + [LeetCode 29题](https://leetcode.com/problemset/all/)

<!--more-->
---

## 题目描述

Given two integers dividend and divisor, divide two integers without using multiplication, division and mod operator.

Return the quotient after dividing dividend by divisor.

The integer division should truncate toward zero.

Example 1:

```
Input: dividend = 10, divisor = 3
Output: 3
```

Example 2:

```
Input: dividend = 7, divisor = -3
Output: -2
```

Note:

Both dividend and divisor will be 32-bit signed integers.
The divisor will never be 0. Assume we are dealing with an environment which could only store integers within the 32-bit signed integer range: [`−2^31`,  `2^31 − 1`]. For the purpose of this problem, assume that your function returns `2^31 − 1` when the division result overflows.

## 解题思路

### 基本思路

这道题是要求在不使用`*`, `/` 和取余的情况下做除法，那能用的方法就是做减法了。最简单的做法就是让被除数一直减除数，直到被除数为0为止，减法执行的次数就是商。

在这个基础上，我们可以执行一定的优化，例如 `divide(10, 2)` 执行的是以下的操作:

```
10 - 2 - 2 - 2 - 2 - 2

# 共执行了5次减法，所以商是5
```

我们可以将除数不断乘二（`<<1`），同时也将商不断乘二，直到除数为小于被除数的最大数，然后再执行被除数减去除数的操作。

在最好的情况下，上述优化可以将 $\frac{被除数}{除数}$ 次减法合并成 $log_2{\frac{被除数}{除数}}$ 次位运算。

### 处理符号

题目中的输入值为32位有符号数，所以需要处理为负数的情况。这里比较简单，就是判断被除数和除数的符号是否相同就可以了。

在 C 语言中布尔值即是整数值，可以执行异或运算

```c
int sign = (被除数 > 0) ^ (除数 > 0) ? -1 : 1;
```

在 Go 语言中，布尔值执行异或运算，只需要判断两个布尔值是否相同即可以了

```go
var sign = 1
if (除数 > 0) != (被除数 > 0) {
	sign = -1
}
```

### 溢出情况

题目中还提示到，当溢出发生时，返回$2^{31} - 1$。由于输入的数值是32位整数，执行的又是除法，所以溢出只可能是一种情况，就是

$$
\frac{-2^{31}}{-1}
$$

所以我们只需要处理这一种溢出情况即可。

## 代码

+ `solution.go`

```go
package l29

const MaxInt = 1<<31 - 1
const MinInt = -(1 << 31)

func IntAbs(num int) int {
	if num < 0 {
		return -num
	} else {
		return num
	}
}

func divide(dividend int, divisor int) int {
	if divisor == 0 {
		panic("divided by zero")
	}

	// 由于 dividend 和 divisor 都是 32 位有符号整数，所以溢出的情况只会是下面这一种情况。
	if dividend == MinInt && divisor == -1 {
		return MaxInt
	}

	var (
		dvd = IntAbs(dividend)
		dvs = IntAbs(divisor)
	)

	var sign = 1
	if (dividend > 0) != (divisor > 0) {
		sign = -1
	}

	var answer = 0
	for dvd >= dvs {
		var (
			tmp   = dvs
			count = 1
		)
n		for tmp<<1 <= dvd {
			tmp <<= 1
			count <<= 1
		}
		dvd -= tmp
		answer += count
	}

	return answer * sign
}
```

+ `solution_test.go`

```go
package l29

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestDivide(t *testing.T) {
	assert.Equal(t, divide(-9, -3), 3)
	assert.Equal(t, divide(10, 3), 3)
	assert.Equal(t, divide(7, -3), -2)
	assert.Equal(t, divide(-2147483648, -1), 2147483647)
}
```
