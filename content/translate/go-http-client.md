---
title: "Review 《Don’t use Go’s default HTTP client (in production)》"
date: 2021-12-31T11:01:25+08:00
lastmod: 2021-12-31T11:01:25+08:00
draft: false
tags: [翻译, Go, HTTP]
author: "bwangel"
comment: true

---

> + 原文地址: https://medium.com/@nate510/don-t-use-go-s-default-http-client-4804cb19f779

<!--more-->
---

编写通过HTTP与服务对话的Go程序很容易，也很有趣。
我已经写了无数的API客户端包，我发现这是一项令人愉快的任务。然而，我遇到了一个很容易落入的陷阱，它可以让你的程序很快崩溃：__默认的HTTP客户端__。

本文内容的一句话概括:

> Go的http包默认没有指定请求超时，允许服务劫持你的goroutine。在连接外部服务时，一定要指定一个自定义的http.Client。

## 问题示例

假设你想通过漂亮的 JSON REST API与 `spacely-sprockets.com` 对话，并查看可用链轮的列表。在Go中，你可以做这样的事情。


