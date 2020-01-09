---
title: "《Dependency injection in Golang using higher order functions》学习笔记"
date: 2019-03-24T18:37:43+08:00
tags: [ARTS, Go]
author: "bwangel"
comment: true
draft: false
aliases:
  - /2019/03/24/dependency-injection-in-golang-using-higher-order-functions学习笔记/
---

> + 原文地址: https://stein.wtf/posts/2019-03-12/inject/
> + 相关代码: https://github.com/steinfletcher/func-dependency-injection-go

<!--more-->

+ 以下分别为 Go 实现和 Java 实现的对比

```java
interface DB {
  User SelectUser(String id)
}

public class UserService {
  private final DB db;

  public UserService(DB db) {
    this.DB = db;
  }

  public UserProfile getUserProfile(String id) {
    User user = this.DB.SelectUser(id);
    ...
    return UserProfile;
  }
}
```

```go
type DB interface {
  SelectUser(id string) User
}

type getUserProfile func(id string) UserProfile

func newGetUserProfile(db DB) getUserProfile{
  return func (id string) UserProfile {
    user := db.SelectUser(id)
    ...
    return userProfile
  }
}
```

+ 从以上的代码可以看出，Go 的实现中没有刻意去创建对象，而是实现了一个工厂函数，所以整体的实现更精简一些。
