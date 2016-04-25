---
title: '15. LNMP环境搭建.md'
date: 2016-04-10 10:56:54
tags: MySQL
---

__摘要__: 这是一篇关于MySQL的文章，主要介绍15. LNMP环境搭建
<!-- more -->
LNMP环境搭建
============

## 1. 安装Nginx

1. pcre: 支持正则表达式，地址重写rewrite

```sh
tar -xvf tar_ball/pcre-8.38.tar.gz
cd pcre-8.38/
./configure --prefix=/usr/local/pcre-8.38
make && make install
```

2. Nginx:

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

## 2. 安装PHP

```sh
yum install libjpeg libjpeg-devel libpng libpng-devel freetype freetype-devel libxml2 libxml2-devel libcurl libcurl-devel libxslt-devel
tar -xvf tar_ball/php-7.0.4.tar.bz2
cd php-7.0.4/
./configure
  --prefix=/usr/local/php-7.0.4.tar.bz2
  --with-curl.tar.bz2
  --with-freetype-dir.tar.bz2
  --with-gd.tar.bz2
  --with-gettext.tar.bz2
  --with-iconv-dir.tar.bz2
  --with-jpeg-dir.tar.bz2
  --with-kerberos.tar.bz2
  --with-libdir=lib64.tar.bz2
  --with-libxml-dir.tar.bz2
  --with-mysql.tar.bz2
  --with-mysqli.tar.bz2
  --with-openssl.tar.bz2
  --with-pcre-regex.tar.bz2
  --with-pdo-mysql.tar.bz2
  --with-pdo-sqlite.tar.bz2
  --with-pear.tar.bz2
  --with-png-dir.tar.bz2
  --with-xmlrpc.tar.bz2
  --with-xsl.tar.bz2
  --with-zlib.tar.bz2
  --enable-fpm.tar.bz2
  --enable-bcmath.tar.bz2
  --enable-libxml.tar.bz2
  --enable-inline-optimization.tar.bz2
  --enable-gd-native-ttf.tar.bz2
  --enable-mbregex.tar.bz2
  --enable-mbstring.tar.bz2
  --enable-opcache.tar.bz2
  --enable-pcntl.tar.bz2
  --enable-shmop.tar.bz2
  --enable-soap.tar.bz2
  --enable-sockets.tar.bz2
  --enable-sysvsem.tar.bz2
  --enable-xml.tar.bz2
  --enable-zip
make && make install
```

+ 修改配置文件

```sh
cp /usr/local/php-7.0.4/etc/php-fpm.conf.default /usr/local/php-7.0.4/etc/php-fpm.conf # php-fpm配置文件
cp /usr/local/php-7.0.4/etc/php-fpm.d/www.conf.default /usr/local/php-7.0.4/etc/php-fpm.d/www.conf # php-fpm pool配置文件
cp php.ini-production /usr/local/php-7.0.4/lib/php.ini # php配置文件
```


```
php-fpm.conf
pid = run/php-fpm.pid  # pid文件
error_log = log/php-fpm.log  # 错误日志记录位置
syslog.facility = daemon  # 日志记录工具
log_level = notice  # 日志记录等级
```

+ 添加Init启动


```sh
cd php源码目录
cp sapi/fpm/init.d.php-fpm /etc/rc.d/init.d/php-fpm # init 启动脚本
```

## 3. 整合Nginx和PHP

去掉Nginx配置文件中php的注释

这里配置失败了，以后再来解决
