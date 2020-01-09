---
title: "Leetcode 第8题"
date: 2019-04-02T21:51:28+08:00
lastmod: 2019-04-02T21:51:28+08:00
draft: false
tags: [LeetCode, ARTS]
author: "bwangel"
comment: true
aliases:
  - /2019/04/02/leetcode-第8题/
---

> https://leetcode.com/problems/string-to-integer-atoi/submissions/

<!--more-->

## 题目描述

实现一个将字符串转换成整数的`atoi`。

这个函数首先会丢弃掉前面不必要的空白字符。然后从第一个非空白字符开始，输入一个可选的`+`或者`-`符号，符号后面跟着不限数量的数字符号，然后将这个字符串解释成一个数字。

在这个字符串的有效数字后面后面可以跟着附加的非数字字符，这些字符将会被忽略，不会影响到函数的功能。

如果字符串中第一个非空白字符不是一个有效的数字，或者在字符串中 不存在这样有效的数字序列，不需要进行转换。如果没有有效的数字字符串进行转换，返回0即可。

注意:

+ 仅有空格字符` `被认为是空白字符。
+ 假设我们处于一个仅仅能够存储32位带符号整数`range = [-2^31, 2^31-1]`的环境中，如果解析出来的数字超出了可以表示的范围。`INT_MAX(2^31 - 1)`或者`INT_MIN(-2^31)`将会被返回。

## 答案示例

### Example 1

```
Input: "42"
Output: 42
```

### Example 2

```
Input: "   -42"
Output: -42
```
+ 解释: 第一个非空白符号是`-`号，加上后面跟着的数字，可以解析出 42 来

### Example 3

```
Input: "4193 with words"
Output: 4193
```
+ 解释: 转换在遇到3之后就停止了，因为下一个字符不是数字

### Example 4

```
Input: "words and 987"
Output: 0
```
+ 解释: 第一个非空白字符是 w，因为既不是有效的数字也不是`+`或者`-`符号，所以转换没有发生

### Example 5:

```
Input: "-91283472332"
Output: -2147483648
```
+ 解释: 数字`-91283472332`超出了32位数所能表示的范围，所以返回了`INT_MIN(-2^31)`

## 解题思路

看到这个题，一下子就想起了[LeetCode 第65题](https://leetcode.com/problems/valid-number/), 可以通过状态机来解决，而且这个题目中由于忽略浮点数和科学计数法表示的数字，所以这个状态机的设计还简单一些。

首先定义输入的 token，一开始我将 Token 分成了四组，

Token|Char
---|---
0|space
1|+/-
3|0-9
4|INVALID CHAR

后来发现这种设计，对于`+000023`这种情况处理起来不太友好，就将`0`单独设计为一种 Token。最终设计的 Token 和 __状态转换表格__ 如下所示：

Token|Char
---|---
0|space
1|+/-
2|0
3|1-9
4|INVALID CHAR

State|T0|T1|T2|T3|T4
---|---|---|---|---|---
S0|S0|S1|S4|S2|S3
S1|S3|S3|S1|S2|S3
S2|S3|S3|S2|S2|S3
S3|S3|S3|S3|S3|S3
S4|S3|S3|S4|S2|S3

+ S3 是终止状态
+ S1 状态可以用来确定整个数字的符号是正数还是负数
+ S2 状态获得的数字都是有效的数字，需要存储起来


## 答案

```go
import (
	"fmt"
	"strconv"
)

func myAtoi(str string) int {
	const intMax = int(uint(1)<<31) - 1
	const intMin = int(uint(1)<<31) * -1

	var stateMap [][]int
	stateMap = append(stateMap, []int{0, 1, 4, 2, 3})
	stateMap = append(stateMap, []int{3, 3, 1, 2, 3})
	stateMap = append(stateMap, []int{3, 3, 2, 2, 3})
	stateMap = append(stateMap, []int{3, 3, 3, 3, 3})
	stateMap = append(stateMap, []int{3, 3, 4, 2, 3})

	strNumber := ""

	var (
		path  = 4
		state = 0
		sign  = 1
	)

	for _, char := range str {
		switch {
		case char == ' ':
			path = 0
		case char == '+' || char == '-':
			path = 1
		case char == '0':
			path = 2
		case '0' < char && char <= '9':
			path = 3
		default:
			path = 4
		}

		state = stateMap[state][path]

		if state == 3 {
			break
		} else if state == 1 && char != '0' {
			if char == '+' {
				sign = 1
			} else {
				sign = -1
			}
		} else if state == 2 {
			strNumber += string(char)
		} else {
			continue
		}
	}

	if len(strNumber) == 0 {
		return 0
	}

	if len(strNumber) > 10 {
		if sign == -1 {
			return intMin
		}
		return intMax
	}

	number, err := strconv.Atoi(strNumber)
	if err != nil {
		fmt.Println(err)
		return 0
	}
	number = number * sign

	// 如果数字的大小超过了32位数表示的范围，则返回 INT_MAX 或者 INT_MIN
	if number > intMax {
		return intMax
	} else if number < intMin {
		return intMin
	} else {
		return number
	}
}
```


