---
title: "ARTS 第七周"
date: 2019-05-09T08:05:55+08:00
lastmod: 2019-05-09T08:05:55+08:00
draft: false
tags: [ARTS, ARTS-LIST]
author: "bwangel"
comment: true

---

2019年第21周|2019/05/20 -- 2019/05/26
---|---
Algorithm|LeetCode 29
Review|Review 《JSON and Go》
Tips|在 Go 中屏蔽类型某个接口的方法
Share|Golang 新手可能会踩的50个坑

<!--more-->

---

## Algorithm

+ [LeetCode 29](/2019/05/13/leetcode-29/)

## Review

+ [Review 《JSON and Go》](/2019/05/21/review-json-and-go/)

## Tips

在 Go 中屏蔽类型某个接口的方法:

```go
package main

import (
	"bytes"
	"fmt"
	"io"
)

type Buffer struct {
	// ReadFrom 和 WriteTo 在两个地方定义了，所以 Buffer 无法正确调用
	bytes.Buffer
	io.ReaderFrom
	io.WriterTo
}

func main() {
	buf := make([]byte, 1024)
	reader := bytes.NewBuffer(buf)
	rb := new(Buffer)

	fmt.Println(rb.ReadFrom(reader))
	//ambiguous selector rb.ReadFrom
}
```

在上述代码中，我们新定义了`Buffer`类型，并在其中包含了`bytes.Buffer`类型, `io.ReaderFrom`和`io.WriterTo`接口。
此时我们就相当于在实现了一种新的`bytes.Buffer`类型，并屏蔽了`io.ReaderFrom`和`io.WriterTo`接口。
如果我们直接就用这两个接口方法，就会出现编译错误`ambiguous selector rb.ReadFrom/rb.WriteTo`。

## Share

+ [Golang 新手可能会踩的50个坑](https://segmentfault.com/a/1190000013739000#articleHeader61)
