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

如果我们只关心一种类型，可以使用从 switch 语法分句那借来的语法进行类型判断。

```go
package main

import (
	"fmt"
)

// getString 如果 o 是 string 类型，解析的结果 str 会被转换成字符串类型，否则 str 会变成空字符串
func getString(o interface{}) (string, bool) {
	str, ok := o.(string)
	fmt.Printf("Type of %v: %T\n", str, str)

	return str, ok
}

func main() {
	fmt.Println(getString(3))
	fmt.Println(getString("233"))

	// Type of : string
	//  false
	// Type of 233: string
	// 233 true

}
```

## 函数

### defer

+ `defer`进行延迟调用的参数会立刻生成，但是在上层函数返回前defer指定的函数都不会被调用。
+ 如果有多个`defer`函数，它们的执行顺序是按照 LIFO 顺序来执行的。

```go
package main

import (
	"fmt"
)

func trace(s string) string {
	fmt.Println("entering:", s)
	return s
}

func un(s string) {
	fmt.Println("leaving:", s)
}

func a() {
	defer un(trace("a"))
	fmt.Println("in a")
}

func b() {
	// 在函数进入的时候参数首先就被求值了
	defer un(trace("b"))
	// 这里的两个`defer`语句，b函数退出的时候会先执行`secondb` 再执行`b`，按照 LIFO 顺序
	defer un(trace("second b"))
	fmt.Println("in b")
	a()
}

func main() {
	b()
}

// entering: b
// entering: second b
// in b
// entering: a
// in a
// leaving: a
// leaving: second b
// leaving: b
```


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

## 数据

### 使用`new`分配

```go
func new(Type) *Type
```

`new`将会生成一个`Type`的实例，这个实例将会被初始化成对应的0值。`sync.Mutex`类型的0值是一个未锁定的`mutex`

### 构造器和复合字面值

有时候我们要初始化一个复合类型，但是它的值我们需要初始化成0值以外的其他值，例如当我们创建一个文件的时候:

```go
func NewFile(fd int, name string) *File {
	if fd < 0 {
		return nil
	}
	f := new(File)
	f.fd = fd
	f.name = name
	f.dirinfo = nil
	f.nepipe = 0
	return f
}
```

上面很多赋值语句显得很冗余，我们可以使用复合字面值来初始化一个复合类型的实例:

```go
func NewFile(fd int, name string) *File {
	if fd < 0 {
		return nil
	}
	return &File{fd, name, nil, 0}
}
```

需要注意的是，Go 和 C 不同，它可以返回一个局部变量的地址，和这个值相关的存储空间在函数返回以后继续存在。
事实上，获取一个复合字面值声明的地址每回在它求值的时候将会生成一个新的实例。

复合字面值的声明我们除了可以按照上面的方式声明外，我们也可以按照键值对的方式来声明:

```go
return &File{fd: fd, name: name}
```

没有传入的字段将会被初始化成对应的0值，如何它一个字段也没有传入，将会声明一个0值的类型。`&File{}`等价于`new(File)`。

复合字面值也可以用来声明切片，数组和 map。它可以把字段名当做索引或者 map 的键。

```go
package main

import "fmt"

const (
	Enone = iota
	Eio
	Einval
)

func main() {

	a := [...]string{Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
	s := []string{Enone: "no error", Eio: "Eio", Einval: "invalid argument"}
	m := map[int]string{Enone: "no error", Eio: "Eio", Einval: "invalid argument"}

	fmt.Println(a)
	fmt.Println(s)
	fmt.Println(m)
}

// [no error Eio invalid argument]
// [no error Eio invalid argument]
// map[0:no error 1:Eio 2:invalid argument]
```

### 使用 make 分配空间

`slice`是一个三元组描述器，它们是一个指向数据的指针，长度和容量，在这三个元素被初始化之前，`slice`都是`nil`。
`make`仅仅用来创建`slice`，`map`和`channel`，`make`函数初始化好它们内部的数据结构，并准备好初始化的值。

下面的例子展示了制造`slice`时`make`和`new`的不同，

```go
// p 是一个指向切片的指针，不过这个切片的三元组描述器都没初始化，所以 *p == nil
var p *[]int = new([]int)       // 很少用到
// v 是一个切片，它的三元组描述器被初始化了，它指向一个容量为100的 int 数组
var v  []int = make([]int, 100)

// 不必要的复杂步骤
var p *[]int = new([]int)
*p = make([]int, 100, 100)

// 常用的初始化切片的方法
v := make([]int, 100)
```

### 数组

Go 中数组的一些特点:

1. 数组是值，将一个数组赋值给另外一个会拷贝它的所有元素
2. 如何你给一个函数传递一个数组参数，函数将会接收数组的拷贝，而不是指向数组的指针
3. 数组的长度是它类型的一部分，`[10]int`和`[20]int`是不同的类型

### 切片

`append`向切片中添加元素，如果添加元素的长度超出了切片的容量(切片的容量可由cap函数获取)，那么就会重新分配一个切片。`append`函数会将原始的或者新分配的切片返回。

```go
func main() {
	s := make([]int, 10, 11)
	fmt.Printf("s: %p\n", &s[0])
	s = append(s, 20)
	fmt.Printf("s: %p\n", &s[0])
	s = append(s, 20)
	// 这里可以看到s[0]的地址变了，说明切片指向的数组进行了重新分配，变成了另外一个数组
	fmt.Printf("s: %p\n", &s[0])

	// s: 0xc4200180c0
	// s: 0xc4200180c0
	// s: 0xc420076000
}
```

### 二维切片

```go
type Transform [3][3]float64  // 一个3x3的二维数组
type LinesOfText [][]byte     // 一个二维切片
```

因为切片的长度是由变量确定的(数组的长度是由类型确定的)，所以二维切片的每个内部切片都可以有不同的长度，就像我们声明的`LinesOfText`类型，它内部的每个切片的长度都是不同的。

```go
l := LinesOfText {
	[]byte("竹杖芒鞋轻胜马"),
	[]byte("一蓑烟雨任平生"),
}
```

二维切片可以每次单独分配，也可以更有效的一次分配。

每次单独分配耗时会更多，但是每个内部的一维切片相互独立，不会相互影响。

```go
// Allocate the top-level slice.
picture := make([][]uint8, YSize) // One row per unit of y.
// 在图片上循环，在每一行上分配一个表示当前行像素点的切片
for i := range picture {
	picture[i] = make([]uint8, XSize)
}

// 这种分配方式，每行的像素点存在一个数组中
```

一次分配耗时会更短，但是内部的每个一维切片不能增加或缩短，否则可能会影响到相邻的一维切片。

```go
// Allocate the top-level slice
picture := make([][]uint8, YSize) // One row per unit of y.
// 一次地分配好图片上所有的像素点
pixels := make([]uint8, XSize*YSize)
// 在每一行上循环，每次将总的像素点前面的元素分配到图片的每一行上
for i := range picture {
	picture[i], pixels = pixels[:XSize], pixels[XSize:]
}

// 这种分配方式，所有的像素点都存在同一个数组中
```

### map

任何定义了相等操作符的类型都可以是`map`的`key`。整数，浮点数，复数，字符串，指针，接口（只要这个指针对应的动态类型定义了相等操作符），结构体和数组等都可以是`map`的`key`。
切片不能是`map`的`key`，因为切片没有定义相等操作符。

`map`可以使用复合字面值的语法进行声明，使用冒号来分割键和值:

```go
var timeZone = map[string]int{
	"UTC": 0 * 60 * 60,
	"EST": -5 * 60 * 60,
	"CST": -6 * 60 * 60,
	"MST": -7 * 60 * 60,
	"PST": -8 * 60 * 60,
}
```

如果通过一个不存在的`key`从`map`中获取值的时候，`map`将会返回它的值的零值。`timeZone["NOT_EXIST"] == 0`。我们可以通过这个特性来实现`set`类型。

```go
attended := map[string]bool{
	"Ann": true,
	"Joe": true,
}

// key 不存在的时候默认返回的是 bool 的零值也就是 false
if attended[person] {
	fmt.Println(person, "was at the meeting")
}
```

有时候我们需要区分`map`中的一个`key`是不存在还是它的值就是零值，我们可以使用`map[key]`返回的第二个返回值进行区分。

```go
func main() {
	var timeZone = map[string]int{
		"UTC": 0 * 60 * 60,
		"EST": -5 * 60 * 60,
		"CST": -6 * 60 * 60,
		"MST": -7 * 60 * 60,
		"PST": -8 * 60 * 60,
	}

	seconds, ok := timeZone["UTC"] // ok == true
	seconds, ok = timeZone["UTF"] // ok == false
}
```

像上面这种写法我们称之为"comma ok"方言，它可以和`if`语句一起组成一种优雅的写法:

```go
func offset(tz string) int {
	var timeZone = map[string]int{
		"UTC": 0 * 60 * 60,
		"EST": -5 * 60 * 60,
		"CST": -6 * 60 * 60,
		"MST": -7 * 60 * 60,
		"PST": -8 * 60 * 60,
	}
	if seconds, ok := timeZone[tz]; ok {
		return seconds
	}
	log.Println("unknown time zone:", tz)
	return 0
}
```

如果只想查看某个`key`是否在`map`中存在而不关心它的值的话，我们可以使用`_`忽略掉值:

```go
_, present := timeZone[tz]
```
如果想要删除掉`map`中的某个`key`，我们可以使用`delte`內建函数，如果要删除的`key`在`map`中不存在的话，它也不会抛出任何异常。

```go
delete(timeZone, "PDT")  // 要删除的 key 不存在
```

### 打印

`Println`系列的函数会将每个逗号都变成空格，并且会在输出的结尾加上换行符

`Print`系列函数仅仅会将两边都不是字符串的逗号变成空格。

```go
fmt.Print(23, "hello world", 42, true) // `23hello world42 true`
```

`Fprint`系列的函数的第一个参数是实现了`io.Writer`接口的对象，变量`os.Stdout`和`os.Stderr`都是实现了这个接口的对象。

在 Go 中，格式化数字的字符串（例如%d）并不会向C语言那样传递是否有符号的标记，或者长度的标记（`%u`, `%lu`），它是根据参数的类型来输出对应的结果。

```go
var x uint64 = 1<<64 - 1 // x 为64位无符号整数的最大值
fmt.Printf("%d %x, %d %x\n", x, x, int64(x), int64(x)) // 将 x 转换成 int64 类型整数将会溢出

// 18446744073709551615 ffffffffffffffff, -1 -1
```

关于其他的格式化字符串，说明如下：

```go
type point struct {
	x, y int
}

func main() {
	p := point{1, 2}

	// 输出结构体的值或者其他任意类型的值
	// Print 和Println 函数默认使用的就是这个格式化字符串
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
	fmt.Printf("%s\n", "\"string\"") // "string"

	// 输出原始未转义的字符串
	fmt.Printf("%q\n", "\"string\"") // "\"string\""

	// 输出不带转义符号的原始字符串
	fmt.Printf("%#q\n", "\"string\"") // `"string"`

	// 输出数字的单引号表示
	fmt.Printf("%q\n", 3) // '\x03'

	// 输出字符串的十六进制表示
	fmt.Printf("%x\n", "hex this") // 6865782074686973

	// 在输出的字节中添加上空格
	fmt.Printf("%x\n", "hex this") // 68 65 78 20 74 68 69 73

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

如果你想要更改自定义类型的默认字符串格式，只需要给这个类型实现`String() string`方法即可。
注意如果想要更改某个类型的值及其指针的打印方式，应该讲传入的类型变量设置成值传入

```go
// Point 是二维坐标中的一个点
type Point struct {
	x, y int
}

// 这个方法只会改变 *p 的格式化字符串
func (p *Point) String() string {
	return fmt.Sprintf("[%d, %d]", p.x, p.y)
}

// 这个方法会改变 p 和 *p 的格式化字符串
func (p Point) String() string {
	return fmt.Sprintf("[%d, %d]", p.x, p.y)
}

func main() {
	p := &Point{2, 3}
	fmt.Println(p)
}
```

注意在`String() string`方法中不要再来通过`Printf`系列的函数打印类型`p`本身，以免产生递归调用`String() string`方法的情况。

```go
type MyString string

func (m MyString) String() string {
    return fmt.Sprintf("MyString=%s", m) // 这里将会产生递归调用的错误
}
```

如果想要避免上述的错误，只需要将类型`MyString`转换成基类就可以了

```go
type MyString string

func (m MyString) String() string {
    return fmt.Sprintf("MyString=%s", string(m)) // 这里将不再会产生递归调用的错误
}
```

我们还可以自定义传递任意个参数的打印函数，我们可以通过`v ...Type`声明一个类型是`Type`的参数v，表示这个参数有任意个。然后通过`v...`的方式将这个参数传递到可以接收任意个参数的函数中，`v...`表示v是多个参数，而不是单个切片参数。如果我们将`v`的类型声明成`interface{}`，那么就表示这个参数`v`可以是任意类型。

```go
package main

import (
	"fmt"
	"os"
)

type User struct {
	nickname string
	age      int
	gender   bool
}

func Println(v ...interface{}) {
	os.Stderr.WriteString(fmt.Sprintln(v...))
}

func main() {
	u := User{
		nickname: "bwangel",
		age:      23,
		gender:   false,
	}
	Println("xff", 2, u)
}
```

同时，我们也可以直接把切片当做`v...`传递进入函数中,下面这个获取最小值的整数，我们直接将整个切片传入进去，再返回其中的最小值。

```go
package main

import (
	"fmt"
)

func min(a ...int) int {
	// 将0取反再右移一位，会得到最大的有符号整数
	minValue := int(^uint(0) >> 1) // 首先将 minValue 声明成最大的整数

	for _, value := range a {
		if value < minValue {
			minValue = value
		}
	}

	return minValue
}

func main() {
	a := []int{2, 3, -4, 0}
	fmt.Println(min(a...))
}
```

### 整数

Go 中获取整数最大值和最小值的方法：

```go
const MaxUint = ^uint(0)
const MinUint = 0
const MaxInt = int(MaxUint >> 1)
const MinInt = -MaxInt - 1
```

整数的取值范围如下:

```
uint8  : 0 to 255
uint16 : 0 to 65535
uint32 : 0 to 4294967295
uint64 : 0 to 18446744073709551615
int8   : -128 to 127
int16  : -32768 to 32767
int32  : -2147483648 to 2147483647
int64  : -9223372036854775808 to 9223372036854775807
```

Go 中将一个数值赋值给一个整型变量的时候，数值不能超出这个整型变量的范围。

```go
var b int8 = int8(255)
// 抛出panic，constant 255 overflows int8
```

上面的代码中将255类型强转了，但255并没有溢出转换成-1，而是抛出 panic 。

### Append 函数

Go 內建的`append`函数签名如下:

```go
func append(slice []T, elements ...T) []T
```

其中`T`是一个表示任意类型的占位符，你无法用 Go 语言实现这样一个`T`由调用者确定的函数，`append`的实现得到了编译器的支持，所以它是一个內建函数。

当我们想把两个切片合并的时候，只需要向上面那样通过`s...`的方式传递切片函数即可，
```go
func main() {
	x := []int{1, 2, 3}
	y := []int{4, 5, 6}

	x = append(x, y...)
	fmt.Println(x)
}
```

如果直接使用`append(x, y)`的话，程序将会抛出异常，因为`y`和`x`的元素的类型`int`不匹配。


## 初始化

### 常量

Go 中的常量是在编译的时候由编译器创建的，它仅可以是数字，字符(runes)，字符串和布尔值。因为其在编译期创建的缘故，所以如果将一个表达式赋值给常量，这个表达式必须是可以被编译器求值的。例如`1 << 3`就是可以被编译器求值的，而`math.Sin(math.Pi/4)`就不可以，因为函数的调用发生在运行时期。

使用`iota`枚举器可以生成若干个枚举的常量。

```go
package main

import (
	"fmt"
)

// ByteSize 表示字节类型
type ByteSize float64

// 一些常用的字节单位常量
const (
	_           = iota // 初始值 0 被忽略掉了
	KB ByteSize = 1 << (10 * iota)
	MB
	GB
	TB
	PB
	EB
	ZB
	YB
)

// 返回 ByteSize 的字符串表示
// 注意 fmt.Sprintf("%.2f", b)不会产生递归调用，
//	因为只有当Sprintf想要获取某个类型对应的字符串表示的时候，其才会调用这个类型对应的String函数
//	这里使用 %f 进行格式化，只需要 ByteSize 类型的浮点数表示，所以不会调用 String 函数
func (b ByteSize) String() string {
	switch {
	case b >= YB:
		return fmt.Sprintf("%.2fYB", b/YB)
	case b >= ZB:
		return fmt.Sprintf("%.2fZB", b/ZB)
	case b >= EB:
		return fmt.Sprintf("%.2fEB", b/EB)
	case b >= PB:
		return fmt.Sprintf("%.2fPB", b/PB)
	case b >= TB:
		return fmt.Sprintf("%.2fTB", b/TB)
	case b >= GB:
		return fmt.Sprintf("%.2fGB", b/GB)
	case b >= MB:
		return fmt.Sprintf("%.2fMB", b/MB)
	case b >= KB:
		return fmt.Sprintf("%.2fKB", b/KB)
	}
	return fmt.Sprintf("%.2fb", b)
}

func main() {
	fmt.Println(ByteSize(YB))
}
```

### 变量

变量可以像常量一样初始化，不过它们可以使用在运行时计算值的表达式。

```go
var (
	home   = os.Getenv("HOME")
	user   = os.Getenv("USER")
	gopath = os.Getenv("GOPATH")
)
```

### init 函数

+ 每个文件都可以包含`init`函数，`init`函数会在文件内所有的变量都被求值以后再执行，而变量求值会在所有导入文件都被执行以后再执行。
+ `init`函数可以有多个，它们会按顺序执行。

```go
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
)

var (
	home = os.Getenv("HOME")
	user = os.Getenv("USER")
)

var gopath string

func init() {
	if user == "" {
		log.Fatal("$USER not set")
	}
	if home == "" {
		home = "/home/" + user
	}
	if gopath == "" {
		gopath = home + "/go"
	}
	// 在init函数中完成了命令行参数的绑定，flag包用来解析命令行参数
	// gopath may be overridden by --gopath flag on command line.
	flag.StringVar(&gopath, "gopath", gopath, "override default GOPATH")
}

func main() {
	flag.Parse()
	fmt.Println(home, user, gopath)
}
```

## 方法

### 指针 VS  值

在一个类型上实现的方法可以细分为__指针类型方法__和__值类型方法__。

```go
// ByteSlice 字节切片
type ByteSlice []byte

// Append 向 ByteSlice 中添加元素
func (p *ByteSlice) Write(data []byte) (n int, err error) {
	slice := *p
	l := len(slice)
	if l+len(data) > cap(slice) { // reallocate
		// Allocate double what's needed, for future growth.
		newSlice := make([]byte, (l+len(data))*2)
		// The copy function is predeclared and works for any slice type.
		copy(newSlice, slice)
		slice = newSlice
	}
	slice = slice[0 : l+len(data)]
	for i, c := range data {
		slice[l+i] = c
	}
	*p = slice

	return len(data), nil
}

// 返回 ByteSlice 变量的长度
func (b ByteSlice) String() string {
	return fmt.Sprintf("%d", len(b))
}

func main() {
	var b ByteSlice

	// Fprintf函数使用指针的原因是， io.Write 接口 Write 是指针类型方法
	// 值类型方法可以被 *ByteSlice 和 ByteSlice 类型的变量调用，但是指针类型方法只可以被 *ByteSlice 类型的变量调用
	fmt.Fprintf(&b, "hello, %s", "golang")
	fmt.Printf("%s", b)
}
```

上面的代码中，Write 是指针类型方法，String 是值类型方法。

两者的调用规则是:

+ 值类型变量和指针类型变量都可以调用值类型方法
+ 只有指针类型变量能够调用指针类型方法
+ 使用值类型变量直接调用指针类型方法的时候，Go 编译器会自动插入取地址符。(b.Write -> &b.Write)
+ 指针类型变量调用值类型方法是先通过引用获取到值，再传递给值类型方法，即实际传递的是一个新的值的拷贝

这么规定的原因是指针类型方法传入的 receiver 是指针，它可以改变原始变量的值。如果值类型变量能够调用指针类型方法的话，那么传递给指针类型方法的 receiver 就是值的拷贝（例如当做函数参数的时候传入的是值的拷贝，再调用指针类型方法，改变的实际是函数的参数，而不是我们传入的值）。这样导致对于变量的修改无效，所以规定__只有指针类型变量能够调用指针类型方法__。

## 接口

### 接口的基础定义

+ 在Go中，每个变量都有类型和值，一般来说，每个变量的值必须要和其类型对应。
+ 接口就是定义一组方法的集合，如果某个类型实现了这些所有的方法集合，它就__实现__了这个接口
+ 一个接口声明的变量我这里称之为__接口变量__，例如`var n interface{}`中，`n`就是一个接口变量。
+ 接口变量可以存储多种类型的值，但是这些类型必须__都实现__了这个接口

### 接口的底层实现

接口类型的变量在底层存储一对值，一个是实现了这个接口的数据项的值，即被赋值给这个接口变量的值。另一个是数据项的类型描述器，类型描述器完整地描述了数据项的类型。

例如下面这段代码中:

```go
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

### 例子

一个类型只要实现了`sort.Sort`规定的接口（即实现，Len, Less, Swap 这三个方法），就可以被`sort.Sort`函数调用。

```go
package main

import (
	"fmt"
	"sort"
)

// Sequence 整型序列类型
type Sequence []int

// Len 获取 Sequence 的长度
func (s Sequence) Len() int {
	return len(s)
}

// Less 比较 Sequence 中两个元素的大小
func (s Sequence) Less(i, j int) bool {
	return s[i] < s[j]
}

// Swap 交换 Sequence 中的两个元素
func (s Sequence) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

// String 打印 Sequence 中的元素
func (s Sequence) String() string {
	str := "["
	for i, v := range s {
		if i > 0 {
			str += ", "
		}
		str += fmt.Sprintf("%v", v)
	}
	str += "]"

	return str
}

func main() {
	var s Sequence = []int{2, 3, 5, 9, -1, 0, 1e10}

	fmt.Println("Before sort:", s)
	// 只要一个类型实现了 Len, Less, Swap 这三个方法，他就可以被 sort 函数调用
	// sort.Sort(s)
	// 也可以将 Sequence 类型转换成 []int 类型然后调用 []int 类型的方法进行排序
	sort.IntSlice(s).Sort()
	fmt.Println("After sort:", s)

	// Before sort: [2, 3, 5, 9, -1, 0, 10000000000]
	// After sort: [-1, 0, 2, 3, 5, 9, 10000000000]
}
```

创建 HTTP 服务器。

HTTP 服务器的`ListenAndServe`第二个参数为实现了`http.Handler`接口的实例（即实现了`ServeHTTP(ResponseWriter, *Request)`方法），至于是如何实现的，它并不关心，所以它的第二个参数可以是结构体，布尔类型，甚至是函数。

当`ListenAndServe`方法的第二个参数是函数的时候，需要使用`http.HandlerFunc`做一层代理，即`http.HandlerFunc`实现了`ServeHTTP`方法，它在`ServeHTTP`方法中，再将请求和响应交给传入的函数进行处理。

```go
package main

import (
	"os"
	"fmt"
	"log"
	"net/http"
)

// Counter 页面访问次数统计
type Counter struct {
	n  int
	ch chan *http.Request
}

// ServerHTTP 可以作为一个 HTTP Handler
func (ctr *Counter) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctr.ch <- r
	ctr.n++
	log.Println(ctr.n)
	fmt.Fprintln(w, "notifiction sent")
}

var counter Counter

// Receiver 接收请求的回调
func Receiver() {
	request := <-counter.ch
	log.Println("Receiver: request url is ", request.URL)
}

func init() {
	counter = Counter{
		1, make(chan *http.Request, 1),
	}
}

func ArgServer(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, os.Args)
}

func main() {

	go func() {
		for {
			Receiver()
		}
	}()

	// 指针类型调用值类型方法的时候是先通过引用获得值，再进行赋值传递
	log.Println("Server PV Service on 0.0.0.0:8000")

	server := http.NewServeMux()
	server.Handle("/args", http.HandlerFunc(ArgServer))
	server.Handle("/", &counter)

	http.ListenAndServe(":8000", server)
}
```

## 空白标识符

### 未使用的包和变量

当我们在开发程序的时候，有时候程序写到一半，需要编译一下验证一下错误。但是这时可能存在一些导入了没有使用的包或者一些定义了但没有使用的变量。为了编译通过，我们通常会把这些包和变量先删除掉，编译过后再添加上，但这样显得太繁琐了，我们可以使用空白标识符来解决这个问题。

```go
package main

import (
    "fmt"
	"os"
	"io"
	"log"
)

var _ io.ByteReader // delete when done

func main() {
	path := "/tmp/"
	if _, err := os.Stat(path); os.IsNotExist(err) {
		fmt.Printf("%s does not exist", path)
	} else {
		fd, err := os.Open("/tmp/abcd")
		if err != nil {
			log.Fatal(err)
		}
		_ = fd
	}

}
```

上面的代码中我们的`io`包和变量`fd`都暂时没有使用，我们可以将他们用空白标识符声明，这一就可以编译通过了，同时我们应该写上注释，在完成后将这些语句删除。

### 使用包的初始化功能

```go
package main

import (
	"log"
	"net/http"
	_ "net/http/pprof"
)

func main() {
	log.Fatal(http.ListenAndServe(":8000", nil))
}
```

`net/http/pprof`包在初始化函数中在默认的`ServerMux`上注册了几个 Handler，我们仅仅需要使用这些默认的 Handler，而不需要使用`net/http/pprof`包中的功能。

在这种情况下，我们可以使用`import _ "net/http/pprof"`语句，这样我们的程序默认只运行了`net/http/pprof`的初始化程序，但是不会导致有导入包未使用的编译错误。

### TODO Interface checks

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
