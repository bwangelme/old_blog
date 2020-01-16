---
title: "Leetcode[258]. Add Digits"
date: 2019-04-09T00:28:55+08:00
lastmod: 2019-04-09T00:28:55+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
aliases:
  - /2019/04/09/leetcode-258题数根/

---

> + [LeetCode 258题](https://leetcode.com/problems/add-digits/)

<!--more-->
---

## 题目描述

Given a non-negative integer num, repeatedly add all its digits until the result has only one digit.

Example:

Input: 38

Output: 2

Explanation: The process is like: 3 + 8 = 11, 1 + 1 = 2. 
             Since 2 has only one digit, return it.

Follow up:
Could you do it without any loop/recursion in O(1) runtime?

## 解题思路

### 数根的定义

这个题目其实是让求一个非负整数的数根，关于数根的定义如下:

> 在数学中，数根（又称位数根或数字根 Digital root）是自然数的一种性质，

> 数根是将一正整数的各个位数相加（即横向相加），若加完后的值大于10的话，则继续将各位数进行横向相加直到其值小于10为止。

> 或是，将一数字重复做数字和，直到其值小于10为止，则所得的值为该数的数根。  

例如54817的数根为7，因为5+4+8+1+7=25，25大于10则再加一次，2+5=7，7小于十，则7为54817的数根。

### 自然数和它的数根模9同余

要求一个数的数根，我们需要了解数根的一个重要性质:

> 自然数`N`和它的数根`X`，对9取余，他们的余数相同

接下来我们证明一下这个性质，

假设有一个`n`位的10进制自然数`N`，我们可以写成 $ N = \sum_{i=0}^{n} a_i * 10^i $

因为 

+ $ 10^n \equiv 1^n \equiv 1 \pmod 9 $，即 $10^n$ ， $1^n$ 和 1 模9，得到的余数都是1。
+ 模运算的乘法运算规则 $ (a * b) \% p \equiv (a \% p * b \% p) \% p $

所以 $ N \equiv \sum_{i=0}^{n} a_i \pmod 9 $，

$ \sum_{i=0}^{n} a_i $ 即是自然数`N`的各个位数相加，我们将自然数`N`的各个位数相加的操作称为`f`，其相加结果为`f(N)`

可得 $ N \equiv f(N) \pmod 9$

进一步可得 $ N \equiv f(N) \equiv f(f(N)) \equiv f(f(f(N))) \pmod 9 ... $

`N`的数根是重复各个位数相加的过程得来的，所以可得 $ N \equiv N的数根 \pmod 9 $

## 代码

根据`自然数和它的数根模9同余`的性质，我们可以推断出，一个数的数根是它模9的余数，或者是9（模9等于0）。

最终代码如下:

```go
package l258

// addDigits 计算 __数根__ 的程序
func addDigits(num int) int {
	if num <= 0 {
		// 非自然数及0的情况
		return 0
	} else {
		res := num % 9
		if res == 0 {
			// 模9等于0时，其数根为9
			return 9
		} else {
			// 自然数的数根为其模9的余数
			return res
		}
	}
}
```

+ 测试代码

```go
package l258

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAddDigits(t *testing.T) {
	assert.Equal(t, 2, addDigits(38))
	assert.Equal(t, 0, addDigits(0))
	assert.Equal(t, 9, addDigits(9))
	assert.Equal(t, 9, addDigits(18))
}
```

## 参考链接

+ [维基百科 - 数根](https://zh.wikipedia.org/wiki/%E6%95%B8%E6%A0%B9)
+ [如何证明一个数的数根(digital root)就是它对9的余数？ - 知乎用户的回答 - 知乎](https://www.zhihu.com/question/30972581/answer/50203344)
+ [百度百科 - 取模运算](https://baike.baidu.com/item/%E5%8F%96%E6%A8%A1%E8%BF%90%E7%AE%97/10739384?fr=aladdin)
