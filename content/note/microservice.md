---
title: "《微服务》学习笔记"
date: 2020-11-23T23:04:35+08:00
lastmod: 2020-11-23T23:04:35+08:00
draft: false
tags: [笔记, ]
author: "bwangel"
comment: true
---

> 学习笔记

<!--more-->
---

## API Gateway 和 BFF

`BFF`: `Backend for frontend` 组装 JSON 数据，不操作数据库，尽量不参与业务逻辑
`API Gateway`: BFF 更上一层，做限流，帐号鉴权(鉴权分为两部分，认证(确定用户id)和鉴定(确定权限)) API Gateway 做认证

鉴权: JWT

## gRPC

gRPC 基于 HTTP/2.0，可以在单条 TCP 连接上复用。

__服务而非对象、消息而非引用__

## HTTTP TLS

### CA 机构是什么

Certificate Authority，是一个公司或者组织，用于为实体(网站，Email 地址，公司或个人等)提供证书。通过证书认证这些实体。

数字证书提供三方面的验证:

1. 身份验证(Authentication): 通过提供认证服务，来验证他发给证书的实体。
2. 加密(Encryption): 提供加密方式，让通信双方在不可信的信道上通信。
3. 完整性验证(Integrity): 可以对文档进行签名，这样可以确保传输过程中文档不会被修改。

#### CA 机构的证书分类

证书类型|单域名|多域名|泛域名|多泛域名
---|---|---|---|---
DV|支持|支持|不支持|不支持
OV|支持|支持|支持|支持
EV|支持|支持|不支持|不支持
举例|www.bwangel.me|`www.bwangel.me`, `www.wbangel1.me`, `www.langel.me`|\*.bwangel.me|\*.bwangel.me, \*.fbangel2.me, \*.wbngel.me

不论是 DV，OV，还是EV证书，他们的加密效果都是一样的，其区别在于实体认证方式:

1. DV(Domain Validation)，面向个体用户，认证方式为向 whois 信息中的邮箱发送邮件进行验证。
2. OV(Origanization Validation)，面向企业用户，证书在 DV 证书验证的基础上，还需要公司授权，CA 通过拨打信息库中的公司电话来确认
3. EV(Extended Validation)，这类证书除了上述两个确认外，还需要公司提供的金融机构的开户许可证，要求十分严格。

OV 和 EV 证书相当昂贵，使用方可以为这些颁发出来的证书买保险，一旦 CA 提供的证书出现问题，一张证书的赔偿金可以达到 100w 刀以上。

### 什么是证书申请文件

证书申请文件(Certificate Signing Request)，简写为 CSR。

数字证书的核心，其实就是非对称加密，这需要开发者自己保护好私钥的安全。

因此开发者在向 CA 申请证书的时候，开发者首先需要生成一个密钥对。开发者自己保管好私钥，然后将公钥和个人信息发送给 CA 机构，CA 机构通过公钥和你的个人信息最终签发数字证书。

而 CSR 文件其实就是一个包含了用户公钥和个人信息的一个数据文件。用户产生出这个 CSR 文件，再把这个 CSR 文件发送给 CA 机构，CA 机构通过 CSR 中的内容来签发出数字证书。

### SAN 是什么

Subject Alternative Name ，多域名证书，一个证书可以保护多个域名。

Chrome 从58开始 只会检查证书的 SAN 字段，不再检查 Common Name 字段的域名，如果没有设置 SAN 字段，Chrome 连接时会报错 `net:ERR_CERT_COMMON_NAME_INVALID`

### Chrome 连接 HTTPS 网站的常见错误

1. `net:ERR_CERT_AUTHORITY_INVALID`: 浏览器不认服务器的证书，一般是因为给服务器签发证书的 CA 机构不在浏览器的信任列表中。
2. `net:ERR_CERT_COMMON_NAME_INVALID`: Common Name 不匹配，即访问的域名和证书中的域名不匹配

### 如何为特定域名生成一张证书

详见: https://github.com/bwangelme/Certs

证书中字段的说明

Field|Meaning|Example
---|---|---
/C=|Country|GB
/ST=|State|London
/L=|Location|London
/O=|Organization|Global Security
/OU=|Organizational Unit|IT Department
/CN=|Common Name|example.com

### 浏览器信任 CA 机构

基于Chrome 86.0.4240.198

Settings -> Privacy and security -> Security -> Manage certificates -> Authorities -> Import 导入 CA 机构的 pem 文件

基于 Firefox 83.0

Preferences -> Privacy & Security -> Certificates -> View Certificates -> Authorities -> Import

## HTTP2

### 数据流，消息，帧

数据流: TCP 连接内的双向数据流，可以承载多个消息
消息: 代表一个请求或者响应，包含一个或多个帧
帧: 帧组成消息，HTTP/2通信的最小单位

### 问题

1. 如何创建一个 HTTP2 服务器 [Nginx, Golang]
2. HTTP2 Push 如何配置
3. 如何创建一个 HTTP2 客户端去连接 HTTP2 服务器
4. HTTP2 服务器如何做到自动降级 HTTP1

## 参考链接

1. [HTTP/2 简介](https://developers.google.com/web/fundamentals/performance/http2?hl=zh-cn)
2. [细说 CA 和证书](https://www.barretlee.com/blog/2016/04/24/detail-about-ca-and-certs/)
3. [什么是CSR文件](https://www.jianshu.com/p/66d84ca65f41)
4. [HowTo: Create CSR using OpenSSL Without Prompt](https://www.shellhacks.com/create-csr-openssl-without-prompt-non-interactive/)
5. [Openssl生成自签名证书，简单步骤](https://ningyu1.github.io/site/post/51-ssl-cert/)
6. [使用OpenSSL生成含有Subject Alternative Name(SAN)的证书](http://blog.ideawand.com/2017/11/22/build-certificate-that-support-Subject-Alternative-Name-SAN/)
