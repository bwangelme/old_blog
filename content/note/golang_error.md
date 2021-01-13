---
title: "《Golang Error》学习笔记"
date: 2020-12-30T22:28:45+08:00
lastmod: 2020-12-30T22:28:45+08:00
draft: false
tags: [笔记, Go]
author: "bwangel"
comment: true
---

> Golang Error 学习笔记

<!--more-->
---

## Panic 的使用场景

1. MySQL 无法链接，redis 可以连接，这时候是可以启动 __读多写少__ 的服务的，不用强制 panic ，因为此时服务还是能够通过缓存来工作，数据无法写入，也不会导致写入脏数据。
2. 配置文件检查失败时，可以执行 Panic
3. 依赖的 RPC 无法启动时，可以先启动，但是服务会大量报错。

对于真正出意外的情况，表示不可恢复的程序错误，例如索引越界，不可回复的环境问题，栈溢出，我们才使用 `panic`，逻辑上的错误，我们应该使用 error 来进行判断。

> You only need to check the error value if you care about the result -- Dave

## Sentinel Error

```go
package os

var (
	ErrInvalid = errInvalid() // "invalid argument"

	ErrPermission = errPermission() // "permission denied"
	ErrExist      = errExist()      // "file already exists"
	ErrNotExist   = errNotExist()   // "file does not exist"
	ErrClosed     = errClosed()     // "file already closed"
	ErrNoDeadline = errNoDeadline() // "file type does not support deadline"
)
```

预定义的特定错误，我们叫做 `Sentinel Error`。

1. Sentinel Error 会成为 API 的公共部分。
2. Sentinel Error 在两个包之间创建了依赖。
3. Sentinel Error 让调用者无法返回更多的信息。

应该尽可能避免 Sentinel Error。

## Struct Error

定义一个结构体实现 error 接口，里面包含了相关的上下文信息

```go
package net

type OpError struct {
    // Op is the operation which caused the error, such as
    // "read" or "write".
    Op string

    // Net is the network type on which this error occurred,
    // such as "tcp" or "udp6".
    Net string

    // For operations involving a remote network connection, like
    // Dial, Read, or Write, Source is the corresponding local
    // network address.
    Source Addr

    // Addr is the network address for which this error occurred.
    // For local operations, like Listen or SetDeadline, Addr is
    // the address of the local endpoint being manipulated.
    // For operations involving a remote network connection, like
    // Dial, Read, or Write, Addr is the remote address of that
    // connection.
    Addr Addr

    // Err is the error that occurred during the operation.
    Err error
}
```

## Opaque Error

对外暴露一个函数来检测错误的信息，而不是直接暴露 Error 类型给外部。

```go
type temporary interface {
    Temporary() bool
}

func IsTemporary(err error) bool {
    te, ok := err.(temporary)
    return ok && te.Temporary()
}
```

## 通过消除错误来优化错误处理代码

+ 原始代码

```go
type Header struct {
	Key, Value string
}

type Status struct {
	Code   int
	Reason string
}

func BadWriteResponse(w io.Writer, st Status, headers []Header, body io.Reader) error {
	_, err := fmt.Fprintf(w, "HTTP/1.1 %d %s\r\n", st.Code, st.Reason)
	if err != nil {
		return err
	}

	for _, h := range headers {
		_, err := fmt.Fprintf(w, "%s: %s\r\n", h.Key, h.Value)
		if err != nil {
			return err
		}
	}

	if _, err := fmt.Fprintf(w, "\r\n"); err != nil {
		return err
	}

	_, err = io.Copy(w, body)
	return err
}
```

+ 优化后的代码

通过将错误状态存储起来，后续的调用，如果有错误状态的话，那就不执行写入。
最后将错误状态返回，错误状态存储的是第一个遇到的错误值，所以这里的代码和原始代码的效果是一样的。

```go
type errWriter struct {
	io.Writer
	err error
}

func (e *errWriter) Write(buf []byte) (int, error) {
	if e.err != nil {
		return 0, e.err
	}

	var n int
	n, e.err = e.Writer.Write(buf)
	return n, nil
}

func GoodWriteResponse(w io.Writer, st Status, headers []Header, body io.Reader) error {
	ew := &errWriter{Writer: w}
	fmt.Fprintf(ew, "HTTP/1.1 %d %s\r\n", st.Code, st.Reason)

	for _, h := range headers {
		fmt.Fprintf(ew, "%s: %s\r\n", h.Key, h.Value)
	}

	fmt.Fprintf(ew, "\r\n")
	io.Copy(ew, body)

	return ew.err
}
```

## Wrap Errors

> You should only handle errors once. Handing an error means inspecting the error value, and making a single decision.

Go 中的错误处理有契约约定，在出现错误的情况下，不能对其他返回值的内容作出任何假设。

如果代码要吞掉 error，那么也要对相应的返回值负责(例如返回降级后的默认值)。

日志记录与错误无关且对调试没有帮助的信息应该被视为噪音，应予以质疑。
记录的原因是因为某些东西失败了，且日志中应该包含了答案。

+ 错误要被日志记录
+ 应用程序通过日志记录错误，返回一个降级的值(保证100%的完整性)，且不再往上抛错误
+ 应用程序单纯地将错误往上抛，不需要做任何处理

### pkg errors 库

```go
func ReadFile(path string) ([]byte, error) {
    f, err := os.Open(path)
    if err != nil {
            return nil, errors.Wrap(err, "open failed")
        }
    defer f.Close()

    buf, err := ioutil.ReadAll(f)
    if err != nil {
            return nil, errors.Wrap(err, "read failed")
        }
    return buf, nil
}

func ReadConfig() ([]byte, error) {
    home := os.Getenv("HOME")
    config, err := ReadFile(filepath.Join(home, ".settings.xml"))
    return config, errors.WithMessage(err, "counld not read config")
}

func main() {
    _, err := ReadConfig()
    if err != nil {
            // Cause 会拿到最底层的错误
            fmt.Printf("original error: %T %v\n", errors.Cause(err), errors.Cause(err))
            // %+v 会打印堆栈信息
            fmt.Printf("stack trace:\n%+v\n", err)
            os.Exit(1)
        }
}
```

+ 输出

```sh
ø> go run pkgerror.go
original error: *os.PathError open /home/xuyundong/.settings.xml: no such file or directory
stack trace:
open /home/xuyundong/.settings.xml: no such file or directory  # 这是原始错误
open failed  # 这是原始错误包装后的信息
# 下面是堆栈信息
main.ReadFile
        /home/xuyundong/Github/Golang/GoDemo/pkgerror.go:15
main.ReadConfig
        /home/xuyundong/Github/Golang/GoDemo/pkgerror.go:28
main.main
        /home/xuyundong/Github/Golang/GoDemo/pkgerror.go:33
runtime.main
        /home/xuyundong/.local/go/src/runtime/proc.go:204
runtime.goexit
        /home/xuyundong/.local/go/src/runtime/asm_amd64.s:1374
# 这是在 wraperror 上又包装的信息
counld not read config
exit status 1
```

### pkg-errors 使用规则

+ 在应用代码中，使用 errors.New 或者 errors.Errorf 返回错误
+ 如果调用其他包内的函数(其他包已经保持了堆栈信息)，通常简单的直接返回
+ 如果和第三方库进行协作(Github 第三方库，公司基础库, 标准库，没有保存堆栈信息)，考虑使用 `errors.Wrap` 保存根 err 和堆栈信息
+ 直接返回错误，而不是在每个错误产生的地方打日志
+ 在程序的顶部，或者工作的 goroutine 顶部(请求入口)，使用 `%+v` 将堆栈信息打印出来
+ 可以使用 `errors.Cause` 获取根 err，将 sentinel error 进行对比

__注意:__

1. `Packages that are reusable across many projects only return root error values` 基础库(重用性高)不应该 wrap error，只有应用库适合 wrap error
2. `if the error is not going to be handled, wrap and return up the call stack` 如果不打算处理错误的话(降级错误)，那么应该 wrap 起来继续往上抛，额外的上下文可以是输入的参数或者失败的 SQL 语句。
3. `Once an error is handled, it is not allowed to be passed up the call stack any longer.` 一旦一个错误被处理过了，那就不应该继续往上抛了，返回一个降级的值就可以了。

## Go 1.13 中新增的错误处理方法

pkg-errors 的作者 [Dave](https://github.com/davecheney) 的意见被 Go 官方采纳，Go 1.13 中新增了一些错误的处理方法 `Unwrap`，`Is` 和 `As`

+ `Is` 类似于 Python 中的 `isubclass`
+ `As` 是检查 error 是否是某个特定类型的 error，如果是的话，那么就返回true，且将参数设置为对应类型的 error
+ `fmt.Errorf` 新增 `%w` 格式字符串，可以将原始错误包裹起来。[相关源代码](https://github.com/bwangelme/go-1.13/blob/6ece83485f77117120693f16ff516c768a31c02a/src/fmt/errors.go#L32)

