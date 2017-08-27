---
title: 'Vue.js关于组件的笔记'
date: 2016-04-10 10:56:54
tags: [Vue.js]
---

__摘要__:

> 学习Vue.js官方教程的笔记


<!--more-->

组件
===

## 定义组件的步骤

1. 利用`extend`定义组件
2. 利用`component`注册组件

1. 利用注册语法糖直接注册组件
```js
Vue.component('my-component'{
      template: '<div>A custom component</div>'
    })
```

## 注意事项

1. 使用函数注册data
    data: function() { return {a:1} }

## 杂项

1. 资源命名约定

vue支持驼峰命名法

## 疑问

1. 动态语法和bind是否相同

`<comp :some-prop="1"></comp>` vs `<comp v-bind:my-message="xff"></comp>`
