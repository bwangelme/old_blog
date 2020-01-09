---
title: "Leetcode 第191题"
date: 2019-04-30T13:21:59+08:00
lastmod: 2019-04-30T13:21:59+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
---

> + [LeetCode 191题](https://leetcode.com/problems/number-of-1-bits/)

<!--more-->
---

## 题目描述

Write a function that takes an unsigned integer and return the number of '1' bits it has (also known as the Hamming weight).

### Example 1:

```
Input: 00000000000000000000000000001011
Output: 3
Explanation: The input binary string 00000000000000000000000000001011 has a total of three '1' bits.
```

### Example 2:

```
Input: 00000000000000000000000010000000
Output: 1
Explanation: The input binary string 00000000000000000000000010000000 has a total of one '1' bit.
```

### Example 3:

```
Input: 11111111111111111111111111111101
Output: 31
Explanation: The input binary string 11111111111111111111111111111101 has a total of thirty one '1' bits.
```

Note:

Note that in some languages such as Java, there is no unsigned integer type. In this case, the input will be given as signed integer type and should not affect your implementation, as the internal binary representation of the integer is the same whether it is signed or unsigned.

In Java, the compiler represents the signed integers using 2's complement notation. Therefore, in Example 3 above the input represents the signed integer -3.

## 解题思路

### n & n - 1

#### 二的正指数幂

如果一个正整数是2的幂，那么这个正整数的二进制表示中只有一个1，且`n & (n-1) == 0`。因为从`n`的二进制表示中的1开始向右数，`n`和`n-1`的二进制表示正好是相反的。

例如`bin(8) = 0b1000`，`bin(7) = 0b0111`，`8 & 7 == 0b1000 & 0b0111 == 0`。

#### 普通正整数

任何一个正整数`N`都可以分解成若干个2的正指数幂的和：

$$
  N = 2^n*tn + 2^{n-1}*t{n-1} + ... + 2^0*t0
$$

那么对于任意一个正整数N来说，`N = N & (N-1)`就是让`N`减去其中最小的2的幂。例如：

$$
10 = 2^3 * 1 + 2^2 * 0 + 2^1 * 1 + 2^0 * 0
$$

$$
9 = 2^3 * 1 + 2^2 * 0 + 2^1 * 0 + 2^0 * 1
$$

`10 & 9`就是将10减去其中的最小的2的幂`2`，得到的结果为`8`。

将以上结果代入到正整数二进制表示中考虑，可得:

> `N = N & (N-1)`会将N的二进制表示中最右边的1变成0。

## 答案

了解了`N = N & (N-1)`的含义之后，整个题目的解题思路也就出来了，

每次执行`N = N & (N-1)`都会将`N`最右边的1变成0，我们就可以执行循环`N = N & (N-1)`，
直到`N == 0`，循环的执行次数就是`N`中1的个数。

由于题目中给出的`N`是非负整数，所以我们还需要额外处理一下`N == 0`的情况。

## 代码

题目的答案及测试代码如下:

+ solution.go

```go
package l166

import (
	"log"
	"strconv"
)

func hammingWeight(num uint32) int {
	if num == 0 {
		return 0
	}

	var count = 1

	for {
		num &= (num - 1)
		if num == 0 {
			break
		}
		count += 1

	}
	return count
}

func binStrToUint32(binary string) uint32 {
	num, err := strconv.ParseUint(binary, 2, 32)
	if err != nil {
		log.Fatalln(err)
	}

	return uint32(num)
}
```

+ solution_test.go

```go
package l166

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHammingWeight(t *testing.T) {
	assert.Equal(t, hammingWeight(binStrToUint32("00000000000000000000000000001011")), 3)
	assert.Equal(t, hammingWeight(binStrToUint32("11111111111111111111111111111101")), 31)
	assert.Equal(t, hammingWeight(binStrToUint32("00000000000000000000000010000000")), 1)
	assert.Equal(t, hammingWeight(binStrToUint32("00000000000000000000000000000000")), 0)
}
```

## 参考资料

+ [《编程之美》](https://book.douban.com/subject/3004255/)
