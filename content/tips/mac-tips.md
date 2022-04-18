---
title: "Mac OSX 使用技巧"
date: 2022-04-18T17:06:10+08:00
lastmod: 2022-04-18T17:06:10+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## 修改某类文件的默认打开方式

1. 获取应用的ID: `osascript -e 'id of app "Sublime Text"'`，应用的名称可以在`/Applications`中获取到
2. 安装duti: `brew install duti`
3. 设置某类文件的默认打开方式: `duti -s com.sublimetext.3 .py all`

## 强制退出应用

`Command` + `Option` + `Esc` 打开活动监视器，选择应用强制退出

## 为知笔记

+ 笔记内容的存储位置: `/Users/michaeltsui/.wiznote/bwangel.me@gmail.com/data/notes`，是按照 zip 压缩存储的。解压出来就是 markdown 文件或者HTML文件。
+ `~/.wiznote` 为为知笔记的数据目录
+ 参考链接：[ Mac版的笔记数据在哪个目录？](http://www.wiz.cn/faq/mac/data_dir)

## 时间戳

### 获取时间戳

```
ø> date +%s
1580006193
```

### 获取特定时间的时间戳

```
$ date -j -f %Y-%m-%d 2015-09-28 +%s
1443427891
```

### 时间戳转时间

```
ø> date -r 1443429736
Mon Sep 28 16:42:16 CST 2015
```

## 快捷键

`SPlayer` 会占用 `shift+cmd+l` 全局快捷键

## brew 编译选项

brew 的编译选项需要在 `--` 后加

```
brew install macvim -- --with-override-system-vim --with-lua --with-luajit
```

- https://github.com/skwp/dotfiles/issues/817
- https://github.com/Homebrew/homebrew-core/issues/31510
