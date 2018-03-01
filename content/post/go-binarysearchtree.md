---
title: "Go与数据结构之二叉搜索树"
date: 2018-03-01T22:22:52+08:00
draft: false
tags: [Golang, ]
---

__简介__: 利用Go语言实现二叉搜索树并为其编写单元测试

<!--more-->

## 说明

本文是我读了[《数据结构与算法分析 - C语言描述》](https://book.douban.com/subject/1139426/)后总结的二叉搜索树的实现，在本文中涉及到的代码都可以在我的Github仓库 [bwangel23/LeetCode](https://github.com/bwangel23/LeetCode/tree/daic/4chapter/searchtree) 中找到。

## 描述

对于二叉树中的任意节点X，它的左子树中所有关键字的值小于X的关键字值，而它的右子树中所有关键字值大于X的关键字值，那么这棵树就是一颗二叉搜索树。这也意味着二叉搜索树中的所有节点都可以按照某种方式来排序。

二叉查找树树的平均深度是$O(log N)$

## 定义

通过上面的描述，我们了解了二叉搜索树的概念，接下来我们使用 Go 语言来定义二叉搜索树及其上的操作。

```go
type TreeNode struct {
	elem  int
	left  *TreeNode
	right *TreeNode
}

func MakeEmpty(tree *TreeNode) *TreeNode // 清空一棵树或者创造一棵空树
func FindMin(tree *TreeNode) *TreeNode   // 查找树中最小的节点
func FindMax(tree *TreeNode) *TreeNode   // 查找树中最大的节点
func Find(elem int, tree *TreeNode) *TreeNode  // 查找树中某个特定的节点
func Insert(elem int, tree *TreeNode) *TreeNode  // 向树中插入节点
func Delete(elem int, tree *TreeNode) *TreeNode  // 从树中删除节点
```

从上面的定义中我们可以看到，二叉搜索树中的节点是通过`TreeNode`结构体来定义的，其中`elem`表示存储在这个树节点中的关键字值，`left`和`right`分别代表左右子树。

## 实现

在二叉搜索树上我们一共定义了六个操作，接下来我们分别讨论它们的实现

### MakeEmpty

```go
// 创造一棵空树，或者将一棵搜索树清空
func MakeEmpty(tree *TreeNode) *TreeNode {
	if tree != nil {
		MakeEmpty(tree.left)
		tree.left = nil
		MakeEmpty(tree.right)
		tree.right = nil
	}

	return nil
}
```

`MakeEmpty`的功能说明:

+ 创建一棵空树: 不像其他一些数据结构中通过一个结构体来定义一棵空树，我们直接通过空指针来定义一棵空树，所以在`MakeEmpty`尾部我们直接返回了空指针来代表一棵空树。

+ 清空一棵树: `MakeEmpty`函数还可以清空一棵树，由于Go语言中并不需要我们手动管理内存空间，所以删除树节点并不需要释放空间，只需要将指向树节点的指针置为`nil`即可。

### FindMin

二叉搜索树的`FindMin`操作的实现如下所示：

```go
func FindMin(tree *TreeNode) *TreeNode {
	if tree == nil {
		return nil
	}

	for tree.left != nil {
		tree = tree.left
	}

	return tree
}
```

这部分功能我们是通过迭代来实现的，由于二叉搜索树中某个树节点的左子树的关键字始终小于这个树节点的关键字值，所以我们只需要一直遍历，找到__最左__的那个树节点，它就是整个树中最小的节点。

### FindMax

二叉搜索树的`FindMax`操作的实现如下:

```go
func FindMax(tree *TreeNode) *TreeNode {
	if tree == nil {
		return nil
	}

	if tree.right == nil {
		return tree
	}

	return FindMax(tree.right)
}
```

`FindMax`的功能我们是通过递归来实现的，从二叉搜索树的特性可知，树节点的右子树中的值始终要比当前节点的值大。所以我们判断只要当前节点有右子树，就去寻找它右子树中的最大值，这样就可以找到二叉搜索树中的最大节点了。

### Find

二叉搜索树的`Find`操作的实现如下:

```go
func Find(elem int, tree *TreeNode) *TreeNode {
	if tree == nil {
		return nil
	}

	if tree.elem == elem {
		return tree
	} else if elem > tree.elem {
		return Find(elem, tree.right)
	} else {
		// 查找节点比当前树节点要小
		return Find(elem, tree.left)
	}
}
```

`Find`操作的功能是通过递归来实现的。判断当前树节点是否是要查找的节点，如果是则返回当前节点。否则，根据目标关键字的值的是否小于当前节点的关键字值分别去当前节点的左子树或右子树中去查找目标节点。

### Insert

二叉搜索树的`Insert`操作的实现如下:

```go
func Insert(elem int, tree *TreeNode) *TreeNode {
	if tree == nil {
		tree = &TreeNode{}
		tree.left = nil
		tree.right = nil
		tree.elem = elem
	} else if elem < tree.elem {
		tree.left = Insert(elem, tree.left)
	} else if elem > tree.elem {
		tree.right = Insert(elem, tree.right)
	} else {
		// 该节点已经在这颗树中了，我们什么也不做
	}

	return tree
}
```

从树的根节点开始，判断要插入的值是否比当前节点的要大，如果是的话，插入到当前节点的右子树，否则插入到当前节点的左子树。如果当前节点是一棵空树的话，我们就把目标值插入到当前节点上。

__注意__，如果要插入的值已经在树中存在的话，我们什么也不做，我们不会在树中保存两个相同的值。

### Insert 测试

为了验证我们的`Insert`操作的实现是否正确，我们可以利用 Go 的单元测试来为`Insert`操作编写测试代码，如下所示:

```go
func TestInsert(t *testing.T) {
	var tree *TreeNode = nil

	tree = Insert(3, tree)
	tree = Insert(4, tree)
	tree = Insert(1, tree)
	tree = Insert(2, tree)

	// 构造出来的树
	//    3
	//   / \
	//   1  4
	//    \
	//     2

	assert.Equal(t, 4, FindMax(tree).elem)
	assert.Equal(t, 1, FindMin(tree).elem)

	assert.Nil(t, Find(4, tree).left)
	assert.Nil(t, Find(4, tree).right)
}
```

我们按顺序向树中插入`3, 4, 2, 1`四个节点，最终构造出来的树如下图所示:

__树1__ ![树1](https://imgs.bwangel.me/2018-03-01-searchtree.png)

为了验证我们构造出来的树是否正确，我们使用`FindMax`和`FindMin`方法检验树中的最大值和最小值是否是4和1。
同时，我们也判断了树节点4的左右子树是否都为空。


### Delete

二叉搜索树的删除操作比较复杂，我们需要分情况来讨论:

+ 如果被删除的节点有0个子节点，那我们直接将它删除就好了

+ 如果被删除的节点有1个子树，那么我们需要将它的子树移动到当前节点，再将当前节点删除

例如有这样的一棵树2，我们要删除其中的节点3，那么我们需要将其存在的右子树移动到3节点所在的位置，再删除3节点。

__树2__ ![树2](https://imgs.bwangel.me/2018-03-01-152637.png)

删除3节点后的树如树3所示

__树3__ ![树3](https://imgs.bwangel.me/2018-03-01-153332.png)

+ 如果被删除的节点有两个子树，我们首先要将其右子树中的最小的节点移动到当前节点，然后再删除当前节点。

例如上面提到的树2，如果我们要删除2节点，我们首先需要找出其右子树中最小的节点3，将节点3放到节点2所在的位置，如树4所示：

__树4__ ![树4](https://imgs.bwangel.me/2018-03-01-153658.png)

然后再将原来节点2的右子树中的节点3删除，节点3的删除规则依然准遵循这里讨论的删除规则。由于这里节点3只有一个子树，所以只需要将其右子树移动到节点3所在的位置即可，如树5所示:

__树5__ ![树5](https://imgs.bwangel.me/2018-03-01-153916.png)

至此，我们就从树2中成功删除了节点2。

`Delete`操作的实现如下所示:

```go
func Delete(elem int, tree *TreeNode) *TreeNode {
	if tree == nil {
		log.Fatalf("Cannot find element %v in tree %v\n", elem, tree)
	}

	if elem < tree.elem {
		tree.left = Delete(elem, tree.left)
	} else if elem > tree.elem {
		tree.right = Delete(elem, tree.right)
	} else {
		// 被删除的就是当前节点

		if tree.left != nil && tree.right != nil {
			// 被删除的节点有两个子节点
			tmpNode := FindMin(tree.right)
			tree.elem = tmpNode.elem
			tree.right = Delete(tmpNode.elem, tree.right)
		} else {
			// 被删除的节点有0个或者1个子节点
			if tree.left == nil {
				tree = tree.right
			} else if tree.right == nil {
				tree = tree.left
			} else {
				tree = nil
			}
		}
	}

	return tree
}
```

### Delete 测试

我为`Delete`操作编写了两个单元测试，分别测试删除只有有右子树的节点，和删除有两个子树的节点，测试代码如下:

```
func TestDeleteRight(t *testing.T) {
	var tree *TreeNode = nil

	// 构造出来的树
	//     6
	//    / \
	//   2  8
	//  /\
	// 1 4
	//   \
	//    5
	tree = Insert(6, tree)
	tree = Insert(2, tree)
	tree = Insert(8, tree)
	tree = Insert(1, tree)
	tree = Insert(4, tree)
	tree = Insert(5, tree)

	// 删除了节点4之后的树
	//     6
	//    / \
	//   2  8
	//  /\
	// 1 5
	tree = Delete(4, tree)

	assert.Equal(t, 5, Find(2, tree).right.elem)
}

func TestDeleteTwoChild(t *testing.T) {
	var tree *TreeNode = nil

	// 删除之前的树
	//     6
	//    / \
	//   2  8
	//  /\
	// 1 5
	//  /
	// 3
	// \
	//  4
	tree = Insert(6, tree)
	tree = Insert(2, tree)
	tree = Insert(8, tree)
	tree = Insert(1, tree)
	tree = Insert(5, tree)
	tree = Insert(3, tree)
	tree = Insert(4, tree)

	// 删除节点2之后的树
	//     6
	//    / \
	//   3  8
	//  /\
	// 1 5
	//  /
	// 4
	tree = Delete(2, tree)

	node := Find(3, tree)
	assert.Equal(t, 1, node.left.elem)
	assert.Equal(t, 5, node.right.elem)
}
```
