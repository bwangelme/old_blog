---
title: 简单聊聊Vim中的自定义快捷键
date: 2017-03-26 17:19:11
tags: [Vim]
---

__摘要__:

> 1. Vim中几个`Map`命令的区别
> 2. 分享几个自定义的快捷键


<!--more-->
## 前言

平常在Vim中自定义快捷键，使用的都是`map`命令，但最近发现自定义快捷键命令还有好多，如`noremap`， `nmap`，`vmap`等等。所以就想写一篇关于Vim中自定义快捷键的文章，来总结一些Vim中的自定义快捷键的命令和他们的命名方式。

## 与自定义快捷键相关的四个系列命令

### map系列命令

这个命令的声明如下: `:map {lhs} {rhs}`。这个命令就是将`{lhs}`代表的按键映射成`{rhs}`所代表的按键。例如`map L $`就是将`$`键映射成`L`。此外需要注意的是`map`命令定义的快捷键是可以嵌套的，例如下面这样的命令:

```vim
map L $
map Y yL
```

就是将`Y`按键映射成了`y$`按键。

### noremap系列命令

这个命令的声明如下: `:no[remap]  {lhs} {rhs}`，顾名思义，就是不可以重新映射的命令。这个命令和`map`命令类似，不过它所定义的命令不可以被重新映射，例如下面的例子:

```vim
map L $
map Y yL
```

此时我们映射的`Y`按键的效果就不会和`y$`按键的效果相同了。此命令的主要作用是为了防止按键重新定义时出现冲突，所以一般推荐使用此命令来映射快捷键。

### unmap系列命令

`unmap`，顾名思义，就是用来取消**所在模式**下快捷键的定义(关于**模式**我们下一小结会将)。

### mapclear系命令

`mapclear`，清除所在模式下定义的所有快捷键。

## 自定义快捷键相关的六种模式

在Vim中，共有六种模式，不同的定义快捷键的命令生效的模式不同，这六种模式如下：

+ **N**ormal Mode: 即Vim的普通模式，我们打开Vim后进入的第一个模式即此模式。
+ **V**isual Mode: 即Vim的`Visual`模式，我们在选中了一定的文本之后(通过`v`或者`V`命令)即进入此模式。
+ **S**elect Mode: 这种模式和`Visual`模式相似，不过输入的文本都会替换选中的文本。在普通模式下，通过鼠标选中或者使用`gH`命令都可以进入此模式。
+ **O**perator-pending Mode: 当我们输入一个[操作符](http://vimdoc.sourceforge.net/htmldoc/motion.html#operator)后(例如，`d`，`y`，`c`等等)，就会进入此模式。
+ **I**nsert Mode: 即Vim的插入模式，普通模式下我们输入`i`(或者`s`,`a`等等)就会进入此模式。
+ **C**ommand-line Mode: 命令行模式，我们在普通模式下输入`:`或者`/`等就会进入此模式。

### 命令模式对应表

下表表示了每个自定义快捷键的命令和其对应的生效模式，需要注意的是`Lang-Arg`并不是一种新的模式，而是表示了这样一种情况。当我们键入一个字符的时候，它是缓冲区中文本的一部分，而不是一个Vim命令。上面这句话我翻译自Vim文档，我感觉自己也没有很是搞懂，所以还是把原文贴出了吧(参见`:help language-mapping`)：

> Generally: Whenever a character is to be typed that is part of the text in the
buffer, not a Vim command character.  "Lang-Arg" isn't really another mode,
it's just used here for this situation.

| `map`系命令|`noremap`系命令|`unmap`系命令|`mapclear`系命令|生效模式
| ----|----|----|----|----|----
| :map |:noremap |:unmap |:mapc[lear] |Normal, Visual, Select, Operator-pending
| :nmap|:nnoremap|:nunmap|:nmapc[lear]|Normal
| :vmap|:vnoremap|:vunmap|:vmapc[lear]|Visual and Select
| :smap|:snoremap|:sunmap|:smapc[lear]|Select
| :xmap|:xnoremap|:xunmap|:xmapc[lear]|Visual
| :omap|:onoremap|:ounmap|:omapc[lear]|Operator-pending
| :map!|:noremap!|:unmap!|:mapc[lear]!|Insert and Command-line
| :imap|:inoremap|:iunmap|:imapc[lear]|Insert
| :lmap|:lnoremap|:lunmap|:lmapc[lear]|Insert, Command-line, Lang-Arg
| :cmap|:cnoremap|:cunmap|:cmapc[lear]|Command-line

通过观察上面这些命令的前缀，我们可以发现，命令前缀和生效的模式有关。例如，`v`表示`Visual和Select`模式，`s`表示`Select`模式，`c`表示`Command-line`模式，等等。

## 分享两个我自己定义的快捷键

Ok，扯了那么多和自定义快捷键相关的东西，接下来我和大家分享几个我自定义的快捷键吧，感觉用起来很爽，希望对大家有帮助。

### ~~Tab键映射成搜索~~

~~搜索无疑是一个使用频率非常高的快捷键，但在原始的Vim中使用的却是`/`或者`?`，当要使用搜索功能的时候，我的右手要离开HomeRow(就是**爱上对方过后就哭了**那一行)，然后使用中指或者食指去按`/`，感觉虽然也可以用右手小拇指去按`/`，但实在是太费劲。~~

~~所以我就把`/`映射成了`<Tab>`，`<Tab>`键在普通模式下基本用不到，同时左手小拇指又非常容易按到，感觉一下子方便了许多。映射命令如下：~~

```vim
" 映射/为<Tab>
noremap <Tab> /
```

~~大家可以看到，我这里使用的是`noremap`映射的(防止以后再来映射和`<Tab>`键相关的组合键时出现错误)，同时，这个命令生效的模式是`Normal`，`Visual`，`Select`，`Operator-pending`。这样我不仅可以在普通模式下搜索，也可以在选择文本(Visual)，删除文本(通过`d`命令)时进行搜索。~~

后来我才发现，`<Tab>`和`<C-i>`的keycode是一样的，[无法分别映射](http://stackoverflow.com/questions/14641942/how-to-unmap-tab-and-do-not-make-ctrl-i-invalid-in-vim)，所以将`<Tab>`映射为搜索按键会影响到`<C-i>`的功能，所以还是先删除掉吧。

### 快速定位当前文件

这条映射是我在[《VIM 实用技巧》](https://book.douban.com/subject/25869486/)中看到的，感觉很好用，特意来分享给大家。此映射命令如下：

```vim
" 将%:h映射为%%，%:h的功能是显示当前缓冲区文件的相对路径
cnoremap <expr> %% getcmdtype() == ':' ? expand('%:h').'/' : '%%'
```

这条命令比较复杂，首先`cnoremap`表示在命令行模式下进行映射，`<expr>`表示将映射命令的右边的参数当做一个表达式来对待(详见: `:help :map-<expr>`)。

`%%`就是我们定义的快捷键，`getcmdtype() == ':' ? expand('%:h').'/' : '%%'`就是我们要执行的表达式，此命令的含义就是每当我们在命令行模式下输入`%%`，就会得到表达式`getcmdtype() == ':' ? expand('%:h').'/' : '%%'`运算的结果。

接着我们再来分析一下这个表达式，`getcmdtype() == ':' ? expand('%:h').'/' : '%%'`。

首先来看调用的两个函数，`getcmdtype`表示获取当前命令行模式的类型，`:`表示是Ex-Mode，就是在普通模式下输入`:`进入的模式，此外其他的返回结果参见`:help getcmdtype()`。
`expand()`函数表示对通配符进行扩展，其中传入的参数为`%`和`:h`，`%`表示当前缓冲区文件，`:h`相当于一个函数，传入一个文件参数，返回文件所在的文件夹(相当于Python中的`os.path.dirname()`)，我们可以看到`expand('%:h')`函数的功能就是返回当前缓冲区文件所在的路径。

整体来看这个表达式的话，就是一个三元运算符，如果当前模式是Ex-Mode的话，返回当前缓冲区文件所在的文件夹，否则的话返回`%%`。

## 有待考证和完善之处

写文章之前，我觉得我应该已经了解了Vim的`map`相关的命令，但是写完以后，发现还是有很多疑问，写到最后发现还有新东西自己没有涉及，这里先记录下来，以待以后完善：

1. `map`的递归定义的用法。我看到`:help :map`文档中说，**This allows for nested and recursive use of mappings.**也就是说`map`可以进行递归定义的，只是不知道怎么用，递归出口在哪？
2. `map`命令还有一个`map-<expr>`的用法，这次还没有将，以后加上。
3. 关于文档中`Lang-arg`还不是很懂。
