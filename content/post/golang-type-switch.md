---
title: "Go 语言的 Type Switch 语句解析"
date: 2018-02-03T00:17:00+08:00
draft: false
tags: [Go, ]
aliases:
  - /2018/02/03/go-语言的-type-switch-语句解析/
---

讲述了Go语言中 Type Swith 的用法以及获取对应变量的一些特殊情况。
<!--more-->

## Type Switch 的基本用法

Type Switch 是 Go 语言中一种特殊的 switch 语句，它比较的是类型而不是具体的值。它判断某个接口变量的类型，然后根据具体类型再做相应处理。注意，在 Type Switch 语句的 case 子句中不能使用`fallthrough`。

它的用法如下。

```go
switch x.(type) {
case Type1:
	doSomeThingWithType1()
case Type2:
	doSomeThingWithType2()
default:
	doSomeDefaultThing()
}
```

其中，`x`必须是一个接口类型的变量，而所有的`case`语句后面跟的类型必须实现了`x`的接口类型。

为了便于理解，我们可以结合下面这个例子来看:

```go
package main

import (
    "fmt"
    "reflect"
)

type Animal interface {
    shout() string
}

type Dog struct {}

func (self Dog) shout() string {
    return fmt.Sprintf("wang wang")
}

type Cat struct {}

func (self Cat) shout() string {
    return fmt.Sprintf("miao miao")
}

func main() {
    var animal Animal = Dog{}

    switch animal.(type) {
    case Dog:
        fmt.Println("animal'type is Dog")
    case Cat:
        fmt.Println("animal'type is Cat")
    }
}
```

在上面的例子中，`Cat`和`Dog`类型都实现了接口`Animal`，所以它们可以跟在`case`语句后面，判断接口变量`animal`是否是对应的类型。


## 在Switch的语句表达式中声明变量

如果我们不仅想要判断某个接口变量的类型，还想要获得其类型转换后的值的话，我们可以在 Switch 的语句表达式中声明一个变量来获得这个值。

其用法如下所示:

```go
package main

import (
	"fmt"
	"reflect"
)

type Animal interface {
	shout() string
}

type Dog struct {
	name string
}

func (self Dog) shout() string {
	return fmt.Sprintf("wang wang")
}

type Cat struct {
	name string
}

func (self Cat) shout() string {
	return fmt.Sprintf("miao miao")
}

type Tiger struct {
	name string
}

func (self Tiger) shout() string {
	return fmt.Sprintf("hou hou")
}

func main() {
	// var animal Animal = Tiger{}
	// var animal Animal  // 验证 case nil
	// var animal Animal = Wolf{} // 验证 default
	var animal Animal = Dog{}

	switch a := animal.(type) {
	case nil: // a的类型是 Animal
		fmt.Println("nil", a)
	case Dog, Cat: // a的类型是 Animal
		fmt.Println(a) // 输出 {}
		// fmt.Println(a.name) 这里会报错，因为 Animal 类型没有成员name
	case Tiger: // a的类型是 Tiger
		fmt.Println(a.shout(), a.name) // 这里可以直接取出 name 成员
	default: // a的类型是 Animal
		fmt.Println("default", reflect.TypeOf(a), a)
	}
}
```

在上述代码中，我们可以看到`a := animal.(type)`语句隐式地为每个`case`子句声明了一个变量`a`。

变量`a`类型的判定规则如下:

+ 如果`case`后面跟着**一个**类型，那么变量`a`在这个`case`子句中就是这个类型。例如在`case Tiger`子句中`a`的类型就是`Tiger`
+ 如果`case`后面跟着**多个**类型，那么变量`a`的类型就是接口变量`animal`的类型，例如在`case Dog, Cat`子句中`a`的类型就是`Animal`
+ 如果`case`后面跟着`nil`，那么变量`a`的类型就是接口变量`animal`的类型`Animal`，通常这种子句用来判断未赋值的接口变量
+ `default`子句中变量`a`的类型是接口变量`animal`的类型

为了更好地理解上述规则，我们可以用`if`语句和类型断言来重写这个`switch`语句，如下所示：

```go
	v := animal   // animal 只会被求值一次
	if v == nil { // case nil 子句
		a := v
		fmt.Println("nil", a)
	} else if a, isTiger := v.(Tiger); isTiger { // case Tiger 子句
		fmt.Println(a.shout(), a.name)
	} else {
		_, isDog := v.(Dog)
		_, isCat := v.(Cat)
		if isDog || isCat { // case Dog, Cat 子句
			a := v
			fmt.Println(a)
			// fmt.Println(a.name)
		} else { // default 子句
			a := v
			fmt.Println("default", reflect.TypeOf(a), a)
		}
	}
```

## 参考链接

+ [The Go Programming Language Specification](https://golang.org/ref/spec#Type_switches)
