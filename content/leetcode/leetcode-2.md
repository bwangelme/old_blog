---
title: "Leetcode 第2题"
date: 2019-06-19T23:10:11+08:00
lastmod: 2019-06-19T23:10:11+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
---

> + [LeetCode 2题](https://leetcode.com/problems/add-two-numbers/)

<!--more-->
---

## 题目描述

You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order and each of their nodes contain a single digit. Add the two numbers and return it as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

Example:

    Input: (2 -> 4 -> 3) + (5 -> 6 -> 4)
    Output: 7 -> 0 -> 8
    Explanation: 342 + 465 = 807.

## 解题思路

这个题目是对两个按位存储在链表中的非负整数进行求和。
一开始我的思路是将链表中的数转换成整数，求和之后，再将结果存储到一个列表中。

但是代码提交以后，发现还有`10000000000000000000000000000001`这样的输入值，这个明显溢出了，使用 uint64 也无法存储。

于是干脆转换思路，不进行转换，直接在列表的基础上执行求和操作。由于数在列表上是逆序存储的，即`31415`会存储成`51413`。
所以这就方便了我们执行求和的操作，直接从列表头开始执行+操作，如果某一位的和超过了10，则记录进位。

核心代码逻辑的如下所示:

```go
	// carry 表示进位
	for {
		// 需要注意，求和结束需要满足三个条件，两个加数链表已经遍历完，且 **进位为0**
		if l1 == nil && l2 == nil && carry == 0 {
			break
		}
		num = 0

		if l1 != nil {
			num += l1.Val
			l1 = l1.Next
		}

		if l2 != nil {
			num += l2.Val
			l2 = l2.Next
		}

		num += carry
		carry = 0

		if num >= 10 {
			num -= 10
			carry = 1
		}

		// newListNode 是自定义函数，会创建一个新的链表节点
		node := newListNode(num, nil)

		if head == nil {
			head = node
		}

		if prevNode != nil {
			prevNode.Next = node
		}

		prevNode = node
	}
```

## 代码

解题代码和相关测试我已经放在 GitHub 上了，大家可以自行下载运行: 

+ [bwangelme/LeetCode-Go/l2](https://github.com/bwangelme/LeetCode-Go/tree/master/l2)
