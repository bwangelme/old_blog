---
title: "strings.Builder 转换字符串的时候为什么比 bytes.Buffer 要快"
date: 2019-04-28T23:48:00+08:00
lastmod: 2019-04-28T23:48:00+08:00
draft: false
tags: [Go]
author: "bwangel"
comment: true

---

`strings.Builder`和`bytes.Buffer`底层都是`[]byte`，
为什么`strings.Builder`的`String()`方法比`bytes.Buffer`的要快？

<!--more-->

---

## unsafe.Pointer 的用法

`Pointer`类型代表了任意一种类型的指针，类型`Pointer`有四种专属的操作：

  + 任意类型的指针能够被转换成`Pointer`值
  + 一个`Pointer`值能够被转换成任意类型的指针值
  + 一个`uintptr`值能够被转换从`Pointer`值
  + 一个`Pointer`值能够被转换成`uintptr`值

因此`Pointer`类型允许一个程序绕过类型系统，读，写任意内存。它应该被非常谨慎地使用

`Pointer`通过特定的模式来使用。如果某些代码不以 Go 文档中指定的模式来使用，Go 将无法保证它在现在或者未来是有效的
下面的每个模式都有非常重要的注意事项。

运行`go vet`命令可以检测`Pointer`的用法是否超出 Go 文档中指定的模式，
但是`go vet`没有检测到异常并不代表所检测的代码一定是有效的。

下面我们将简单介绍类型转换模式，更多的模式请参考 [Go Pointer 文档](https://golang.org/pkg/unsafe/#Pointer)

### 类型转换模式

可以通过`*T1 => Pointer => *T2`的方式来完成类型转换。

需要保证`T2`的内存 <= `T1`的内存，而且转换以后它们使用的是同一片内存数据。
这个转换允许将一片内存区中的数据从一种类型变成另外一种类型。
使用这个转换的一个例子是`math.Float64bits`

```go
func Float64bits(f float64) uint64 {
  return *(*uint64)(unsafe.Pointer(&f))
}
```

## 针对 []byte 和 string 执行类型转换

了解了类型转换模式后，我们来看一段 `[]byte` 转换成 `string` 的代码:

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	var b = []byte{'H', 'E', 'L', 'L', 'O'}

	s := *(*string)(unsafe.Pointer(&b))

	fmt.Println("b =", b)
	fmt.Println("s =", s)

	b[1] = 'B'
	fmt.Println("s =", s)

	s = "WORLD"
	fmt.Println("b =", b)
	fmt.Println("s =", s)

	//b = [72 69 76 76 79]
	//s = HELLO
	//s = HBLLO
	//b = [72 66 76 76 79]
	//s = WORLD
}
```

可以看到，将`b []byte`转换成`s string`后，他们还是用同一片内存空间，
所以针对`b`的改变也会影响到`s`。
但是对`s`重新赋值后，它们所使用的内存空间不同了，所以`s`改变后，`b`并不会改变。

## 比较 strings.Builder 和 bytes.Buffer

`strings.Builder`和`bytes.Buffer`底层都是使用`[]byte`实现的，
但是[性能测试的结果显示](https://gist.github.com/bwangelme/37facf96621fef19e2e70bce7a7b8457)，
执行`String()`函数的时候，`strings.Builder`却比`bytes.Buffer`快很多。

区别就在于 `bytes.Buffer` 是重新申请了一块空间，存放生成的`string`变量，
而`strings.Builder`直接将底层的`[]byte`转换成了`string`类型返回了回来。

在`bytes.Buffer`中也说明了，如果想更有效率地(__efficiently__)构建字符串，请使用`strings.Builder`类型


+ bytes.Buffer

```go
// String returns the contents of the unread portion of the buffer
// as a string. If the Buffer is a nil pointer, it returns "<nil>".
//
// To build strings more efficiently, see the strings.Builder type.
func (b *Buffer) String() string {
	if b == nil {
		// Special case, useful in debugging.
		return "<nil>"
	}
	return string(b.buf[b.off:])
}
```

+ strings.Builder

```go
// String returns the accumulated string.
func (b *Builder) String() string {
	return *(*string)(unsafe.Pointer(&b.buf))
}
```
