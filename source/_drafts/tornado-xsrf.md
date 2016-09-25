---
title: "tornado_xsrf的机制"
tags: [tornado, xsrf]
---

## 概览

当用户打开一个页面的时候，如果这个页面中包含表单，那么tornado就会在表单中插入一个 Token 值(同时会设置一个Cookie的Token值，方便Ajax提交)，这个 Token 值会随着POST请求一起提交到服务器，服务器会对这个值进行一定的验证（验证内容包括是否含有，是否正确，是否过期）。通过这样的方式来防止CSRF攻击。

由于JS不能跨域获取Cookie，所以那个设置Cookie的行为是安全的。

## 详细
