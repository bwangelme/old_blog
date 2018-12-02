---
title: "Go 的反射包浅析"
date: 2017-09-15T08:30:38+08:00
tags: [Go, ]
---

本文主要介绍了反射包中的常用类型和方法，并使用了几个例子进行了说明。

<!--more-->

## 类型

Golang 是一种静态类型的语言，我们在代码中定义的每个变量，都会有其类型，例如`var a int = 10, b string = "acb"`语句中，我们定义了两个变量`a`和`b`，它们的类型分别是`int`和`string`。

除了系统预定义的类型之外，我们还可以自定义类型，例如下面的语句中，我们定义了一个自定义类型`MyInt`，然后我们分别定义了两个变量`i1`和`i2`，尽管这两个变量的内容是相同的，但是他们由于类型不同，并不能够直接赋值，必须要经过类型转换以后才能赋值。

```go
package main

type MyInt int

func main() {
	var i1 int = 1
	var i2 MyInt = 2

	i1 = i2 //cannot use i2 (type MyInt) as type int in assignment
}
```

## 接口

### 接口类型的定义

在Golang的类型中，还有一种重要的类型叫做接口类型，一个接口类型代表了一组固定的方法。一个接口变量可以存储任意合适的值，只要这个值实现了这个接口的所有方法。

在下面的代码中，我们定义了一个接口类型`Animal`，然后定义了两种结构体类型`Cat`和`Dog`，由于`Cat`和`Dog`都实现了`Animal`的两个方法，所以我们定义的`Animal`接口变量`i`既能存储`Dog`类型的值，又能存储`Cat`类型的值。

```go
package main

import (
    "fmt"
)

type Animal interface {
	run()
	jump()
}

type Dog struct {
}

func (d Dog) run() {
	fmt.Println("A dog is running")
}
func (d Dog) jump() {
	fmt.Println("A dog is jumping")
}

type Cat struct {
}

func (c Cat) run() {
	fmt.Println("A cat is running")
}
func (c Cat) jump() {
	fmt.Println("A cat is jumping")
}

func main() {
	var i Animal

	i = Dog{}
	i.jump()
	i = Cat{}
	i.run()
}
```

### 空接口

在接口类型中，有一种比较特殊，那就是空接口类型`interface{}`。空接口类型的方法集合为空集，意味着任意类型都实现了空接口，也就是说空接口类型的变量能够存储任意类型的值。正是由于空接口的这个特性，我们就可以动态地获取空接口类型变量的实际类型，并更改它的值，来实现我们的反射机制。

### 接口类型的底层实现

每一个接口类型的变量，它其实是由两部分组成，被赋的值的拷贝，和被赋的值的类型描述器。例如上面代码中的`i`变量，我们可以用这样一个二元组来表示: `(c, Cat)`，代表了变量`c`和它的类型`Cat`。

## Type 和 Value

在上文中，我们了解到一个接口变量是由值和值类型两部分组成的，我们的反射相关函数主要就是获取这两部分。当我们调用`reflect.ValueOf`方法的时候，就是获取接口中的变量，并使用一个`reflect.Value`类型的变量来代表它。同理，当我们使用`reflect.TypeOf`方法的时候，它获取的就是接口中存储的变量类型，并使用一个`reflect.Type`类型的变量来代表它。关于`reflect`包中这些常用方法的描述如下所示:

### TypeOf 方法

`reflect.TypeOf`方法的声明如下: `func TypeOf(i interface{}) Type`。

它接收一个__空接口类型变量__`i`作为参数，返回一个`Type`变量，代表了传入参数的类型。由于这个函数的参数是__空接口类型__，所以即使我们传入了一个其他类型的变量，参数也首先会被转换成__空接口类型__。

### ValueOf 方法

`reflect.ValueOf`方法的声明如下：`func ValueOf(i interface{}) Value`

它返回一个`Value`变量代表传入参数`i`运行时的数据。

`Value.Interface()`方法是`ValueOf`方法的逆向方法，`Value`可以通过`Interface()`转换成接口。

### Zero 方法

`reflect.Zero`方法的声明如下: `func Zero(typ Type) Value`

它接收一个`Type`变量，并且返回一个`Value`变量代表`typ`所对应的0值。

### Kind 类型

`reflect.Value`和`reflect.Type`类型有一个`Kind()`方法，它返回一个`reflect.Kind`类型的变量，代表了反射类型`reflect.Type`的具体分类。需要注意的是，`Kind`方法返回的是底层类型，而不是静态声明的类型，如果我们声明了自定义类型`type MyInt int`，通过`Value.Kind()`获取的类型仍然为`int`。具体例子请参考下面这段代码:

```go
package main

import (
	"fmt"
	"reflect"
)

type User struct {
	Name string
	Age  int
}

type MyInt int

func main() {
	u := User{"xff", 19}
	var i MyInt = 42

	t := reflect.TypeOf(u)
	// reflect.Struct是一个reflect.Kind类型的常量，代表了结构体类型
	fmt.Println(t.Kind() == reflect.Struct) // 输出 true

	t = reflect.TypeOf(i)
	// 这里变量i的类型是我们自定义的类型MyInt，但是Type.Kind()方法返回的类型是reflect.Int
	fmt.Println(t.Kind() == reflect.Int) // 输出true
}
```

### Value 的 settable

`settable`就是表示一个通过空接口反射出来的`Value`变量是否是可以修改原始的值，通过调用`Value.CanSet()`方法，我们可以查看某个`Value`的`settable`属性。那么什么情况下`Value`变量可以修改原始的值呢？请参考下面这段代码:

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	var x float64 = 4.1
	xPointerValue := reflect.ValueOf(&x)
	fmt.Println(xPointerValue.CanSet())  // 输出 false

	// 只有 Interface 或 Ptr 类型的 Value 才能调用 Elem 方法
	xPointerValueElem := xPointerValue.Elem()
	fmt.Println(xPointerValueElem.CanSet()) // 输出 true

	xValue := reflect.ValueOf(x)
	fmt.Println(xValue.CanSet())  // 输出 false
	_ = xValue.Elem() // 这里程序会报 panic
}
```

我们可以看到，变量`x`反射出来的变量`xValue`是不能修改原始值的，这是因为`reflect.ValueOf`方法其实是将`x`赋值到了一个空接口变量`o`上，`o`中保存的是`x`的拷贝和`x`的类型描述器，而`ValueOf()`方法返回的`xValue`变量指向的就是空接口变量`o`中保存的`x`的拷贝。如果`xValue`变量可以修改原始值，那么修改的也仅仅只是`x`的拷贝，并不能够修改`x`本身，所以`xValue`是不可修改的。

指针`&x`反射出来的`xPointerValue`也是不能修改原始值的，原理和上文中讲述的类似，`xPointerValue`指向的是空接口变量`o`中保存的`x`的指针的拷贝，这个指针中保存的地址是不可修改的。

但是`xPointer`调用`Elem()`方法获取到的`xPointerValueElem`变量就是可以修改原始值的了，这是因为`xPointerValue.Elem()`方法返回的是这个指针指向的值，也就是`x`，也就是说`xPointerValueElem`指向的就是`x`，所以`xPointerValueElem`就是可以修改原始值的了。

这里的内容比较绕，理解起来可能不太容易，大家可以参考下面的图进行理解：

![golang-reflect](http://owcwlb3jm.bkt.clouddn.com/2017-09-16-1505538303474.jpg)


## 反射的示例

OK，讲了一大串的理论，大家忍不住想要通过代码来验证一下自己的想法了吧，我们接下来就会通过几个例子，来演示一下 Golang 中反射的具体用法。

### 简单数据的类型和内容解析

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	var x float64 = 4.1

	v = reflect.ValueOf(x)
	fmt.Println("Type:", v.Type())
	fmt.Println("Kind is float64:", v.Kind() == reflect.Float64)
	fmt.Println("value:", v.Float())
	// 输出内容
	// Type: float64
	// Kind is float64: true
	// value: 4.1
}
```

在上述代码中，我们设置了一个float64类型的变量x，并通过`reflect.ValueOf`方法来获取这个变量所对应的`reflect.Value`，并输出了这个`reflect.Value`的类型和值。

### 结构体变量的类型和内容解析

```go
package main

import (
	"fmt"
	"reflect"
)

type User struct {
	Id   int
	Name string
	Age  int
}

func (u User) Hello() {
	// 结构体方法的类型名参数其实就是函数的第一个参数，通过反射打印方法类型可以看出
	fmt.Println("Hello, World.")
}

func main() {
	u := User{1, "wahahah", 23}
	Info(u)
}

func Info(o interface{}) {
	// TypeOf获取的某个对象的所有字段的名称和类型
	t := reflect.TypeOf(o)
	fmt.Println("Type:", t)

	// 由于`Type.Field()`方法只支持结构体类型，所以这里如果传入的变量不是结构体类型会直接返回。
	if k := t.Kind(); k != reflect.Struct {
		fmt.Println("Error type")
		return
	}

	// ValueOf获取的是某个对象的所有字段的值
	fmt.Println("Fields:")
	v := reflect.ValueOf(o)

	for i := 0; i < v.NumField(); i++ {
		// t.Filed(i) 返回的是一个`reflect.StructField`类型的变量，描述了结构体类型中的某个字段的类型信息
		field_type := t.Field(i)
		// v.Filed(i) 返回了一个`reflect.Value`类型的变量，代表了结构体类型中某个字段的值
		val := v.Field(i).Interface()
		fmt.Printf("%6s: %v = %v\n", field_type.Name, field_type.Type, val)
	}

	// Method获取的某个对象的所有方法的名字和类型(即方法签名)
	for i := 0; i < t.NumMethod(); i++ {
		m := t.Method(i)
		fmt.Printf("%6s: %v\n", m.Name, m.Type)
	}
}
```

上述代码中，我们遍历了一个结构体类型，输出了它的所有字段的类型和值，还输出了它所有方法的签名。它的输出结果如下所示:
```sh
Type: main.User
Fields:
    Id: int = 1
  Name: string = wahahah
   Age: int = 23
 Hello: func(main.User)
```

### 嵌套结构体变量的类型和内容解析

```go
package main

import (
    "fmt"
	"reflect"
)

type User struct {
	Id   int
	Name string
	Age  int
}

type Manager struct {
	User // 这是一个匿名字段，这个字段的名称也是User
	title string
}

func main() {
	m := Manager{
		User: User{1, "xff", 19},
		title: "manager",
	}
	t := reflect.TypeOf(m)

	fmt.Printf("Type: %#v\n", t.Field(0)) // 这里把User类型当做一个字段
	fmt.Printf("Type: %#v\n", t.Field(1)) // 这里打印的是title字段

	// t.FidleByIndex传入的是一个int的slice，第一个数字表示在大的结构体中的索引，第二个数字表示在User结构体中的索引
	// 打印 User 结构体的 ID 字段
	fmt.Printf("Type: %#v\n", t.FieldByIndex([]int{0,0}))
	// 这里获取的是User结构体的 Name 字段
	fmt.Printf("Type: %#v\n", t.FieldByIndex([]int{0,1}))
}
```

### 简单数据的内容修改

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	var x float64 = 4.1
	xPointerValue := reflect.ValueOf(&x)

	val := xPointerValue.Elem()

	// 检查要更改原始值的 Value 的 settable 属性
	if val.CanSet() {
		val.SetFloat(3.0)
	}

	fmt.Println(x) // 输出3.0
}
```

在上面的代码中，我们演示了如何通过反射来更改一个`float64`类型变量的值。

### 结构体类型变量的内容修改

下面的代码演示了如何从一个结构体变量中获取字段，并改变这个字段的值。

```go
package main

import (
	"fmt"
	"reflect"
)

// 本处代码演示的是如何通过反射动态地修改结构体类型的值

type User struct {
	Id   int
	Name string
	Age  int
}

func main() {
	u := User{1, "bwangel", 23}
	fmt.Println(u)
	Set(&u)
	fmt.Println(u)
}

func Set(o interface{}) {
	pointerValue := reflect.ValueOf(o)
	// 判断类型是指针
	if pointerValue.Kind() != reflect.Ptr {
		fmt.Println(pointerValue.Type(), "Cannot be set")
		return
	}
	// pointerValue.Elem() 了一个Value类型的值， 代表的是这个指针所指向的值
	value := pointerValue.Elem()

	if !value.CanSet() {
		fmt.Println(value, "is not settable")
	}

	// 获取字段的名称，并且判断类型是否为字符串
	// Value.IsValid 方法判断一个 Value 类型是否有效地代表了一个值
	field_name := "Name"
	if f := value.FieldByName(field_name); f.IsValid() {
		if f.Kind() == reflect.String {
			fmt.Println(f, reflect.TypeOf(f))
			// Value.SetString 设置了这个类型所代表的对象的值
			f.SetString("xff")
		}
	} else {
		fmt.Println("Bad Field", field_name)
	}
}
```

### 结构体变量的方法调用

下面的代码演示了如何通过反射来实现结构体变量方法的调用

```go
package main

import (
	"fmt"
	"reflect"
)

type User struct {
	Id   int
	Name string
	Age  int
}

func (u User) Hello(name string, number int) int{
	fmt.Println("hello,", name, "my name is", u.Name, number)
	return 123
}

func main() {
	u := User{1, "bwangel", 23}
	u.Hello("xff", 1)

	v := reflect.ValueOf(u)
	mv := v.MethodByName("Hello")

	// 动态地调用方法传递的参数必须是 reflect.Value 组成的一个切片
	// 可以通过 reflect.ValueOf 将任意值转换成 Value 类型
	args := []reflect.Value{reflect.ValueOf("xff2"), reflect.ValueOf(2)}

	// mv.Call函数执行了实际的方法调用
	// 它返回的是一个由 Value 类型变量组成的数组([]reflect.Value)，代表了所有的返回值
	return_vals := mv.Call(args)
	fmt.Println(len(return_vals), return_vals, return_vals[0]) // 输出 `1 [<int Value>] 123`
}
```

## 参考链接

1. [Go reflect 包的文档](https://golang.org/pkg/reflect)
2. [The Laws of Reflection](https://blog.golang.org/laws-of-reflection)
3. [Go编程基础（无闻）](http://www.ucai.cn/index.php?app=fullstack&mod=Train&act=show&cid=69&sid=3259&chid=4707)
