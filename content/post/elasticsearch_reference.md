---
title: "Elasticsearch reference v6.5.3 笔记"
date: 2018-12-15T20:52:11+08:00
draft: true
tags: [ElasticSearch, ]
---

> Elasticsearch reference v6.5.3 的学习笔记

<!--more-->

## 配置 Elasticsearch

ES 有三个配置文件:

+ `elasticsearch.yml` 用来配置 Elasticsearch
+ `jvm.options` 用来配置 Elasticsearch 的 JVM 设置
+ `log4j2.properties` 用来配置 Elasticsearch 的日志

这三个配置文件存放在 config 目录中，config 目录默认是 `$ES_HOME/config` 或 `/etc/elasticsearch`，也可以通过环境变量 `ES_PATH_CONF` 来指定:

```sh
ES_PATH_CONF=/path/to/my/config ./bin/elasticsearch
```

