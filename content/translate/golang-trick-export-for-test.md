---
title: "Review 《Golang Trick: Export unexport method for test》"
date: 2019-04-27T17:33:52+08:00
lastmod: 2019-04-27T17:33:52+08:00
draft: false
tags: [翻译, Go, ARTS]
author: "bwangel"
comment: true
toc: true

---

> + 原文地址: https://medium.com/@robiplus/golang-trick-export-for-test-aa16cbd7b8cd
<!--more-->

 在 Go 语言中， 导出的标识符是以大写字母开头的，小写字母开头的标识符只可以在它所在的包中使用。我们在开发过程中，仅仅应该导出真正需要的标识符给调用者， 来让我们的API易于使用且易于维护。

## Go 测试

 Go 中的测试代码通常写在源代码的旁边， 以`xxx_test.go`命名。例如我们的源码文件叫做`sum.go`，测试代码应该写 在`sum_test.go` 中。

 在测试代码中命名`package`的时候，我们有两个选择。

1. 使用和源码文件相同的`package`名，例如源码文件和测试文件都是`package math`
2. 使用和源码文件不同的`package`名，通常是`xxx_test`。例如源码文件是`package math`，测试文件是`package math_test`

通常情况下，我们会选择第二种命名方式。因为测试文件和源码文件使用不同的`package`，被测代码就是一个黑盒，能够让我们专注地基于其 API(以大写字母开头的__导出标识符__) 进行开发，以帮助我们设计出更易用的 API 出来。

## export_test.go

源码文件和测试文件使用不同的`package`名称，通常情况都是可以的，但在一些特殊 TestCase 下我们可能需要使用未导出的标识符，此时就需要`export_test.go`文件登场了。

整理一下，我们的需求是这样的:

1. 不将未导出标识符导出到生产代码中
2. 将一些未导出标识符导出到测试代码中

此时我们就可以将一些未__导出标识符__包裹成__导出标识符__，放到`export_test.go`文件中，供测试代码使用。

_export\_test.go_ 文件仅仅在运行`go test`命令的时候会被包括进来，所以它不会污染包所提供的API，用户也无法访问到它(不像 Java 中的`@VisibleForTesting`)。

它建立了一座桥梁，让测试代码能够访问到未导出的标识符。

`export_test.go`这个名字不是限定死的，也可以使用其他名字，但注意必须以`_test.go`结尾。

## 使用 export_test.go 的实例

+ 包`math`的目录结构如下:

```sh
math
├── export_test.go
├── math.go
└── math_test.go
```

+ `sum.go`文件中有未导出标识符`sum`函数

```go
//sum.go
package math

func sum(a, b int) int {
    return a + b
}

func Name() {

}
```

+ `export_test.go`文件命名了`Sum`函数作为`sum`函数的副本

```go
//export_test.go
package math

var Sum = sum
```

+ `sum_test.go`测试文件使用的包名是`package math_test`，它通过`export_test.go`访问到了`math`未导出的标识符`Sum`

```go
//sum_test.go
package math_test

import (
    "github.com/d5/tengo/assert"
    "testing"
    "xxx/math"
)

func TestName(t *testing.T) {
    assert.Equal(t, 3, math.Sum(1, 2))
}
```

## Go 标准库中的应用

在 Go 1.12的 strings 库中，存在以下定义

1. `search.go`中定义的函数`makeStringFinder`是未导出的。
2. `search_test.go`和`search.go`使用了不同的`package`名称，分别是`strings`和`strings_test`
3. 为了让`search_test.go`中能够使用到`makeStringFinder`函数，在`export_test.go`中定义了`StringFind`函数，供其使用。

以下是代码链接，大家可以参考阅读。

+ [strings 目录]((https://github.com/golang/go/tree/release-branch.go1.12/src/strings))
+ [search.go](https://github.com/golang/go/blob/release-branch.go1.12/src/strings/search.go#L5)
+ [search_test.go](https://github.com/golang/go/blob/release-branch.go1.12/src/strings/search_test.go#L5)
+ [export_test.go](https://github.com/golang/go/blob/release-branch.go1.12/src/strings/export_test.go#L40-L42)
