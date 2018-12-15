---
title: "简单聊聊HTML 5中的Web Storage"
date: 2017-05-06 02:34:14
tags: [HTML, Web]
---

> 1. 针对HTML5中的 Web Storage进行了介绍
> 2. 主要介绍了存取API，有效周期，可用性检测等


<!--more-->

## 基础概念

存储对象是在客户端进行简单的键值对存储的对象，它们有一下特点。

1. 存储对象分为 localStorage 和 sessionStorage
2. 存储对象会在页面载入的时候完好地加载进来
3. 它们存储的都是键值对，就像对象一样
4. 存储对象的键和值都是__字符串__，数字的键和值会被自动转义成字符串
5. 可以使用以下的方式来访问 Web Storage

```javascript
localStorage.colorSetting = '#a4509b';
localStorage['colorSetting'] = '#a4509b';
localStorage.setItem('colorSetting', '#a4509b');
```

> 不过建议使用 Web Storage API (setItem, getItem, removeItem, key, length)来访问数据，为了防止使用明文对象作为键值存储时的[陷阱](http://www.2ality.com/2012/01/objects-as-maps.html)。

## 分类

### sessionStorage

sessionStorage 为每个源 (域名) 分别维护了一个存储区域，有效期为整个页面会话。

页面会话有效的情形:

> 1. 页面刷新
> 2. 页面通过前进或者后退回到这个页面
> 3. 页面关闭后通过`command + shift + T`恢复过来

页面会话的失效的情形:

> 1. 页面关闭后重新打开
> 2. 另外打开一个页面，域名和本页面域名相同。

以上有效和失效情形都是我在 Chrome 和 Firefox 中测试的，__文档中并没有详细说明__，如果有不对的地方，还望指正。

### localStorage

 localStorage 也是为每个域名提供了一个类对象的存储区域，不过它是持久存储的，就算浏览器关闭并重新打开，它也不会失效。

### 注意

浏览器为每个源都提供了两个不同的 localStorage 和 sessionStorage 对象，它们是相互独立的。

## localStorage 的可用性检测

如果在一个浏览器中 localStorage 是可用的，那么就会存在一个对象`window.localStorage`来代表本地存储区域。但是由于各种情况，在一个页面中，localStorage 不一定是可用的。例如在 Safari 浏览器的隐身模式下，`window.localStorage`就是一个空对象，而且分配给它的容量是0。

下面这个代码片段就展示了如何检测 localStorage 和 sessionStorage 是否可用？

```javascript
function storageAvailable(type) {
	try {
		var storage = window[type],
			x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	}
	catch(e) {
		return false;
	}
}

if (storageAvailable('localStorage')) {
	// 其中这个'localStorage' 可以替换成 'sessionStorage'
	// Yippee! We can use localStorage awesomeness
} else {
	// Too bad, no localStorage for us
}
```

关于检测 localStorage 的代码的演化历史，可以参考 [A brief history of detecting local storage](https://gist.github.com/paulirish/5558557)。

## Web Storage API

### 增删改查 API

`localStorage.getItem(key)` -- 获取一个键的值
`localStorage.setItem(key, value)` -- 创建或者更新(当这个键已经存在的时候)一个键值对
`localStorage.clear()` -- 清空当前域名下的所有键值对
`localStorage.removeItem(key)` -- 删除当前域名下由key所指定的那个数据项

### 事件监听

```javascript
window.addEventListener('storage', function(e) {
  document.querySelector('.my-key').textContent = e.key;
  document.querySelector('.my-old').textContent = e.oldValue;
  document.querySelector('.my-new').textContent = e.newValue;
  document.querySelector('.my-url').textContent = e.url;
  document.querySelector('.my-storage').textContent = e.storageArea;
});
```

上述代码展示了向 localStorage 添加事件监听器的方法，当 localStorage 改变的时候，会传入一个事件，其中各个字段意义如下:

+ `key`: 被改变的key
+ `oldValue`: 旧的值
+ `newValue`: 新的值
+ `url`: 改变这个key的页面的地址
+ `storageArea`: 被影响到的存储对象

更多内容请参考 [web-storage-code](https://github.com/mdn/dom-examples/tree/master/web-storage) 和 [storage](https://developer.mozilla.org/en-US/docs/Web/Events/storage) 。

## 浏览器兼容性

所有的浏览器对于 localStorage 和 sessionStorage 支持的容量都一直在变化，可以参考 [Web Storage Support Test](http://dev-test.nemikor.com/web-storage/support-test/) 获取详细的信息。

## 其他参考链接

1. [Using the Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)
2. [web-storage](https://mdn.github.io/dom-examples/web-storage/)
