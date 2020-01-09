---
title: "Review 《github.com/stretchr/testify》"
date: 2019-06-02T22:41:59+08:00
lastmod: 2019-06-02T22:41:59+08:00
draft: false
tags: [翻译, Go]
author: "bwangel"
comment: true

---

> + 原文地址: https://github.com/stretchr/testify

<!--more-->
---

testify 是一组工具包，它里面的很多工具可以让你更舒适地写 Go 测试代码。

它包含以下特征:

+ [更好用的 assert](https://github.com/stretchr/testify#assert-package)
+ [Mocking](https://github.com/stretchr/testify#mock-package)
+ [Testing suite 的接口和函数](https://github.com/stretchr/testify#suite-package)

知识索引:

+ 使用[一行代码安装 testify](https://github.com/stretchr/testify#installation),使用[另一行代码](https://github.com/stretchr/testify#staying-up-to-date)来更新它
+ 在 Go 中写测试代码的相关介绍, 请参考 [http://golang.org/doc/code.html#Testing](http://golang.org/doc/code.html#Testing)
+ 在 [http://godoc.org/github.com/stretchr/testify](http://godoc.org/github.com/stretchr/testify) 查看我们的 API 文档
+ 为了让你的测试生活更简单一些，建议使用我们开发的测试工具 [gorc](http://github.com/stretchr/gorc)
+ 关于 [Test-Driven Development (TDD)](http://en.wikipedia.org/wiki/Test-driven_development) 的一点点介绍

## [assert](http://godoc.org/github.com/stretchr/testify/assert) 包

assert 包提供了一些有用的方法，可以让你写出更友好的测试代码。它具有以下特性:

+ 打印友好，很容易去阅读错误信息
+ 可以开发出易阅读的代码
+ 可以在每个`assert`后添加一个可选的注解信息

让我们通过一个实际例子来了解它:

```go
package testify_exam

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSomething(t *testing.T) {
	// 测试相等
	assert.Equal(t, 123, 123, "they should be equal")

	// 测试不相等
	assert.NotEqual(t, 123, 456, "they should not be equal")

	var obj chan struct{}
	// 测试 nil，常用于错误值的判断
	assert.Nil(t, obj)

	obj2 := struct {
		Value string
	}{
		Value: "Something",
	}
	// 测试不为 nil，常用于你希望返回的结果值拥有某些东西的时候
	if assert.NotNil(t, obj2) {
		// 现在我们知道 obj2 的值不是 nil了，我们可以在这个基础上**安全地**访问它的字段。
		assert.Equal(t, "Something", obj2.Value)
	}
}
```

+ 每个`assert`函数都使用 `testing.T` 来作为它的第一个参数，这就是它通过正常的 go 测试功能将错误输出写出来的方式。
+ 每个`assert`函数返回了一个布尔值，表示这个断言成功与否，如果你想在某个断言结果的基础上做出更多的断言，可以用到它的返回值。

如果你使用断言很多次，可以使用如下的代码:

```go
package testify_exam

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEasyAssert(t *testing.T) {
	assert := assert.New(t)

	assert.Equal(123, 123, "they should be equal")

	assert.NotEqual(123, 456, "they should not be equal")

	var obj chan struct{}
	assert.Nil(obj)

	obj2 := struct {
		Value string
	}{
		Value: "Something",
	}
	if assert.NotNil(obj2) {
		assert.Equal("Something", obj2.Value)
	}
}
```

## [require](http://godoc.org/github.com/stretchr/testify/require) 包

`require`包中拥有和`assert`包相同的全局函数，它和`assert`的不同在于，它不会再返回一个布尔值表示测试运行成功与否，而是直接结束当前测试

可以参考 [t.FailNow](http://golang.org/pkg/testing/#T.FailNow) 函数了解更多的信息

下面是一个`require`包和`assert`包的比较示例:

```go
package testify_exam

import (
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// `require.True` 失败后会将测试 TestEx1 停掉，不会再执行后面的 require.Equal 断言
// `assert.True` 失败后并不会将 TestEx2 停掉，在后面的断言中，Add 依然会被执行，
// 所以 Add 会在 TestEx2 中执行一次， count 的最终结果是1

var count int32 = 0

func Add(a, b int) int {
	atomic.AddInt32(&count, 1)
	return a + b
}

func TestEx1(t *testing.T) {
	require.True(t, false)
	require.Equal(t, Add(1, 1), 2)
}

func TestEx2(t *testing.T) {
	assert.True(t, false)
	assert.Equal(t, Add(1, 1), 2)
	assert.Equal(t, count, int32(1))
}

// 下面是程序的运行结果
//>>> go test -v testify_exam/require_test.go                                                                                                                      23:30:19 (06-02)
//=== RUN   TestEx1
//--- FAIL: TestEx1 (0.00s)
//Error Trace:    require_test.go:19
//Error:          Should be true
//=== RUN   TestEx2
//--- FAIL: TestEx2 (0.00s)
//Error Trace:    require_test.go:24
//Error:          Should be true
//FAIL
//FAIL    command-line-arguments  0.018s
```

## [mock](https://godoc.org/github.com/stretchr/testify/mock) 包

`mock`提供了一种机制，可以在编写测试代码的时候轻松编写可用于替代实际对象的模拟对象。

下面是一段示例代码，它测试了一段依赖于外部对象`testObj`的代码，并且能够设置期望(`testify`)且断言他们确实发生了。

```go
```
