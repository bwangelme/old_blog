---
title: "安装 confluent-kafka-python"
date: 2022-03-11T14:34:44+08:00
lastmod: 2022-03-11T14:34:44+08:00
draft: false
tags: [tips, kafka, python]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

+ 安装 librdkafka

```sh
# 安装 vcpkg
> git clone https://github.com/microsoft/vcpkg ~/.local/vcpkg
> ~/.local/vcpkg/bootstrap-vcpkg.sh

# 安装 librdkafka
> ~/.local/vcpkg/vcpkg
> ~/.local/vcpkg/vcpkg install librdkafka
```

+ 设置 include path 和 link path

```sh
export CPATH=~/.local/vcpkg/packages/librdkafka_x64-linux/include
export LIBRARY_PATH=~/.local/vcpkg/packages/librdkafka_x64-linux/lib
```

> GCC uses the following environment variables:
>
> + PATH: For searching the executables and run-time shared libraries (.dll, .so).
> + CPATH: For searching the include-paths for headers. It is searched after paths specified in `-I<dir>` options. `C_INCLUDE_PATH` and `CPLUS_INCLUDE_PATH` can be used to specify C and C++ headers if the particular language was indicated in pre-processing.
> + LIBRARY_PATH: For searching library-paths for link libraries. It is searched after paths specified in `-L<dir>` options.

+ 安装 librdkafka

```
pip install -e ~/work/Douban/code/confluent-kafka-python/
```

## 参考链接

+ https://www3.ntu.edu.sg/home/ehchua/programming/cpp/gcc_make.html#zz-1.9
+ https://github.com/microsoft/vcpkg
