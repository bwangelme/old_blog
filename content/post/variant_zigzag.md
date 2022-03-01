---
title: "ZigZag 变长整数编码"
date: 2022-03-01T20:16:48+08:00
lastmod: 2022-03-01T20:16:48+08:00
draft: false
tags: [编码, zigzag]
author: "bwangel"
comment: true

---

> 变长整数编码的实现
<!--more-->

---

## 介绍

Variants + Zigzag 是在 protobuf, thrift, kafka 中使用的一种数字编码方式，它将整数序列化成字节，整数的绝对值越小，其占用的字节数越少。

## Variants 变长整数编码

Variants 是使用一个或多个字节来序列化整数的一种方法，数值对应的无符号数越小，其占用的字节数越少。

在 Variants 编码中，

1. 每个字节的最高位保留，成为 msb 位(most significant bit)，它用于表示其后的字节是否和当前字节一起来表示一个整数。
2. Variants 使用小端字节序的布局方式，整数的低位放在字节流的高位。

例如整数 300，它的二进制形式是

```
[0000 0001] [0010 1100]
```

其中有效的数据只有前 9 位，即

```
[1] [0010 1100]
```

加上 msb 位，因为字节序后续还需要反转字节流，我们将 msb 位先记成 X

+ __注意:__ 第一个字节只有前两位有效的，其他数据位我们都补0

```
[X000 0010] [X010 1100]
```

将其按照小端字节序排列，得到

```
[X010 1100] [X000 0010]
```

再根据当前字节是否是最后一个，填充上 msb 位，得到 300 的 Variants 编码是

```
[1010 1100] [0000 0010]
```

## Variants 编码负数遇到的问题

使用 Variants 对负数进行编码的时候，由于负数使用补码进行编码，越小的负数其对应的无符号数越大，Variants 编码后的字节数越多。

例如对于一个 64 位整数，-1 的补码用八个字节表示 `[1111 1111] [1111 1111] [1111 1111] [1111 1111] [1111 1111] [1111 1111] [1111 1111] [1111 1111]`，它经过 Variants 编码后的长度是10个字节。

由于小负数是很常见的数字，这样就容易造成浪费。

为了让编码更加高效，Variants 引入了 ZigZag 的编码方式。

## ZigZag 编码

ZigZag 编码以一种锯齿形(zig-zags，或者也可以叫之字型)的方式来回穿梭正负整数，将带符号的整数映射为无符号证书，这样可以使绝对值较小的负数仍然享有较小的 Variants 编码值。

下表是部分数字的 ZigZag 编码结果，看了这个表格后，你应该明白它的名字为什么要叫 ZigZag 了吧 :)

原值|编码后的值
---|---
0|0
-1|1
1|2
-2|3
2|4
-3|5
3|6
-4|7
4|8
-5|9
5|10
-6|11
6|12
-7|13
7|14
-8|15
8|16
-9|17
9|18
-10|19
10|20
2147483647|4294967294
-2147483648|4294967295

## ZigZag 的实现方式

编码方式: `(n << 1) ^ (n >> (size(n) - 1))`

解码方式: `(n >>> 1) ^ -(value & 1)`

+ `size(n)` 表示的是整数 n 的位数
+ `n >>> 1` 表示将数字 n 无符号右移一位，最高位补0

## 实现代码

下面是对 32 位整数进行编码的代码

```java
package org.example.zigzag;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public class App {
    private static final byte[] HEX_ARRAY = "0123456789ABCDEF".getBytes(StandardCharsets.UTF_8);

    public static void main(String[] args) {
        ByteBuffer buffer = ByteBuffer.allocate(10);

        App a = new App();
        a.writeVariant(-23, buffer);
        System.out.println("variant bytes is `" + bytesToHex(buffer.array()) + "`");

        int b = a.readVariant(buffer);
        System.out.println("decode value is " + b);
    }

    public int readVariant(ByteBuffer buffer) throws RuntimeException {
        int value = 0;
        int i = 0;
        int b;

        // 此处重置 bytebuffer 的 pos，否则不会从第0个开始读起
        buffer.rewind();
        // 从字节流中取出一个字节，如果第8位是0的话，表示读取整数结束
        while (((b = buffer.get()) & 0x80) != 0) {
            // 取出低7位，并左移 7 位放到 value 中
            b = (b & 0x7f) << i;
            System.out.println(b);
            value |= b;
            i += 7;
            // 32 位整数最大编码结果是5个字节，在循环中最多只能读4次
            if (i > 28) {
                throw new RuntimeException("illegal bytes");
            }
        }

        // 最后一次在循环外读取，且由于最后一位最高位是0,也不需要进行去除最高位的操作
        value |= b << i;
        return (value >>> 1) ^ -(value & 1);
    }

    public void writeVariant(int value, ByteBuffer buffer) {

        // 将整数 value 进行 zigzag 编码, int 是 32 位，所以这里直接写死了 31
        int v = (value << 1) ^ (value >> 31);

        // 判断 v 的低7位是否是0
        while ((v & 0xffffff80) != 0L) {
            // 取出 v 的低7位，并在最高位上加上1
            byte b = (byte) ((v & 0x7f) | 0x80);
            // 放到 buffer 中
            // 因为是先放整数的低字节位，所以这里实现了小端字节序
            buffer.put(b);
            // 将 v 无符号右移 7 位，最高位补 0
            v >>>= 7;
        }

        // 最后取出的 7 位最高位一定是0,且它位于 variant 编码的最后一个字节，需要设置成0
        buffer.put((byte) v);
    }

    public static String bytesToHex(byte[] bytes) {
        byte[] hexChars = new byte[bytes.length * 3];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 3] = HEX_ARRAY[v >>> 4];
            hexChars[j * 3 + 1] = HEX_ARRAY[v & 0x0F];
            hexChars[j * 3 + 2] = ' ';
        }
        return new String(hexChars, StandardCharsets.UTF_8);
    }

}
```

+ Output

```
variant bytes is `2D 00 00 00 00 00 00 00 00 00 `
decode value is -23
```
