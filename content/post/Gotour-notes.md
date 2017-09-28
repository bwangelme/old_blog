---
title: Go 学习笔记
date: 2017-08-29 08:32:02
tags: [Go, Notes]
---

> __摘要__:

> 1. Golang的基础语法学习

<!--more-->

## 控制结构

### for 循环

`range`分句能够迭代数组，切片，字符串，map，或者 channel 等多种数据结构。它会返回两个值，分别代表【索引，值】（数组，切片，字符串），【键，值】（map），【值，是否关闭】（channel）等多种情况。

如果你只想要取 range 返回的第一个值，可以直接丢掉第二个：
```go
for key := range map[string]string{"Name": "bwangel"} {
  fmt.Println(key)
}
```

如果你想获取 range 返回的第二个值，需要使用空白标识符`_`来丢弃第一个:
```go
for _, value := range []int{1, 2, 3} {
  fmt.Println(value)
}
```

对于字符串，range 分句做了很多事情，它通过解析 UTF-8 编码将字符串按照独立的码点分割开来。对于无效的编码，它认为其是一个独立的字节，并将其转换成了 rune U+FFFD 的形式。其中 rune 是 Go 语言中的一个术语，用来表示单个 Unicode 码点。下面的循环:
```go
for pos, char := range "中国\x80汉字" {
  fmt.Printf("%d: %#U\n", pos, char)
}
```
将会打印:
```bash
0: U+4E2D '中'
3: U+56FD '国'
6: U+FFFD '�'
7: U+6C49 '汉'
10: U+5B57 '字'
```

最后，Go 将没有逗号的操作符和`++`，`--`视作语句而不是表达式，意味着`i++`无法成为右值进行赋值。如果你想要累加一个数字并进行赋值，可以考虑使用并行赋值(这样就杜绝了`++`和`--`的赋值):
```go
// Reverse a
for i, j := 0, len(a)-1; i < j; i, j = i+1, j-1 {
    a[i], a[j] = a[j], a[i]
}
```

### switch 语句

在 Go 语言中，并不需要使用`break`语句来跳出 switch 语句块，它碰到匹配的 case 子句并运行其中的代码后，就会自动退出。但是可以使用`break`语句来跳出外层的 for 循环。
```go
for i:= 0; i < 100; i++ {
  switch i {
  case 10:
    fmt.Println(i)
    break
  }
}
```

同时，`break`语句也可以跳到一个指定的标签上，
```go
//TODO: 下面这段代码还需要去理解一下
Loop:
	for n := 0; n < len(src); n += size {
		switch {
		case src[n] < sizeOne:
			if validateOnly {
				break
			}
			size = 1
			update(src[n])

		case src[n] < sizeTwo:
			if n+1 >= len(src) {
				err = errShortInput
				break Loop
			}
			if validateOnly {
				break
			}
			size = 2
			update(src[n] + src[n+1]<<shift)
		}
	}
```

最后，我们使用一个比较 byte 切片的函数来结束这一小节，

```go
func Compare(a, b []byte) int {
	for i := 0; i < len(a) && i < len(b); i++ {
		switch {
		case a[i] > b[i]:
			return 1
		case a[i] < b[i]:
			return -1
		}
	}

	switch {
	case len(a) > len(b):
		return 1
	case len(a) < len(b):
		return -1
	}

	return 0
}
```

### 类型 switch

我们可以使用`v.(type)`来判断一个空接口类型变量的动态类型，当在`switch`的表达式内声明了一个变量，这个变量将会拥有合适的类型。
```go
var t interface{}
t = functionGetSomeType()
switch t := t.(type) {
default:
    fmt.Printf("unexpected type %T\n", t)     // %T prints whatever type t has
case bool:
    fmt.Printf("boolean %t\n", t)             // t has type bool
case int:
    fmt.Printf("integer %d\n", t)             // t has type int
case *bool:
    fmt.Printf("pointer to boolean %t\n", *t) // t has type *bool
case *int:
    fmt.Printf("pointer to integer %d\n", *t) // t has type *int
}
```

## 字符串

### 字符串的格式化

```go
package main

import "fmt"
import "os"

type point struct {
    x, y int
}

func main() {
    p := point{1, 2}

    // 输出结构体的值
    fmt.Printf("%v\n", p)

    // 输出结构体的变量名和值
    fmt.Printf("%+v\n", p)

    // 输出变量的 Go 语法表示
    fmt.Printf("%#v\n", p)

    // 输出变量的类型
    fmt.Printf("%T\n", p)

    // 直接格式化布尔值
    fmt.Printf("%t\n", true)

    // 输出数值
    fmt.Printf("%d\n", 123)

    // 输出数字的二进制表示
    fmt.Printf("%b\n", 14)

    // 输出数字编码所对应的字符
    fmt.Printf("%c\n", 33)

    // 输出数字的十六进制表示
    fmt.Printf("%x\n", 456)

    // 输出浮点数
    fmt.Printf("%f\n", 78.9)

    // 输出数字的科学计数法，使用e
    fmt.Printf("%e\n", 123400000.0)

    // 输出数字的科学计数法，使用E
    fmt.Printf("%E\n", 123400000.0)

    // 输出字符串
    fmt.Printf("%s\n", "\"string\"")

    // 输出原始未转义的字符串
    fmt.Printf("%q\n", "\"string\"")

    // 输出字符串的十六进制表示
    fmt.Printf("%x\n", "hex this")

    // 输出指针的表示
    fmt.Printf("%p\n", &p)

    // 控制输出长度
    fmt.Printf("|%6d|%6d|\n", 12, 345)

    // 控制小数点后的总位数，6表示输出长度
    fmt.Printf("|%6.2f|%6.2f|\n", 1.2, 3.45)

    // 用-进行左对齐
    fmt.Printf("|%-6.2f|%-6.2f|\n", 1.2, 3.45)

    // 控制字符串的输出长度和对齐方式
    fmt.Printf("|%6s|%6s|\n", "foo", "b")
    fmt.Printf("|%-6s|%-6s|\n", "foo", "b")

    // 将字符串输出到字符串中
    s := fmt.Sprintf("a %s", "string")
    fmt.Println(s)

    // 将字符串输出到IO流中
    fmt.Fprintf(os.Stderr, "an %s\n", "error")
}
```

## 函数

### defer

`defer`进行延迟调用的参数会立刻生成，但是在上层函数返回前defer指定的函数都不会被调用，例如下面的代码:

```go
func add(x, y int) int {
    fmt.Println("add")
    return x + y
}

func deferPrint() {
    defer fmt.Println(add(3, 5))
    fmt.Println("Good night")
}
```

`add`函数会在`fmt.Println("Good night")`语句之前调用并返回8，实际执行的`defer`调用`fmt.Println(8)`则会在`deferPrint`函数退出的时候调用。


### 闭包

```go
package main

import (
	"fmt"
	"time"
)

func initSeq(i int) func() int {
	// 这里i一直保存的是历史的值
	return func() int {
		i++
		return i
	}
}

func closure(x int) func(int) int {
	return func(y int) int {
		// 这里打印出来的两个地址是相同的，说明x引用的是自外部函数的值
		return x + y
	}
}

func closureFor() {
	for i := 0; i < 10; i++ {
		go func() {
			// 它引用的是外部i变量的指针，并没有将i的值复制，所有反映的是i实时的值
			fmt.Println(i)
		}()
	}
}

func main() {
	seq := initSeq(5)

	fmt.Println(seq())
	fmt.Println(seq())
	fmt.Println(seq())

	add3 := closure(3)
	fmt.Println("add3:", add3(4))

	closureFor()

	time.Sleep(2 * time.Second)

}
// 程序输出结果
// >>> go run closures.go                                                                           20:27:32 (09-20)
// 6
// 7
// 8
// 0xc42006e1d0
// 0xc42006e1d0
// add3: 7
// 4
// 10
// 10
// 10
// 10
// 10
// 10
// 10
// 10
// 10
```

### 命名返回值

Go 函数中的结果参数可以被命名，命名后就会像参数一样当做一个普通变量来对待。当函数初始化的时候，它们被初始化成对应类型的零值，当函数执行`return`语句的时候，结果参数的当前值就会被当做返回值。__注意，当函数签名声明了返回值以后，函数必须要调用`return`语句进行返回__。

结果参数的名字并不是强制的，但是它可以让代码变得更加清晰。有一版本的`io.ReadFull`就是这样做的的:
```go
// 注意传入的 buf 是一个数组，这个函数将会最多阅读 len(buf) 个字节到buf中
func ReadFull(r Reader, buf []byte) (n int, err error) {
    for len(buf) > 0 && err == nil {
        var nr int
        nr, err = r.Read(buf)
        n += nr
        // 刚开始 buf 是数组，这条语句调用后 buf 就变成切片了
        buf = buf[nr:]
    }
    return
}
```

## 接口

### 接口的基础定义

+ 在Go中，每个变量都有类型和值，一般来说，每个变量的值必须要和其类型对应。
+ 接口就是定义一组方法的集合，如果某个类型实现了这些所有的方法集合，它就__实现__了这个接口
+ 一个接口声明的变量我这里称之为__接口变量__，例如`var n interface{}`中，`n`就是一个接口变量。
+ 接口变量可以存储多种类型的值，但是这些类型必须__都实现__了这个接口

### 接口的底层实现

接口类型的变量在底层存储一对值，一个是实现了这个接口的数据项的值，即被赋值给这个接口变量的值。另一个是数据项的类型描述器，类型描述器完整地描述了数据项的类型。

例如下面这段代码中:

```
var r io.Reader
tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
r = tyy
```

我们将`tty`赋值给了`r`，`r`实际上存储的是一个二元组`(tty, *os.File)`。

### 空接口

+ 空接口的含义就是没有定义任何方法的接口，这也就意味着__任意一个类型都已经实现了空接口__。
+ 因为任意一个类型都实现了空接口，所以空接口的接口变量可以存储任意类型的值，例如下面的一段代码:

```
package main

import "fmt"

func main() {
    // 因为j, k 是空接口类型的变量，所以它们能够存储任意类型的值。
    var j, k interface{}
    j, k = 1, " hello, world "
    fmt.Print(j, k, k, j)
}
```

+ 判断一个接口变量是否为空，就是要看它的值是否为该接口类型的空值，请看下面这段代码

```
var n interface{}
fmt.Println(n == nil) // 输出true

var p *int = nil
// 这句代码更改了接口变量n的值，令它的值变成了 *int 类型的nil
n = p
fmt.Println(n == nil) // 输出false
```

在上面的代码中我们可以看到，在执行了`n = p`语句之后，尽管`n`的值仍然为`nil`，但是变成了`*int`类型的`nil`，而不是`interface{}`类型的`nil`了，`n == nil`就会返回`false`。


### 接口的转换

+ 超集接口类型可以转换成子集接口类型，但是子集不能转换成超集。具体来说就是__方法多的接口能转换成方法少的，但是方法少的接口不能转换成方法多的__。请参看下面这段代码:

```go
package main

import (
    "fmt"
)

type Connector interface {
    Connect()
}

type USB interface {
    Name() string
    Connector
}

type PhoneConnector struct {
    name string
}

func (pc PhoneConnector) Connect() {
    fmt.Println("connected:", pc.name)
}

func (pc PhoneConnector) Name() string {
    return pc.name
}

func main() {
    var u USB
    u = USB(PhoneConnector{"phone connector"})
    u.Connect()

    // 将USB类型转换成Connector类型，从方法多的接口类型转换成方法少的接口类型
    var c Connector = Connector(u)
    c.Connect()

    // 下面这个转换语句会报错，不能从方法少的接口类型转换成方法多的接口类型。
    var u2 USB
    u2 = USB(c)
}
```

### 接口的嵌套定义

+ 一个接口A的定义中可以包含另外一个接口B，则接口A所定义的方法集合中也就有了接口B的方法集合。例如下面这段代码:

```go
type USB interface {
    Name() string
    // 这里在USB接口中嵌入了一个Connector接口，USB接口默认有了Connector接口的方法
    Connector
}

type Connector interface {
    Connect()
}

type TVConnector struct {
    name string
    Connector
}

func (tv TVConnector) Connect() {
    fmt.Println("Connect:", tv.name)
}

func main() {
    var tv = TVConnector{"TV Connector"}
    var u USB
    // 这里会报错，无法将TVConnector类型的接口变量tv转换成USB类型。
    u = USB(tv)
    u.Connect()

    // ./interface.go:69: cannot convert tv (type TVConnector) to type USB:
    //     TVConnector does not implement USB (missing Name method)
}
```

在上面的代码中我们可以看到，实现`USB`接口需要实现两个方法，`Name() string`和`Connect()`，而`TVConnector`类型就只实现了一个方法，所以它不能被转换成`USB`类型的变量。

## 错误

+ 当一个自定义类型实现了`error`接口，那么当使用`fmt.Println`函数打印这个类型的时候，就会调用这个类型的`Error`函数，获取这个类型的错误信息。

```go
package main

import (
    "fmt"
    "math"
)

// ErrNegetiveSqrt 为自定义的异常
type ErrNegetiveSqrt float64

func (e ErrNegetiveSqrt) Error() string {
    // 如果直接将e的值进行打印 fmt.Sprintf("%v", e)，程序就会陷入死循环
    // 因为e的类型为error，所以Sprintf函数打印的时候就会去调用Error函数获取返回值，结果就会陷入循环调用之中
    return fmt.Sprintf("cannot Sqrt negative number: %v", float64(e))
}

func Sqrt(x float64) (float64, error) {
    // 因为这里声明了返回值为error，所以默认会将x转换成error,然后Println打印的时候就会获取Error函数的返回值。
    if x < 0 {
        return 0, ErrNegetiveSqrt(x)
    } else {
        return math.Sqrt(float64(x)), nil
    }
}

func main() {
    fmt.Println(Sqrt(2))
    val, err := Sqrt(-2)
    fmt.Println(val, "--->", err)
}
```

## IO 模块

ROT13解密的程序

```go
package main

import (
    "io"
    "os"
    "strings"
)

type rot13Reader struct {
    r io.Reader
}

func (v *rot13Reader) Read(bytes []byte) (int, error) {
    input_bytes := make([]byte, 1024, 2048)
    n, err := v.r.Read(input_bytes)

    if err != nil {
        return 0, err
    }

    for i := 0; i < n; i++ {
        cipher := input_bytes[i] + 13
        if input_bytes[i] >= 97 && input_bytes[i] <= 122 {
            if cipher > 122 {
                cipher = cipher - 26
            }
        } else if input_bytes[i] >= 65 && input_bytes[i] <= 90 {
            if cipher > 90 {
                cipher -= 26
            }
        } else {
            cipher = input_bytes[i]
        }
        bytes[i] = cipher
    }

    return n, nil
}

func main() {
    s := strings.NewReader("Lbh penpxrq gur pbqr!")
    r := rot13Reader{s}
    io.Copy(os.Stdout, &r)
}
```
