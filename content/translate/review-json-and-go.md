---
title: "Review 《JSON and Go》"
date: 2019-05-21T21:40:40+08:00
lastmod: 2019-05-21T21:40:40+08:00
draft: false
tags: [翻译, Go, JSON]
author: "bwangel"
comment: true
toc: true

---

> + 原文地址: https://blog.golang.org/json-and-go

<!--more-->

---

## 引言

JSON (JavaScript Object Notation) 是一种简单的数据交换格式。语法上它很像 JavaScript 的对象和数组。它最常用的场景是 Web 浏览器上的 JavaScript 程序和 Web 后端进行通信。
在它的官网 [json.org](https://json.org) 上，提供了特别清楚和简明的标准定义。

使用 [encoding/json](https://golang.org/pkg/encoding/json/)，可以在 Go 程序中快速地读写 JSON 数据。

## Encoding

我们使用 [Marshal](https://golang.org/pkg/encoding/json/#Marshal) 函数来编码 JSON 数据。

```go
func Marshal(v interface{}) ([]byte, error)
```

给定一个 Go 数据结构 `Message`，

```go
type Message struct {
    Name string
    Body string
    Time int64
}
```

同时创建一个 `Message` 的实例，

```go
m := Message{"Alice", "Hello", 1294706395881547000}
```

我们可以使用 `json.Marshal` 来生成一个 JSON 编码版本的`m`

```go
b, err := json.Marshal(m)
```

在执行了上述操作后，`err`应该是`nil`，`b`应该是一个包含如下数据的`[]byte`变量，

```
b == []byte(`{"Name":"Alice","Body":"Hello","Time":1294706395881547000}`)
```

只有被表示为有效 JSON 的数据数据结构才能被编码：

+ JSON 对象只支持字符串作为`key`，如果要编码一个 Map 变量，那么这个 Map 变量必须是`map[string]T`类型，`T`可以是 JSON 包支持的任意 Go 类型。
+ Channel, complex 和函数类型不能被编码
+ 循环数据结构是不被支持的，它将会导致 `Marshal` 函数进入一个死循环。
+ 指针将会被编码成它指向的值(如果指针是`nil`的话，将被编码成`null`)。

JSON 包仅仅会访问结构体中导出的字段(字段名首字母为大写)。因此只有一个结构体的导出字段将会展示在 JSON 输出中。

## Decoding

我们使用 [Unmarshal](https://golang.org/pkg/encoding/json/#Unmarshal) 函数来解码 JSON。

```go
func Unmarshal(data []byte, v interface{}) error
```

首先我们应该创建一个存储解码数据的变量，

```go
var m Message
```

然后调用 `json.Unmarshal` 函数，将`[]byte`类型的 JSON 数据和指向m的指针传递进去。

```go
err := json.Unmarshal(b, &m)
```

如果`b`包含了适合`m`的有效 JSON 数据，上述函数返回的`err`应该是`nil`，b中所存储的数据也应该被存储到了结构体变量`m`中。变量`m`中的值如下所示:

```go
m = Message{
    Name: "Alice",
    Body: "Hello",
    Time: 1294706395881547000,
}
```

`Unmarshal`是如何从结构体中找到存储被解码数据的字段的呢？对于一个给定的 Key "Foo"，`Unmarshal`将会通过以下的顺序从目的结构体中寻找合适的字段：

1. 结构体中含有标签 `Foo` 的 __导出字段__ 。(关于结构体字段标签请参考 [Go spec](https://golang.org/ref/spec#Struct_types))
2. 结构体中名字为`Foo`的 __导出字段__ 。
3. 结构体中名字为`FOO`, `FoO`或其他名字类似于`Foo`的大小写不敏感的 __导出字段__ 。

+ 示例代码:

```go
import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)


func TestUnmarshalOrder(t *testing.T) {
	data := []byte(`{"Name1":"Alice","Body":"Hello","Time":1294706395881547000}`)
	var m struct{
		Name string
		NAME1 string
	}

	err := json.Unmarshal(data, &m)
	assert.Nil(t, err)
	assert.Equal(t, m.NAME1, "Alice")
	assert.Equal(t, m.Name, "")


	var m1 struct{
		Name string `json:"Name1"`
		NAME1 string
	}

	err = json.Unmarshal(data, &m1)
	assert.Nil(t, err)
	assert.Equal(t, m1.Name, "Alice")
	assert.Equal(t, m1.NAME1, "")
}
```

当JSON字节中的数据不完全符合 Go 的类型的时候将会发生什么呢？

```go
b := []byte(`{"Name":"Bob","Food":"Pickle"}`)
var m Message
err := json.Unmarshal(b, &m)
```

`Unmarshal`仅仅会解码那些在目标变量中能够找到的字段。在上述的代码例子中，只有符合`m`的字段名才会被解码出来，`Food`字段将会被忽略。
这个特性可以让你在处理大的 JSON 对象的时候，仅仅解析出想要的字段。同时，这也意味着目标结构体变量中 __未导出字段__ 的值将不会受到`Unmarshal`的影响

但如果你在处理 JSON 对象的时候不知道其内部结构，这应该如何处理呢？


## 使用 interface{} 解析 JSON 的通用方法

空接口类型(`interface{}`)描述了一个拥有零个方法的类型。每个 Go 类型都至少实现了零个方法所以他们都满足空接口的定义。

空接口类型表现起来就像一个通用的容器类型一样:

```go
var i interface{}
i = "a string"
i = 2011
i = 2.777
```

使用类型断言可以访问底层的类型:

```go
r := i.(float64)
fmt.Println("the circle's area", math.Pi*r*r)
```

如果底层的类型是未知的，可以使用 `Type-Switch` 来检测底层类型:

```go
switch v := i.(type) {
case int:
    fmt.Println("twice i is", v*2)
case float64:
    fmt.Println("the reciprocal of i is", 1/v)
case string:
    h := len(v) / 2
    fmt.Println("i swapped by halves is", v[h:]+v[:h])
default:
    // i isn't one of the types above
}
```

`json` 包将会使用`map[string]interface{}`和`[]interface{}`值来存储任意类型的 JSON 对象和数组。
它将会正确地解析有效的 JSON 数据到 `interface {}` 类型变量中。默认的具体 Go 类型是：

+ `bool`对应 JSON 布尔值
+ `float64` 对应 JSON 数值
+ `string` 对应 JSON 字符串
+ `nil` 对应 JSON 空值

## 解码任意数据

考虑如下的 JSON 数据，他们存储在变量`b`中：

```go
b := []byte(`{"Name":"Wednesday","Age":6,"Parents":["Gomez","Morticia"]}`)
```

不需要知道它的具体结构，我们可以通过`Unmarshal`函数将它解码成一个空接口类型。

```go
var f interface{}
err := json.Unmarshal(b, &f)
```

此时，变量`f`中存储的Go的值应该是一个字典，它的键是字符串，值是存储着值的空接口变量

```go
f = map[string]interface{}{
    "Name": interface{}("Wednesday"),
    "Age":  interface{}(float64(6)),
    "Parents": []interface{}{
        interface{}("Gomez"),
        interface{}("Morticia"),
    },
}
```

我们可以使用类型断言去访问`f`底层的`map[string]interface{}`变量。

```go
m := f.(map[string]interface{})
```

然后我们可以使用`range`语句来迭代这个map，然后使用`Type-Switch`去访问空接口类型变量底层确切类型的值:

```go
for k, v := range m {
    switch vv := v.(type) {
    case string:
        fmt.Println(k, "is string", vv)
    case float64:
        fmt.Println(k, "is float64", vv)
    case []interface{}:
        fmt.Println(k, "is an array:")
        for i, u := range vv {
            switch vv := u.(type) {
            case string:
                fmt.Println(i, "is string", vv)
            case float64:
                fmt.Println(i, "is float64", vv)
            }
        }
    default:
        fmt.Println(k, "is of type I don't know how to handle")
    }
}
```

通过这种方式，可以方便地解析出未知内部结构的 JSON 数据，且仍然能享受到类型安全的好处。

## 引用类型

让我们来定义一个 Go 类型来解码上文中提到的例子:


```go
func TestUnmarshalReferenceTypes(t *testing.T) {
	type FamilyMember struct {
		Name    string
		Age     int
		Parents []string
	}

	var m FamilyMember

	data := []byte(`{"Name":"Wednesday","Age":6,"Parents":["Gomez","Morticia"]}`)
	err := json.Unmarshal(data, &m)

	assert.Nil(t, err)
	assert.Equal(t, m.Name, "Wednesday")
	assert.Equal(t, m.Age, 6)
	assert.Equal(t, m.Parents, []string{"Gomez", "Morticia"})
}
```

`Unmarshal`函数将数据解码到`FamilyMember`类型变量中，一切就像我们预期的那样。但如果我们仔细地观察上述代码，可以看到一个重要的细节。我们使用`var`语句创建了一个`FamilyMember`类型的变量，然后将这个变量的指针提供给了`Unmarshal`函数，但同时，这个变量中的`Parents`字段是`nil`切片。为了去填充`Parents`字段，`Unmarshal`在幕后分配了一个新的切片。这就是典型的`Unmarshal`函数对引用类型的支持（指针，切片和 map ）。

考虑要解码如下的数据结构:

```go
type Foo struct {
    Bar *Bar
}
```

如果在JSON数据中有一个`Bar`字段，`Unmarshal`将会分配一个新的`Bar`变量并将JSON数据填充到其中。如果没有的话，`Bar`将会是一个空指针。

此时一个重要的开发模式就浮现出来了: 如果你有一个应用程序，接收几种不同类型的消息，你可以用如下方式定义一个`receiver`，

```go
type IncomingMessage struct {
    Cmd *Command
    Msg *Message
}
```

发送端可以在顶层JSON对象中填充一个`Cmd`对象或者`Msg`对象，这个完全由发送端自己来决定。`Unmarsha`将会将JSON数据解码到`IncommingMessage`对象中，它仅会为 JSON 对象中检测出来的数据分配数据结构。
接收者如果想要知道应该去处理哪个消息，它可以简单地测试一下`Cmd`或者`Msg`是否为`nil`。

## 流式编码和解码

`json`包提供了`Decoder`和`Encoder`类型以支持读/写 JSON 数据流的常见操作。`NewDecoder`和`NewEncoder`函数包裹了`io.Reader`和`io.Writer`接口类型。

```go
func NewDecoder(r io.Reader) *Decoder
func NewEncoder(w io.Writer) *Encoder
```

下面是一个示例程序，它将会从`stdin`中读取 JSON 数据，将其解析出来后，移除掉其中的冗余字段，只留下`Name`，然后将这部分数据再写入到`stdout`中。

```go
package main

import (
	"encoding/json"
	"log"
	"os"
)

func main() {
	dec := json.NewDecoder(os.Stdin)
	enc := json.NewEncoder(os.Stdout)

	for {
		var v map[string]interface{}
		if err := dec.Decode(&v); err != nil {
			log.Println(err)
			return
		}
		for k := range v {
			if k != "Name" {
				delete(v, k)
			}
		}
		if err := enc.Encode(&v); err != nil {
			log.Println(err)
		}
	}
}
```

由于`io.Reader`和`io.Writer`无处不在，这些`Encoder`和`Decoder`能够在广泛的场景中使用，例如读写 HTTP 连接，Websocket 连接，读写文件等。

## 参考

想要了解更多信息请参考 [json 包的文档](https://golang.org/pkg/encoding/json/)。示例用法请参考 [jsonrpc 包的源代码](https://golang.org/pkg/net/rpc/jsonrpc/) 。

> 作者: Andrew Gerrand

## 补充 json.Marshal

+ 原文地址: https://golang.org/pkg/encoding/json/#Marshal

```go
func Marshal(v interface{}) ([]byte, error)
```

`Marshal`函数返回`v`的 JSON 编码。

`Marshal`将会递归地遍历`v`的值。如果遇到了一个值实现了`Marshaler`接口，且它不是空指针。那么`Marshal`将会调用它的`MarshalJSON`方法来输出 JSON 数据。
如果该值没有`MarshalJSON`方法但是实现了`encoding.TextMarshaler`接口，那么`Marshal`函数将会调用它的`MarshalText`方法，并将结果编码成一个 JSON 字符串。
`nil`指针异常并不是严格必须的，但是在`UnmarshalJSON`的行为中模仿了一个类似的，必要的异常。

如果某个值没有实现上文中描述的接口的话，`Marshal`将会使用下列的类型相关的默认编码。

+ 布尔值将会被编码成 JSON 布尔值
+ 浮点数，整数，Number 值将会被编码成 JSON 数值
+ 字符串值将会被编码成 JSON 字符串，并将其强制转换成一个有效的 UTF-8 字符串，将无效的字节替换成 `Unicode 替换码点`(`U+FFFD �`)。

尖括号`<`和`>`将会被转换成`\u003c`和`\u003e`，防止浏览器将 JSON 输出误解释成 HTML。符号`&`因为同样的原因也会被转换成`\u0026`。
如果想要关闭这个转换，可以创建一个`Encoder`，并调用其`SetEscapeHTML(false)`方法。

+ 关于`SetEscapeHTML`的测试函数如下(此为译者补充):

```go
import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)


func TestMarshalEscapeHTML(t *testing.T) {
	var val = map[string]string{
		"string": "<p>文本&文本</p>",
	}

	var data = bytes.NewBuffer([]byte{})
	var enc = json.NewEncoder(data)

	err := enc.Encode(val)
	assert.Nil(t, err)
	// 注意 JSON 输出最后有个换行，所以 Expected 值中也应该加上换行
	assert.Equal(t, data.Bytes(), []byte(`{"string":"\u003cp\u003e文本\u0026文本\u003c/p\u003e"}
`))

	data.Reset()
	enc.SetEscapeHTML(false)
	err = enc.Encode(val)
	assert.Nil(t, err)

	assert.Equal(t, data.Bytes(), []byte(`{"string":"<p>文本&文本</p>"}
`))
}
```

数组和切片值将会被编码成 JSON 数组，但`[]byte`类型值将会被编码成 base64 编码过的字符串。`nil`的切片值将会被编码成 JSON 空值。

+ 编码`[]byte`数据的示例(译者补充):

```go
func TestMarshalByteArr(t *testing.T) {
	content := []byte("窗前莺并语，窗外燕双飞")
	var val = map[string]interface{} {
		"data": content,
		"b": 'A',
	}

	b64Content := base64.StdEncoding.EncodeToString(content)

	data, err := json.Marshal(val)
	assert.Nil(t, err)
	assert.Equal(t, string(data), fmt.Sprintf(`{"b":65,"data":"%s"}`, b64Content))
}
```

结构体值将会变成编码后的 JSON 对象，每个导出的结构体字段都会变成对象的一个成员，使用字段名作为对象的 key ，除非字段由于以下的某个原因被省略了。

结构体字段的编码可以使用存储在结构体字段标签下的"json"键格式化字符串来自定义。格式化字符串给定了字段的名称，可选的由逗号分隔的编码选项。为了指定选项，不覆盖默认的名字，格式化字符串的名字可能是空的。

"omitempty"选项表示在编码的时候，如果该字段的值为空的话，改字段将会被忽略。`false`，0，空指针，空接口值，还有空数组，切片，map和字符串都会被认为是空值。

还有一个特殊的例子，如果字段标签是"-"，这个字段将总会被忽略。注意如果想指定字段名为"-"的话，可以使用"-,"的形式。

+ 编码标签的示例代码:

```go
func TestMarshalStructFieldTag(t *testing.T) {
	// 注意，首先要让字段名称为导出名称（即以大写字母开头，struct field tag 才会生效）
	var val = struct {
		// 指定 JSON 对象中的 key 为 myName1
		F1 int `json:"myName1"`

		// 指定 JSON 对象中的 key 为 myName2，且为空值时会被忽略
		F2 int `json:"myName2,omitempty"`

		// 未指定 JSON 对象的 key 名称，所以它是 F3,指定编码选项，为空值时将会被忽略
		F3 int `json:",omitempty"`

		// 这个字段将会被忽略
		F4 int `json:"-"`

		// 将字段名指定成 -
		F5 int `json:"-,"`
	}{
		F1: 0,
		F2: 0,
		F3: 3,
		F4: 4,
		F5: 5,
	}

	data, err := json.Marshal(val)
	assert.Nil(t, err)

	assert.Equal(t, string(data), `{"myName1":0,"F3":3,"-":5}`)
}
```

"string"选项可以让该字段在 JSON 对象中是以字符串的形式存储的。这个选项仅会在字符串，浮点数，整数和布尔值类型的字段上生效。
在和 JavaScript 程序通信的时候，有时候会用这种扩展等级的通讯。

+ "string" 编码标签的示例代码:

```go
func TestMarshalStringTag(t *testing.T) {
	// 注意 struct field tag 定义出错的时候(例如字段名称重复)，Marshal 的 err 返回的仍然是空值，但data为`{}`
	var val = struct {
		B1 bool `json:"boolVal1,string"`
		B2 bool `json:"boolVal2"`
	}{
		B1: false,
		B2: false,
	}

	data, err := json.Marshal(val)
	assert.Nil(t, err)

	assert.Equal(t, string(data), `{"boolVal1":"false","boolVal2":false}`)
}
```

```go
Int64String int64 `json:",string"`
```

如果键的名称是非空字符串，且其仅包含Unicode字母，数字和 ASCII 标点符号（引号，反斜杠和逗号除外），那么就会使用这个键的名称。

匿名结构体字段在编码的时候，通常会将其内部的导出字段名放到外部结构体中，这个收到下一段描述的 Go 的可见性规则的约束。
如果一个匿名结构体字段通过 JSON tag 指定了名称，那么在编码的时候将会使用其名称，而不是再当做匿名来处理。
对于空接口类型的匿名结构体字段，将会使用它的类型名作为编码名称，而不是当做匿名处理。

+ 匿名结构体字段的示例代码:

```go
func TestMarshalAnonymousStruct(t *testing.T) {
	type Engine struct {
		Power int
		Code  int
	}

	type Tires struct {
		Number int
	}

	type Bar interface {}

	var val = struct {
		Engine // 匿名结构体字段的名称会被忽略，将其内部的导出字段放到外部结构体中
		Tires `json:"Tires"`  // 通过 JSON tag 指定了名称的匿名结构体字段，在编码时会使用其名称，不再按匿名来处理
		Bar  // 空接口类型的匿名结构体字段，会使用类型名当做其名称，而不是当做匿名结构体字段来处理
	}{
		Engine{1, 2},
		Tires{2},
		233,
	}

	data, err := json.Marshal(val)
	assert.Nil(t, err)

	assert.Equal(t, string(data), `{"Power":1,"Code":2,"Tires":{"Number":2},"Bar":233}`)
}
```

在选择结构体中哪些字段会被编码或者解码的时候，Go 的结构体字段可见性规则会针对 JSON 做一些修改。如果在同一级别有多个字段名，且那个级别是最少嵌套的(因此将会是通常 Go 规则选择的级别),如下的规则将会被应用:

1. 对于这些字段，如果有任意字段拥有了 JSON tag，那么将会考虑 JSON tag 的字段，即使在多个没有 JSON tag 的字段中存在名称冲突。
2. 如果仅有一个字段(拥有 JSON tag 或者不符合第一条规则)，那么这个字段将会被选择。
3. 否则如果有多个字段的话，所有字段都会被忽略，且没有错误发生。

处理匿名结构体字段是 Go 1.1 之后新加的功能，在 Go 1.1 之前，匿名结构体字段将会被忽略。如果要在当前或者更早版本上强制忽略匿名结构体字段，可以使用 JSON tag "-"。

Map 值将会被编码成 JSON 对象。map 值的key 必须是字符串，整数或者实现了 `encoding.TextMarshaler` 类型的值。

Map 值的key将会使用以下规则排序，并用其当做 JSON 对象的key，具体取决于上述描述的字符串值的 UTF-8 强制转换。

> + 字符串值将会直接使用
> + `encoding.TextMarshalers`接口将会在 Marshal 时使用
> + 整数值将会被转换成字符串

指针值将会被编码成其所指向的值，空指针将会被编码成空 JSON 值`null`。

接口值将会被编码成接口中所包含的值，`nil`接口值将会被编码成空 JSON 值`null`。

Channel，复数和函数类型值不能在 JSON 中编码。尝试去编码这些值将会导致`Marshal`函数返回`UnsupportedTypeError`。

JSON 不能代表循环数据结构，且`Marshal`函数也不能处理他们。为`Marshal`函数传递一个循环数据结构将会导致无穷的递归。

+ Marshal 循环结构的示例代码(`Marshal`循环结构将会导致无穷递归，最终导致OOM错误)

```go
func TestMarshalCyclicStruct(t *testing.T) {
	type Engine struct {
		Power int
		Code  int
		Tires struct {
			Number int
			Engine
		}
	}

	var val = new(Engine)

	data, err := json.Marshal(val)
	assert.Nil(t, err)
	assert.Equal(t, data, ``)
	// >>> go test json_example
	// # json_example [json_example.test]
	//panic: runtime error: invalid memory address or nil pointer dereference
	// [signal SIGSEGV: segmentation violation code=0x1 addr=0x70 pc=0x17e3d29]
	//
	// goroutine 1 [running]:
	// cmd/compile/internal/gc.dowidth(0xc0004cf920)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/align.go:175 +0xa9
	// cmd/compile/internal/gc.widstruct(0xc0004cf860, 0xc0004cf860, 0x0, 0x1, 0x3)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/align.go:95 +0xc6
	// cmd/compile/internal/gc.dowidth(0xc0004cf860)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/align.go:340 +0x5e9
	// cmd/compile/internal/gc.widstruct(0xc0004cf920, 0xc0004cf920, 0x0, 0x1, 0xc000448d01)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/align.go:95 +0xc6
	// cmd/compile/internal/gc.dowidth(0xc0004cf920)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/align.go:340 +0x5e9
	// cmd/compile/internal/gc.widstruct(0xc0004cf8c0, 0xc0004cf8c0, 0x0, 0x1, 0xc0004cf8c0)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/align.go:95 +0xc6
	// cmd/compile/internal/gc.dowidth(0xc0004cf8c0)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/align.go:340 +0x5e9
	// cmd/compile/internal/gc.resumecheckwidth()
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/align.go:450 +0x51
	// cmd/compile/internal/gc.typecheckdef(0xc00042fe00)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/typecheck.go:3927 +0x8e3
	// cmd/compile/internal/gc.typecheck1(0xc00042fe00, 0x4, 0x0)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/typecheck.go:376 +0xc387
	// cmd/compile/internal/gc.typecheck(0xc00042fe00, 0x4, 0x0)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/typecheck.go:299 +0x6f2
	// cmd/compile/internal/gc.typecheck1(0xc000437480, 0x1, 0x0)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/typecheck.go:2204 +0x5446
	// cmd/compile/internal/gc.typecheck(0xc000437480, 0x1, 0x0)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/typecheck.go:299 +0x6f2
	// cmd/compile/internal/gc.typecheckslice(0xc000424480, 0x6, 0x8, 0x1)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/typecheck.go:117 +0x50
	// cmd/compile/internal/gc.Main(0x1a73428)
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/internal/gc/main.go:545 +0x29a5
	// main.main()
	// /usr/local/Cellar/go/1.12.4/libexec/src/cmd/compile/main.go:51 +0xad
	// FAIL    json_example [build failed]
}
```

Marshal的示例代码:

```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

func main() {
	type ColorGroup struct {
		ID     int
		Name   string
		Colors []string
	}
	group := ColorGroup{
		ID:     1,
		Name:   "Reds",
		Colors: []string{"Crimson", "Red", "Ruby", "Maroon"},
	}
	b, err := json.Marshal(group)
	if err != nil {
		fmt.Println("error:", err)
	}
	os.Stdout.Write(b)
}
```
