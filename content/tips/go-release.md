---
title: "Golang 的版本发布计划"
date: 2022-05-14T20:58:10+08:00
lastmod: 2022-05-14T20:58:10+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

> Golang 的版本发布计划

---

## Golang 的版本发布计划

在 [Go Release Cycle](https://github.com/golang/go/wiki/Go-Release-Cycle) 中写明了

每半年发布一个版本，每年的02月和08月发布一个 Major 版本。但是 Go 官方好像一直没有严格遵守过这个时间。

在 [Release History](https://go.dev/doc/devel/release) 中可以看到最近的版本发布日期

版本|发布日期|是否还在维护
---|---|---
go1.19|[2022-11-01?](https://groups.google.com/g/golang-dev/c/4xsD_D5oflI)|开发中
go1.18|2022-03-15|是
go1.17|2021-08-16|是
go1.16|2021-02-16|否
go1.15|2020-08-11|否
go1.14|2020-02-25|否
go.1.13|2019-09-03|否
go1.12|2019-02-25|否
go1.11|2018-08-24|否
go1.10|2018-02-16|否
go1.9|2017-08-24|否
go1.8|2017-02-16|否
go1.7|2016-08-15|否
go1.6|2016-02-17|否
go1.5|2015-08-19|否
go1.4|2014-12-10|否
go1.3|2014-06-18|否
go1.2|2013-12-01|否
go1.1|2013-05-13|否
go1|2012-03-28|否

## 每个版本的维护计划

> Each major Go release is supported until there are two newer major releases. For example, Go 1.5 was supported until the Go 1.7 release, and Go 1.6 was supported until the Go 1.8 release. We fix critical problems, including critical security problems, in supported releases as needed by issuing minor revisions (for example, Go 1.6.1, Go 1.6.2, and so on).

每个 Major 版本会维护到下两个 Major 版本 release 的时候，例如 Go1.18 release 的，Go1.16 就放弃维护了。所以每个 Major 版本大致的支持时间是1年

## 参考链接

- [Golang Release dashboard](https://dev.golang.org/release)
- [Go Release Cycle](https://github.com/golang/go/wiki/Go-Release-Cycle)
- [Release History](https://go.dev/doc/devel/release)
- [Go 1.19 release status](https://groups.google.com/g/golang-dev/c/4xsD_D5oflI)
