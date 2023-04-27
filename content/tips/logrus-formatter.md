---
title: "Logrus 添加预设字段"
date: 2023-04-27T14:55:12+08:00
lastmod: 2023-04-27T14:55:12+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->
---

## Tips

- logrus 设置自定义 formatter, 添加预设字段


```go
import "github.com/sirupsen/logrus"

var (
	L *logrus.Logger
)

type customLogger struct {
	formatter logrus.Formatter
	domain    string
}

func (l *customLogger) Format(entry *logrus.Entry) ([]byte, error) {
	entry.Data["domain"] = l.domain
	return l.formatter.Format(entry)
}

func main() {
	L = logrus.New()
	L.SetLevel(logrus.InfoLevel)
	L.SetFormatter(&customLogger{
		formatter: &logrus.JSONFormatter{},
		domain:    "custom domain",
	})

    L.Info("this msg")
}
//{"domain":"custom-domain","level":"info","msg":"this msg","time":"2023-04-27T14:59:45+08:00"}
```

## 参考链接

- [logrus#444](https://github.com/sirupsen/logrus/issues/444#issuecomment-831093226)
