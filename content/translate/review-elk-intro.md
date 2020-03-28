---
title: "Review 《Getting started with the Elastic Stackedit》"
date: 2020-03-29T00:10:08+08:00
lastmod: 2020-03-29T00:10:08+08:00
draft: false
tags: [ElasticSearch]
author: "bwangel"
comment: true

---

> + 原文地址: https://www.elastic.co/guide/en/elastic-stack-get-started/6.8/get-started-elastic-stack.html#get-started-elastic-stack

<!--more-->
---

这篇文章讲的就是通过 `ElasticSeach`, `Kibana`, `MetricBeat`, `LogStash` 搭建一个简单的监控系统。

组件|说明
---|---
ElasticSearch|存储指标
Kibana|可视化
MetricBeat|收集系统指标，并发送到 ES 或 LogStash 中
LogStash|对指标进行一些转换过滤操作后再发送

## MetricBeat

### 无法创建 Kibana Dashboard 的错误

`metricbeat setup -e` 命令会在 Kibana 中创建 Dashboard，但是我通过 brew 安装 MetricBeat 后，运行此命令会报错: 

```
Skipping loading dashboards, No directory /usr/local/Cellar/metricbeat/6.8.7/kibana/6
```

这个目录不知道为什么改名字了，改成了 `/usr/local/Cellar/metricbeat/6.8.7/kibana.generated/6/`

做一个 `kibana` 到 `kibana-generated` 的软链接，就可以正常初始化了。

### 修改输出源

`/usr/local/etc/metricbeat/metricbeat.yml` 配置文件中的 `output.elasticsearch`和 `output.logstash` 定义了输出源。

## LogStash

Logstash is a powerfull tool that integrates with a wid variety of deployments. It offers a large selection of plugins to help you parse, enrich, transform and buffer data from a variety of source.

启动 LogStash: `logstash -f custom-config.conf`

我们可以写这样一个简单的配置文件:

```sh
# 监听 5044 端口，读取 beats 发送的数据
input {
  beats {
    port => 5044
  }
}

# 将数据写入到 es 中，索引的名称为 /metricbeat-6.8.7-2020.03.28
output {
  elasticsearch {
    hosts => ["http://localhost:9200"]
    manage_template => false
    index => "%{[@metadata][beat]}-%{[@metadata][version]}-%{+YYYY.MM.dd}"
    #user => "elastic"
    #password => "changeme"
  }
}
```

上述文件 LogStash 只是做了一个转发，并没有做任何的处理。

我们可以在`input`和`output`之间加一个`filter`部分，处理指标，

```sh
input {...}

# 判断如果存在 system.process.cmdline 字段，那么将 cmdline 字段变成 cmdline_path 字段
# 且只输出路径信息，不再输出参数
# 同时移除 system.process.cmdline 字段
filter {
  if [system][process] {
    if [system][process][cmdline] {
      grok {
        match => {
          "[system][process][cmdline]" => "^%{PATH:[system][process][cmdline_path]}"
        }
        remove_field => "[system][process][cmdline]"
      }
    }
  }
}

output {...}
```

在 ES 中可以看到更改后的结果

```sh
GET /metricbeat-6.8.7-2020.03.28/_search
{
  "from": 0,
  "size": 10,
  "sort": {
    "@timestamp": {
      "order": "desc"
    }
  }
}

## 输出结果
{
    ...
  "hits" : {
      ...
    "hits" : [
      {
          ...
        "_source" : {
          "@version" : "1",
          "@timestamp" : "2020-03-28T17:04:30.182Z",
          "system" : {
            "process" : {
              "pid" : 5288,
              "cpu" : {
                "start_time" : "2020-03-26T16:43:50.832Z",
                "total" : {
                  "value" : 52246,
                  "pct" : 0.0223,
                  "norm" : {
                    "pct" : 0.0019
                  }
                }
              },
              # 这里输出了 cmdline_path
              "cmdline_path" : "/Applications/Visual",
              "ppid" : 5278,
              "name" : "Code Helper (GP",
              "memory" : {
                "share" : 0,
                "rss" : {
                  "bytes" : 80519168,
                  "pct" : 0.0023
                },
                "size" : 6317944832
              },
              "state" : "running",
              "pgid" : 5278,
              "username" : "michaeltsui"
            }
          }
        },
      }
    ]
  }
}
```