---
title: Letsencrypt通过DNS TXT记录来验证域名有效性
date: 2017-08-13 14:04:06
tags: [Letsencrypt]
---

> __摘要__:

> 1. Letsencrypt 通过dns记录来验证域名

<!--more-->

## 前言

我们在使用`letsencrypt`获取免费的HTTPS证书的时候，`letsencrypt`需要对域名进行验证。默认情况下它的验证方式是这样的：

1. `certbot`程序在web目录的根目录下放置一个文件。
2. `letsencrypt`的服务器通过域名来访问这个文件，来验证你申请的域名是属于你的

但有时候我们想为内网的某台主机设置HTTPS，因为内网的主机无法被`letsencrypt`的服务器访问到，`certbot --nginx certonly`就会出现`Connection refused`的错误。

为了解决上述问题，我们可以更改验证方式，使用DNS记录来验证域名。

## 利用certbot获取证书

运行`sudo certbot --manual --preferred-challenges dns certonly`命令，输入域名并同意记录本机IP后开始获取证书，接着`certbot`就会弹出如下的提示：

```sh
-------------------------------------------------------------------------------
Please deploy a DNS TXT record under the name
_acme-challenge.example.com with the following value:

IMdfdsfsJDqBRyRaaEgPPQlEuvtxJQAgWZTIVbLuzDi8U

Once this is deployed,
-------------------------------------------------------------------------------
Press Enter to Continue
```

此时`certbot`程序就会暂停，等待我们去添加DNS记录。

## 添加DNS的TXT记录

看到上述的提示后，修改域名的DNS记录，添加一条`TXT`记录，主机名为`_acme-challenge`，而其中的内容就是`letsencrypt`生成的随机字符串`IMdfdsfsJDqBRyRaaEgPPQlEuvtxJQAgWZTIVbLuzDi8U`。

## 验证成功

添加好DNS记录后，我们可以通过`dig -t txt _acme-challenge.example.com`来查看域名的内容，域名生效以后，在`certbot`程序中下按下回车键，程序继续运行。`letsencrypt`对DNS记录验证成功，证书就申请成功了。

## 参考文献

1. [Certbot User Guide](https://certbot.eff.org/docs/using.html#manual)
2. `certbot -h certonly`
