---
title: "Leetcode 661题"
date: 2019-03-24T19:58:39+08:00
lastmod: 2019-03-24T19:58:39+08:00
draft: false
tags: [ARTS, LeetCode]
author: "bwangel"
comment: true
aliases:
  - /2019/03/24/leetcode-661题/
---

> + LeetCode 661题
> + https://leetcode.com/problems/non-decreasing-array/

<!--more-->

## 题目

给定一个数组有N个元素(`1 <= N <= 10000`)，你的任务是__最多__修改其中的一个元素，将这个数组变成非递减数组。如果可以完成这个任务，函数返回 True，否则返回 False

非递减数组定义：

```py
def is_nonDecrease_arr(arr):
  for idx, _ in enumerate(arr):
    if arr[idx] > arr[idx+1]:
      return False
  return True
```

+ 输入例子1
  + Input: [4,2,3]
  + Output: True
  + Explanation: 修改4可以让数组变成非递减数组
+ 输入例子2
  + Input: [4,2,1]
  + Output: False
  + Explanation: 无法实现修改某个元素让数组变成非递减数组


## 解题思路

+ 遍历整个数组，寻找递减的双数元组
+ 如果递减双数元组找到了2个及以上，函数返回 False。
+ 如果递减双数元组找到了0个，返回 True
+ 如果递减双数元组找到了1个
  + 如果这个元组位于数组的首部或尾部，直接修改其中一个数就可以，返回 True
  + 如果这个元素位于数组的中间，尝试修改这个元组中的两个数，看能否把这个元组 + 它们前后两个数变成非递减数列

## 答案

```go
func checkPossibility(nums []int) bool {
	k := -1

	for i := 0; i < len(nums)-1; i++ {
		if nums[i] > nums[i+1] {
			// 如果 k != -1，说明之前已经找到过一次了
			if k != -1 {
				return false
			}
			k = i
		}
	}

	// 没有找到递减的双数元组
	if k == -1 {
		return true
	}

	// 递减双数元组位于数组首部或者尾部
	if k == 0 || k == len(nums)-2 {
		return true
	}

	// 修改 nums[k] 可以让数组变成非递减数组
	if nums[k-1] <= nums[k+1] {
		return true
	}

	// 修改 nums[k+1] 可以让数组变成非递减数组
	if nums[k] <= nums[k+2] {
		return true
	}

	return false
}
```
