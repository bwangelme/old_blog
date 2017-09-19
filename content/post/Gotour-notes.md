---
title: Go 学习笔记
date: 2017-08-29 08:32:02
tags: [Go, Notes]
---

> __摘要__:

> 1. Golang的基础语法学习

<!--more-->

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
