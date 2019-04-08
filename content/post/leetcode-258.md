---
title: "Leetcode 258题【数根】"
date: 2019-04-09T00:28:55+08:00
lastmod: 2019-04-09T00:28:55+08:00
draft: false
tags: [ARTS, LeetCode, 翻译]
author: "bwangel"
comment: true
toc: true

---

> + 原文链接: Wikipedia: [Digital root](https://www.wikiwand.com/en/Digital_root)
> + Leetcode 258: https://leetcode.com/problems/add-digits/

<!--more-->

# 前言

在刷Leetcode的时候，接触到了数根的概念([258. Add Digits](https://leetcode.com/problems/add-digits/))。
但只是粗略地浏览了一下相应的条目，知道了计算数根的公式，但对于数根的其他方面还不了解。为了更深入地理解数根，我对数根的 Wikipedia 部分内容进行了翻译，遂有了此文。

# 翻译正文

  单个非负整数的**数根**(也叫做**重复的数字和**)的值是通过一个迭代的[数字求和](https://www.wikiwand.com/en/Digit_sum)的过程来获得的，在每个迭代的过程中使用前一个迭代过程的结果来计算数字和。
这个过程会一直持续，直到求出一个个位数的结果。

例如，65536的数根是7，因为 6 + 5 + 5 + 3 + 6 = 25，2 + 5 = 7

  数根可以通过[模数运算](https://www.wikiwand.com/en/Modular_arithmetic#Congruence_relation)中的[同余运算](https://www.wikiwand.com/en/Congruence_relation)来计算出，而不一定非要通过求出所有数字的和来计算。模数运算的方法在计算非常大的整数的时候能够节省很多时间。

  数根能够用来做一种[校验和](https://www.wikiwand.com/en/Checksum)，去检查求和运算是否被正确地执行。如果执行正确，那么给定数字的和的数根将等于给定数字的数根的和的数根。这个检查仅仅涉及单个数字的计算，却能够在计算中发现许多的错误。

  数根也在西方的[数秘术](https://www.wikiwand.com/en/Numerology)中被使用，但是某些被认为拥有隐匿含义的数字(比如11和22)并没有完全被降低成单个数字。

  一个整数被计算成为数字和的过程中，求和的次数叫做数字的[附加韧性](https://www.wikiwand.com/en/Persistence_of_a_number)；在上面的例子中，65536的附加韧性为2。

## 数根的意义和计算方法

  一个正整数的数根有助于看到比它小的最大的是9的倍数的整数的位置。例如，11的数根是2，它表示11是9(译者注：这里也可以是9的倍数)之后的第二个数字。同样的，2035的数根是1，它意味着2035 - 1是9的倍数。如果一个数字的数根是9的话，那么这个数字就是9的倍数。

  有了这一想法，一个正整数的数根就可以通过[地板除](https://www.wikiwand.com/en/Floor_function)函数$ \lfloor x\rfloor $来定义，如下所示：
  $$ dr(n) = n-9 \left\lfloor\frac{n-1}{9}\right\rfloor $$

## 数根的抽象乘法

  下表展示了数根产生的和十进制系统中相似的乘法表。
  <table style="text-align:center">
    <tbody>
    <tr>
        <th>dr</th>
        <th>1</th>
        <th>2</th>
        <th>3</th>
        <th>4</th>
        <th>5</th>
        <th>6</th>
        <th>7</th>
        <th>8</th>
        <th>9</th>
    </tr>
    <tr>
        <th>1</th>
        <td style="background-color:red">1</td>
        <td style="background-color:orange">2</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:lime">4</td>
        <td style="background-color:green">5</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:aqua">7</td>
        <td style="background-color:purple">8</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    <tr>
        <th>2</th>
        <td style="background-color:orange">2</td>
        <td style="background-color:lime">4</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:purple">8</td>
        <td style="background-color:red">1</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:green">5</td>
        <td style="background-color:aqua">7</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    <tr>
        <th>3</th>
        <td style="background-color:yellow">3</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    <tr>
        <th>4</th>
        <td style="background-color:lime">4</td>
        <td style="background-color:purple">8</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:aqua">7</td>
        <td style="background-color:orange">2</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:red">1</td>
        <td style="background-color:green">5</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    <tr>
        <th>5</th>
        <td style="background-color:green">5</td>
        <td style="background-color:red">1</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:orange">2</td>
        <td style="background-color:aqua">7</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:purple">8</td>
        <td style="background-color:lime">4</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    <tr>
        <th>6</th>
        <td style="background-color:blue">6</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    <tr>
        <th>7</th>
        <td style="background-color:aqua">7</td>
        <td style="background-color:green">5</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:red">1</td>
        <td style="background-color:purple">8</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:lime">4</td>
        <td style="background-color:orange">2</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    <tr>
        <th>8</th>
        <td style="background-color:purple">8</td>
        <td style="background-color:aqua">7</td>
        <td style="background-color:blue">6</td>
        <td style="background-color:green">5</td>
        <td style="background-color:lime">4</td>
        <td style="background-color:yellow">3</td>
        <td style="background-color:orange">2</td>
        <td style="background-color:red">1</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    <tr>
        <th>9</th>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:fuchsia">9</td>
        <td style="background-color:fuchsia">9</td>
    </tr>
    </tbody>
  </table>

  上面这张表展示了[Vedic square](https://www.wikiwand.com/en/Vedic_square)中许多有趣的[模式](https://www.wikiwand.com/en/Patterns)和[对称](https://www.wikiwand.com/en/Symmetry)

## 正式定义

  我们让$S(n)$来表示整数n的所有数字的和，同时让$S(n)$按照下面的方式来构造：

  $$ {\displaystyle S^{1}(n)=S(n), S^{m}(n)=S\left(S^{m-1}(n)\right),\ { m \ge 2.}} $$

  最终序列$ S^1(n),S^2(n),S^3(n),\dotsb $变成了只有一位的整数，让我们用$ {S^{\*}(n)} $(n的数字和)来表示这个只有一位的整数。

### 示例

  让我们来寻找1853的数字和。

  $$ S(1853) = 17 $$
  $$ S(17) = 8 $$

  因此，

  $$ S^2(1853)=8.$$

  最终可以简化成下面这样：

  $$ {\displaystyle S^{\*}(1853)=dr(1853)=8.} $$

### 证明一个常数的存在

  我们如何知道序列 $S^1(n),S^2(n),S^3(n),\dotsb$最终一定会成为一个只有一位的整数呢？下面是证明过程：

  我们让$ n = d_1 + 10d_2 + \dotsb + 10^m-1d_m $，所有的$i，d_i$都是一个大于等于0且小于10的整数。因此，$ S(n) = d_1 + d_2 + \dotsb + d_m$。这里意味着只有在$ d_2, d_3, \dotsb, d_m = 0 $的情况下，$ S(n) \lt n $，在这种情况下$n$是一个一位的整数。因此，重复地使用$S(n)$函数将会使$n$至少减少1，直到$n$变成了一个一位的整数，此时它将会保持不变，成为$ S(d_1) = d_1$

## 同余公式

公式是:

![Picture miss](https://wikimedia.org/api/rest_v1/media/math/render/svg/8aabde69a31053c2a3a769183ef1fea68b7ee49d)

或者

$$
  dr(n) = 1 + ((n - 1) \pmod 9)
$$

要将数根的概念推广到其他进制$b$，只需要简单地将公式中的9改成$b - 1$即可。

(sequence [A010888](https://oeis.org/A010888) in the [OEIS](https://www.wikiwand.com/en/On-Line_Encyclopedia_of_Integer_Sequences))

数根是模9的值，因为$10 \equiv 1 \pmod 9$，因此$10^k \equiv 1^k \equiv 1 \pmod 9$，所以无论位置是什么，模9的值都相等，$ a * 100 \equiv a * 10 \equiv a \pmod 9$，这就是为什么数字可以有意义地加，具体来说，比如一个三位数的整数：

$$
dr(abc) = a * 10^2 + b * 10 + c * 1 \equiv a * 1 + b * 1 + c * 1 \equiv a + b + c \pmod 9
$$
