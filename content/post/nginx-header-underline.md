---
title: "HTTP 协议中带下划线的 header 说明"
date: 2023-05-09T22:40:29+08:00
lastmod: 2023-05-09T22:40:29+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## HTTP Header 名字的规范

[RFC9110](https://www.rfc-editor.org/rfc/rfc9110.html#fields.registry) 中说，Field Name __应该__ 仅包含字母数字，连字符(`-`), 第一个字符是字母，不区分大小写。

> The requested field name. It MUST conform to the field-name syntax defined in Section 5.1, and it SHOULD be restricted to just letters, digits, and hyphen ('-') characters, with the first character being a letter.

自定义专用的标头之前可以与 `X-` 前缀一起使用，但是这种用法被 IETF 在 2012 年 6 月发布的 [RFC 6648](https://datatracker.ietf.org/doc/html/rfc6648) 明确弃用，原因是其会在非标准字段成为标准时造成不便；

一个标准的 HTTP Header 诞生要经历漫长的过程，而且我们的 Header 中如果有业务前缀的话，基本不会和标准 HTTP Header 冲突，所以很多文章说使用 `X-` 前缀也没有什么问题。

Nginx 的 [ignore_invalid_headers](http://nginx.org/en/docs/http/ngx_http_core_module.html#ignore_invalid_headers) 配置文档中说，Http Header 名称由字母数字，连字符组成，`underscores_in_headers` 开启时可以包含下划线。

当在 Nginx 中设置了 `ignore_invalid_headers on;` 时， Nginx 会自动丢弃名称无效的 Header 。


## 如何让 Nginx 允许 Header 名中带下划线

Nginx 的选项 [underscores_in_headers](http://nginx.org/en/docs/http/ngx_http_core_module.html#underscores_in_headers) 可以允许我们在 HTTP Header 的名字中带上下划线。

> Enables or disables the use of underscores in client request header fields. When the use of underscores is disabled, request header fields whose names contain underscores are marked as invalid and become subject to the ignore_invalid_headers directive.

## 实验

### 使用 nc 启动一个 http server

- /tmp/index.http

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Length: 77
Server: netcat!

<!doctype html>
<html><body><h1>A webpage served by netcat</h1></body></html>
```

- 使用 nc 启动 web server

```
while true;do cat /tmp/index.http| nc -l -p 8090 ;done
```

> __注意__: 不能使用 flask 作为后端
>
> Python 的 wsgi 解析器或 Flask 中会自动丢掉名字中带下划线的 header, 使用 flask 作为后端，就算 Nginx 传了下划线 Header 我们也看不到。
>
> 使用 nc 作为后端 Web Server, 它会原样输出 nginx 传输给它的内容。

我们使用 curl 命令给 Nginx Server 发送带下划线的 Header

```
curl -H 'Some_Header: V1' -s flask.bwangel.me
```

### 默认不会传输带下划线的 Header

```nginx
server {
    listen 80;

    server_name flask.bwangel.me;

    location / {
        proxy_set_header Nginx-Host "flask";
        proxy_pass http://127.0.0.1:8090;
    }
}
```

![image](https://github.com/bwangelme/bwangelme.github.io/assets/11701497/419ee40b-ffc6-4c69-9955-4358d6e8ac36)

图中上半部分是 nc web server 输出的内容，可以看到 `Some_Header` 没有被 Nginx 传输给后端.

### 关闭 ignore_invalid_headers

```nginx
server {
    listen 80;

    server_name flask.bwangel.me;
    ignore_invalid_headers off;

    location / {
        proxy_set_header Nginx-Host "flask";
        proxy_pass http://127.0.0.1:8090;
    }
}
```

关闭了 `ignore_invalid_headers` 之后，无效的 header 也会被 Nginx 传输给后端了

![image](https://github.com/bwangelme/bwangelme.github.io/assets/11701497/95b9f397-c1d7-4782-afd2-9971b45fa402)

上图中，可以看到 `Some_Header` 被 Nginx 传输给了后端

### 开启 underscores_in_headers

```
server {
    listen 80;

    server_name flask.bwangel.me;
    underscores_in_headers on;
    ignore_invalid_headers on;

    location / {
        proxy_set_header Nginx-Host "flask";
        proxy_pass http://127.0.0.1:8090;
    }
}
```

![image](https://github.com/bwangelme/bwangelme.github.io/assets/11701497/2bfeda6c-0c4e-4bc9-a1d7-9eb00a15fa3c)

可以看到，开启了 `underscores_in_headers` 之后，带下划线的 header 就是有效的 header 了，就算开着 `ignore_invalid_headers`, nginx 也会将 `Some_Header` 传输给后端。

## 参考链接

- [Missing (disappearing) HTTP Headers](https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/?highlight=underscores#missing-disappearing-http-headers)
- [ignore_invalid_headers](http://nginx.org/en/docs/http/ngx_http_core_module.html#ignore_invalid_headers)
- [underscores_in_headers](http://nginx.org/en/docs/http/ngx_http_core_module.html#underscores_in_headers)
- [#2251 closed defect (worksforme) "underscores_in_headers on" didn't work](https://trac.nginx.org/nginx/ticket/2251)
- [rfc9110.html](https://www.rfc-editor.org/rfc/rfc9110.html#fields.registry)
- [RFC 6648](https://datatracker.ietf.org/doc/html/rfc6648)
- [MDN HTTP 标头（header）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers)
