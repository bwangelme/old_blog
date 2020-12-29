---
title: "《HTTP/2》学习笔记"
date: 2020-11-29T13:49:57+08:00
lastmod: 2020-11-29T13:49:57+08:00
draft: false
tags: [笔记, ]
author: "bwangel"
comment: true
---

> 学习笔记

<!--more-->
---

## 数据流，消息，帧

数据流: TCP 连接内的双向数据流，可以承载多个消息
消息: 代表一个请求或者响应，包含一个或多个帧
帧: 帧组成消息，HTTP/2通信的最小单位

## http2 示例

https://github.com/bwangelme/HTTP2Demo

## 参考链接

1. [HTTP/2 简介](https://developers.google.com/web/fundamentals/performance/http2?hl=zh-cn)
2. [Go http2 和 h2c](https://colobu.com/2018/09/06/Go-http2-%E5%92%8C-h2c/)

