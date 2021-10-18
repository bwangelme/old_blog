---
title: "Java 抛出UnsupportedEncodingException"
date: 2021-10-18T23:55:58+08:00
lastmod: 2021-10-18T23:55:58+08:00
draft: false
tags: [tips, java]
author: "bwangel"
comment: true

---

<!--more-->

---

## Tips

这个异常表示当前系统不支持此编码。大部分系统是支持的，所以没必要抛出这个异常。

当我们调用 `String.getBytes()` 传入一个 `Charset` 参数时，就会调用其重载方法

```java
public byte[] getBytes(Charset charset)
```

这样就不会抛出异常了

## 参考链接

+ [java中String和byte数组转换的小技巧](https://skyao.github.io/2016/01/13/java-string-practice/)
