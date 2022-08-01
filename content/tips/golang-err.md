---
title: "pkg/errors 和 go1.13 中 errors 库发展历史"
date: 2022-08-01T10:23:16+08:00
lastmod: 2022-08-01T10:23:16+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

- pkg/errors 的设计思路是，将 err 设计成一个链表，每次需要返回 error 的时候，调用 `errors.Wrap(err, "message %v", value)`，生成一个新的 error，并将新 error 追加到链表尾部。这个 error 可以附加一些额外的信息和栈信息，
- pkg/errors 提供了 `Cause` 接口和 `errors.Cause` 函数，`Cause` 接口返回 err 包裹的接口，`errors.Cause` 函数返回错误链表中链表头的错误
- golang 1.13 中，将 pkg/errors 的设计思路纳入到了标准库中 `errors`
    - go 标准库采用了链表链接 error 的设计思路
    - go 标准库没有使用 pkg/errors 的 `Cause` 接口，而是使用了新接口 `Unwrap`，这样导致无法和旧的使用 `pkg/errors` 的代码兼容
    - go 标准库提供了处理错误的三个函数:
        - `errors.Unwrap(err error) error` 返回 `err` 链表头的 error (即原始 error)
        - `errors.Is(err error, target error) bool` 遍历 `err` 链表中的每一个错误和 `target` 进行比较, 判断 `err` 链表中是否存在和 `target` 相等的错误，如果有，返回 `true`，否则返回 `false`
        - `errors.As(err error, target interface{}) bool`，从 `err` 链表中找到第一个可以赋值给 `target` 的错误，并将其赋值给 `target`，如果赋值成功，返回 `true`，否则返回 `fasle`

## 参考链接

- [The Go standard error APIs The CockroachDB errors library, part 1/](https://dr-knz.net/cockroachdb-errors-std-api.html)
- [go1.17 source code errors/wrap.go](https://github.com/golang/go/blob/dev.boringcrypto.go1.17/src/errors/wrap.go)
