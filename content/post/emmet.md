---
title: 'Emmet学习笔记'
date: 2016-04-10 10:56:54
tags: [工具]
author: "bwangel"
comment: true
aliases:
  - /2016/04/10/emmet学习笔记
---

__摘要__:

> 1. 参考文章：[前端开发必备！Emmet使用手册](http://www.w3cplus.com/tools/emmet-cheat-sheet.html)
> 2. 记录Emmet的一些语法

<!--more-->

## 语法

__注意__:

> `Emmet`符号前后不要有空格

### 兄弟

`+` 类似于css中的兄弟

### 上级

`^` 设置上一级的节点,`^^`连着向上返回两级

```html
div+div>p>span+em^bq
-------------------
<div></div>
<div>
	<p><span></span><em></em></p>
	<blockquote></blockquote>
</div>
```

可以理解是一层一层地进入`>`，然后在这层建立兄弟`+`，或者返回上级`^`

### 分组

`()`将括号内的元素变成一个代码块

### 乘法

`*`将某个元素重复几次

### 自增符号

`$`，一个`$`代表一位数字，`@`可以设置倒序和起始数字

```html
ul>li.item$$$*5
---------------
<ul>
	<li class="item001"></li>
	<li class="item002"></li>
	<li class="item003"></li>
	<li class="item004"></li>
	<li class="item005"></li>
</ul>
```

```html
h$[title=item$]{Header $}*3
---------------------------
<h1 title="item1">Header 1</h1>
<h2 title="item2">Header 2</h2>
<h3 title="item3">Header 3</h3>
```

```html
ul>li.item$@-3*5
----------------
<ul>
	<li class="item7"></li>
	<li class="item6"></li>
	<li class="item5"></li>
	<li class="item4"></li>
	<li class="item3"></li>
</ul>
<!-- @后的-代表是倒序，3表示从3开始，顺序不可颠倒。 -->
```

### 文本

```html
p>{Click }+a{here}+{ to continue}
---------------------------------
<p>click<a href="">here</a>to continue</p>
```

### 生成隐式标签

不用强记，系统会自动判断生成，准确率却不知道啦。

```html
table>.row>.col
---------------
<table>
	<tr class="row">
		<td class="col"></td>
	</tr>
</table>
```

## 缩写

### h5的首部

```html
!
--------
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body>
  
</body>
</html>
```

### CSS链接

```html
link:css
--------
<link rel="stylesheet" href="style.css">
```
### favicon的链接

```html
link:favicon
------------
<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
```

### 设置字符编码

```html
meta:utf
--------
<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
```

### 表单

```html
form:get
--------
<form action="" method="get"></form>
```

### input

```html
<!-- text,search,radio等type都可以通过类似的方法 -->
input:hidden
------------
<input type="hidden" name="">
```

## 参考资料

[前端开发必备！Emmet使用手册](http://www.w3cplus.com/tools/emmet-cheat-sheet.html)
[Emmet官方文档](http://docs.emmet.io/cheat-sheet/)
