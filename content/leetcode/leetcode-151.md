---
title: "Leetcode 第151题"
date: 2019-04-14T20:44:04+08:00
lastmod: 2019-04-14T20:44:04+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true

---

> + [LeetCode 151题](https://leetcode.com/problems/reverse-words-in-a-string/)

<!--more-->

## 题目描述

Given an input string, reverse the string word by word.

+ Example 1:

```
Input: "the sky is blue"
Output: "blue is sky the"
```

+ Example 2:

```
Input: "  hello world!  "
Output: "world! hello"
Explanation: Your reversed string should not contain leading or trailing spaces.
```

+ Example 3:

```
Input: "a good   example"
Output: "example good a"
Explanation: You need to reduce multiple spaces between two words to a single space in the reversed string.
```

+ Note:

A word is defined as a sequence of non-space characters.
Input string may contain leading or trailing spaces. However, your reversed string should not contain leading or trailing spaces.
You need to reduce multiple spaces between two words to a single space in the reversed string.
 
+ Follow up:

For C programmers, try to solve it in-place in O(1) extra space.

## 解题思路

 + 将整个字符串从后向前遍历，将遍历到的__非空格__内容输出到一个临时变量中`word`。
 + 如果遍历到空格，将`word`中的内容加上空格后一起输出，同时将`word`清空。
 + 遍历完整个字符串后，所有的单词也就被输出了。

__注意:__

 + 最后要将结果结尾多余的空格切掉
 + 需要手动处理`""`的输入

## 代码

+ solution.go

```go
package l151

func reverseWord(word string) string {
	runeString := []rune(word)
	var reverseString string
	for i := len(runeString) - 1; i >= 0; i-- {
		reverseString += string(runeString[i])
	}
	return reverseString
}

func reverseWords(s string) string {
	result := ""
	word := ""
	length := len(s)

	if s == "" {
		return ""
	}

	for i := length - 1; i >= 0; i-- {
		if s[i] == ' ' {
			if len(word) != 0 {
				result += reverseWord(word) + " "
				word = ""
			}
			continue
		}

		word += string(s[i])
	}

	if len(word) != 0 {
		result += reverseWord(word) + " "
	}

	if len(result) != 0 && result[len(result)-1] == ' ' {
		return result[:len(result)-1]
	}

	return result

}
```

+ solution_test.go

```go
package l151

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReverseWords(t *testing.T) {
	assert.Equal(t, reverseWords("a good   example"), "example good a")
	assert.Equal(t, reverseWords(""), "")
	assert.Equal(t, reverseWords(" "), "")
	assert.Equal(t, reverseWords("the sky is blue"), "blue is sky the")
	assert.Equal(t, reverseWords("  hello world!  "), "world! hello")
}
```
