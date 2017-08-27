---
title: Gotour学习笔记
date: 2017-08-13 13:54:25
tags: [Golang, ]
---

> __摘要__:

> 1. Gotour的学习笔记

<!--more-->

## 包，变量，和函数

### defer

+ `defer`进行延迟调用的参数会立刻生成，但是在上层函数返回前defer指定的函数都不会被调用

## 方法和接口

定义了0个方法的的接口称为空接口。

空接口可以用来处理未知类型的值，`fmt.Println`可以接受任意数量的空接口参数。


```
package main

import "fmt"

func main() {
	var j, k interface{}
	j, k = 1, " hello, world "
	fmt.Print(j, k, k, j)
}
```

## 错误

+ 当一个自定义类型实现了`error`接口，那么当使用`fmt.Println`函数打印这个类型的时候，就会调用这个类型的`Error`函数，获取这个类型的错误信息。

```
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

## Reader

ROT13解密的程序
```
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

## 并发

### Channel

+ `ch := make(chan int)`表示声明一个管道，表示其接收的数据类型为`int`。
+ 管道可以有缓存，`ch := make(chan int, 20)`表示管道的缓存大小为20个int类型的数据。
  + 管道的缓存满了的时候，发送操作会阻塞
  + 管道的缓存空的时候，接收操作会阻塞
  + 如果整个程序只有一个goroutine，且这个goroutine被阻塞的，那么程序会抛出异常
