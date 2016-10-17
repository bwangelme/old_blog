---
title: 'CentOS 下编译安装 Nginx'
date: 2016-04-10 10:56:54
tags: [Nginx]
---

__摘要__:

> 主要讲述了编译安装 Nginx

<!-- more -->

## 安装 pcre

pcre: 支持正则表达式，地址重写rewrite

```sh
tar -xvf tar_ball/pcre-8.38.tar.gz
cd pcre-8.38/
./configure --prefix=/usr/local/pcre-8.38
make && make install
```

## 编译安装 Nginx

```sh
yum install openssl openssl-devel
groupadd www
useradd -g www www -s /sbin/nologin
tar -xvf tar_ball/nginx-1.9.12.tar.gz
cd nginx-1.9.12/
  
# 注意转义符号后面不要跟空格
[root@localhost nginx-1.9.12]# ./configure \
> --prefix=/usr/local/nginx-1.9.12 \
> --user=www \
> --group=www \
> --with-http_ssl_module \
> --with-http_flv_module \
> --with-http_stub_status_module \
> --with-http_gzip_static_module \
> --with-pcre=/root/source/pcre-8.38/  # 注意要指定pcre源码包位置
   
make
make install
   
# 启动并测试
/usr/local/nginx-1.9.12/sbin/nginx -t  # 测试配置文件
/usr/local/nginx-1.9.12/sbin/nginx  # 启动Nginx
lsof -i:80  # 查看80端口占用情况
elinks -dump http://localhost  # 用elinks测试本机
   
vim /etc/profile
  pathmunge /usr/local/nginx-1.9.12/sbin/ after  # 添加Nginx可执行文件的PATH
```
