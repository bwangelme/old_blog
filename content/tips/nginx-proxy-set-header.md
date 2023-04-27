---
title: "Nginx proxy_set_header 默认会覆盖上一层的设置"
date: 2023-04-27T15:02:39+08:00
lastmod: 2023-04-27T15:02:39+08:00
draft: false
tags: [tips, nginx]
author: "bwangel"
comment: true
---

<!--more-->

---

## 配置代码

- `app.py`

```py
#!/usr/bin/env python

import json

from flask import Flask, request

app = Flask(__name__)

@app.route('/')
def index():
    return json.dumps(dict(request.headers))
```

Start the flask server:

```
FLASK_RUN_PORT="8060" ~/.pyenv/versions/3.11.1/bin/flask run
```

- `/etc/nginx/conf.d/flask.conf`

```nginx
upstream flask {
    server localhost:8060;
}

server {
    listen 80;
    server_name "www.qae.com";

    # 使用 curl 请求后端，后端能收到的 "HH2" "HH3", 无法收到 HH0, HH1 header
    proxy_set_header HH0 "value";
    proxy_set_header HH1 "value";

    location / {
        # 当子块中有 proxy_set_header 指令时，父块中所有的 proxy_set_header 的值都会被丢弃
        # include 不会创建新的块，所以 include 的配置文件中的 proxy_set_header 还能会正常使用的
        proxy_set_header HH2 "value";
        proxy_set_header HHCOMMON "value2";
        include conf.d/flask-component.conf;
        proxy_pass http://flask;
    }
}
```

- `/etc/nginx/conf.d/flask-component.conf`

```nginx
proxy_set_header HH3 "value";
# 同一个块中多次使用 proxy_set_header 定义 HHCOMMON, 他们的值会用 `,` join 到一起
proxy_set_header HHCOMMON "value3";
```

## 问题说明

以上是一个 nginx + flask 后端的配置，`proxy_set_header` 用来向后端传递 header ，我们使用 curl 来请求后端

```shell
ø> curl -s www.qae.com | jq
{
  "Hh3": "value",
  "Hhcommon": "value3,value2",
  "Hh2": "value",
  "Host": "flask",
  "Connection": "close",
  "User-Agent": "curl/7.81.0",
  "Accept": "*/*"
}

```

可以看到后端仅收到 HH2 和 HH3, 但是 HH0 和 HH1 却消失了。这是为什么呢？

我翻了翻 nginx 的文档，里面这样写到

> Allows redefining or appending fields to the request header passed to the proxied server.

> These directives are inherited from the previous configuration level if and __only if there are no__ proxy_set_header directives defined on the current level.

- 如果当前配置块有 `proxy_set_header` 指令的话，就不会再继承父配置块中的 `proxy_set_header` 指令了
    - `HH0`, `HH1` 消失, `HH2`能看到的原因
- include 指令不会创建新的配置块，所以 include 的文件中写的 `proxy_set_header` 会继续生效
    - `HH3` 能正常看到
- 如果一个块中用 `proxy_set_header` 多次设置了同一个 header, 那他们的值会放到一起
    - `HHCOMMON` 的值是 `"value3,value2"`


## 参考链接

- [nginx doc](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header)
