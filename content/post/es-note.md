---
title: "ElasticSearch 学习笔记"
date: 2020-03-28T17:16:40+08:00
lastmod: 2020-03-28T17:16:40+08:00
draft: false
tags: [ElasticSearch]
author: "bwangel"
comment: true

---

+ [教程地址](https://www.bilibili.com/video/BV1R4411W7be)

<!--more-->

---

#  分词器

## 分词器概述

分词器包含三部分

1. character filter: 分词之前的预处理，过滤掉HTML标签，特殊符号转换等。
2. tokenizer: 分词
3. token filter: 标准化，大小写，同义词，单复数转换。

## 创建分词器

下面为创建索引时指定类型的设置:

为索引创建了 person 类型，其中包含 user 字段

```
{
  "mappings": {
    "person": {
      "properties": {
        "user": {
          "type": "text",
          "analyzer": "ik_max_word",
          "search_analyzer": "ik_max_word"
        },
      }
    }
  }
}

```

+ search_analyzer 是搜索词的分词器
+ analyzer 是字段文本的分词器


## 中文分词器 ik 的使用示例

```
POST /ik-test/fulltext/1
{
"content": "美国留给伊拉克的是个烂摊子吗？"
}


POST /ik-test/fulltext/2
{
"content": "公安部：各地校车将享有最高路权"
}

POST /ik-test/fulltext/3
{
"content": "中韩渔警冲突调查：韩警平均每天扣1艘中国渔船"
}

POST /ik-test/fulltext/4
{
"content": "中国驻洛杉矶领事馆遭亚裔男子枪击 嫌犯已自首"
}

POST /ik-test/fulltext/_search
{
  "query": {
    "match": {
      "content": "中国"
    }
  },
  "highlight" : {
      "pre_tags" : ["<tag1>", "<tag2>"],
      "post_tags" : ["</tag1>", "</tag2>"],
      "fields" : {
          "content" : {}
      }
  }
}
```

# 索引

## 创建索引

+ 索引名称必须是小写的，不能以下划线开头，不能包括逗号
+ 索引一旦创建，主分片的数量不可改，副分片的数量可改
+ 三个分片，没有备份

```
PUT /lib/
{
  "settings": {
    "index": {
      "number_of_shards": 3,
      "number_of_replicas": 0
    }
  }
}
```

## 查看 /lib 索引的配置

```
GET /lib/_settings
```

## 查看所有索引

```
GET /_cat/indices?v
```

## 查看所有索引的配置

```
GET _all/_settings
```

## 删除索引

```
DELETE /ik-test
```

# 文档

## 创建&全量更新文档

```
PUT /lib/user/1
{
  "first_name": "Jane",
  "last_name": "Smith",
  "age": 30,
  "about": "I like to collect rock albums",
  "interests": ["music"]
}
```

## 创建文档

```
POST /lib/user/
{
  "first_name": "Jane",
  "last_name": "Smith",
  "age": 32,
  "about": "I like to collect rock albums",
  "interests": ["music"]
}
```

## 查询文档 By ID

```
GET /lib/user/1
```

## 只看文档的一部分字段

```
GET /lib/user/1?_source=age,about
```

## 增量修改文档

```
POST /lib/user/1/_update
{
  "doc": {
    "age": 26
  }
}
```

## 删除文档

```
DELETE /lib/user/1
```

# MultiGet 批量获取文档

## 基于索引，类型，字段

```
GET /_mget
{
  "docs": [
    {
      "_index": "lib",
      "_type": "user",
      "_id": 1
    },
    {
      "_index": "lib",
      "_type": "user",
      "_id": 2
    },
    {
      "_index": "lib",
      "_type": "user",
      "_id": 3
    }
    ]
}
```

## MultiGet 只获取一部分字段

```
GET /_mget
{
  "docs": [
    {
      "_index": "lib",
      "_type": "user",
      "_id": 1,
      "_source": ["interests"]
    },
    {
      "_index": "lib",
      "_type": "user",
      "_id": 2,
      "_source": ["age", "interests"]
    }
    ]
}
```

## 指定索引&类型

```
GET /lib/user/_mget
{
  "docs": [
    {"_id": 1},
    {"_id": 2}
  ]
}
```

## 指定ID
 
```
GET /lib/user/_mget
{
  "ids": ["1", "2", "3"]
}
```


# Bulk 批量操作

## 说明

bulk 一次操作的文档建议在 1000 ~ 5000 之间，大小建议是在 5 ~ 15MB，默认不超过100M。

## Bulk 的格式

```
{action: {metadata}}
{requestBody}
```

action 的值|说明
---|---
create|文档不存在时创建(如果文档已经存在，会操作失败，提示文档已经存在)
update|更新文档(要传入 "doc" 参数)
index|创建新文档或者替换已有文档
delete|删除一个文档

metadata的三个字段: `_index`, `_type`, `_id`，分别表示索引，类型，文档ID

## 批量创建

```
POST /lib2/books/_bulk
{"index":{"_id": 1}}
{"title": "Java", "price": 55}
{"index":{"_id": 2}}
{"title": "HTML5", "price": 45}
{"index":{"_id": 3}}
{"title": "PHP", "price": 35}
{"index":{"_id": 4}}
{"title": "Python", "price": 50}
```

## 批量修改/删除

```
POST /lib2/books/_bulk
{"delete": {"_index": "lib2", "_type": "books", "_id": 4}}
{"create": {"_index": "tt", "_type": "ttt", "_id": "100"}}
{"name": "lisi"}
{"index": {"_index": "tt", "_type": "ttt"}}
{"name": "zhaosi"}
{"update": {"_index": "lib2", "_type": "books", "_id": "4"}}
{"doc": {"price": 58}}
```

# 版本控制

## 内部版本控制

elasticseach 采用乐观锁来处理并发问题，每个文档都有版本，更新一次后版本号会加1。
更新的时候可以传递 version 参数(`POST /index/type/id?version={num}`)，如果更新时携带的版本和elasticsearch实际的版本不同，那么程序就会报错: `VersionConflictEngineException`

## 外部版本控制

更新的时候传递参数

```
POST /index/type/id?version={num}&version_type=external
```

只有当 `version` 大于 ElasticSearch 中存储的版本时，更新才会成功，否则就会报错 `VersionConflict`。更新完之后，ElasticSearch 中存储的 version 就会变成我们传递的 version。版本号的范围是 `[1, 2^63-1]`

# Mapping

## 查看索引下的mapping

```
GET /index/type/_mapping
```

## ES 的核心数据类型

字符串类型:

- text: text 类型被用来索引长文本，在建立索引前会将这个文本进行分词，转化为词的组合，建立索引，允许es来检索这些词语。text 类型不能用来排序和聚合。
- keyword: keyword 类型不需要进行分词，可以被用来检索，过滤，排序和聚合，keyword 类型字段只能用本身来进行检索。
- 数字类型: long, integer, short, byte, double, float
- 日期类型: date
- 布尔类型: boolean
- 二进制类型: binary

## 类型动态映射

创建时会根据这些值自动创建字段类型

值|自动创建的字段类型
---|---
true, false | boolean
"abc" | text
119 | long
123.22 | double
2020-11-10 | date

## mapping 参数

https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping-params.html

store: 表示字段是否存储而从_souce 中分离，默认是false
index: 表示某个字段是否被索引，没有被索引的字段是不能被查询的，默认是 true
analyzer: 分词器
ignore_above: 索引的字符串超过了这个数字后，就不会被索引了

## Object 类型

类型组合起来，就是 Object 类型

```
PUT /lib5/person/1
{
    "name": "Tom",
    "age": 25,
    "birthday": "1985-12-12",
    "address": {
        "country": "china",
        "province": "guangdong",
        "city": "shenzhen"
    }
}
```

# 基本查询

## 创建索引

```
PUT /lib3
{
  "settings": {
    "index": {
      "number_of_shards": 3,
      "number_of_replicas": 0
    }
  },
  "mappings": {
    "user": {
        "properties": {
            "name": {"type": "text"},
            "address": {"type": "text"},
            "age": {"type": "integer"},
            "interests": {"type": "text"},
            "birthday": {"type": "date"},
        }
    }
  }
}
```

## 准备数据

```
PUT /lib3/user/1
{
  "name": "zhaoliu",
  "address": "hei long jiang province, tieling city",
  "age": 50,
  "birthday": "1970-12-12",
  "interests": "hejiu,duanlian,lvyou"
}
PUT /lib3/user/2
{
  "name": "zhaoming",
  "address": "beijing city, haidian area, qinghe",
  "age": 20,
  "birthday": "1998-10-12",
  "interests": "hejiu,duanlian,changge"
}
PUT /lib3/user/3
{
  "name": "lisi",
  "address": "beijing city, haidian area, qinghe",
  "age": 23,
  "birthday": "1995-10-12",
  "interests": "hejiu,duanlian,changge"
}
PUT /lib3/user/4
{
  "name": "wangwu",
  "address": "beijing city, haidian area, qinghe",
  "age": 26,
  "birthday": "1992-10-12",
  "interests": "biancheng,tingyinyue,lvyou"
}
PUT /lib3/user/5
{
  "name": "zhangsan",
  "address": "beijing city, chaoyang area",
  "age": 29,
  "birthday": "1989-10-12",
  "interests": "tingyingyue,changge,tiaowu"
}
```

## 按字段简单查询

+ 查询某个类型下的所有文档

```
GET /lib3/user/_search
```

```
GET /lib3/user/_search
{
  "query": {
    "match_all": {}
  }
}
```

在 `/Index/Type/_search` 的搜索结果中，

+ `hits`中的每个结果会有一个`_score`字段(__相关度分数__)，表示匹配程度(这个值最大是1)，默认按照这个字段降序排列。
+ `took`表示查询时间，单位是毫秒
+ `timed_out`表示是否查询超时


```sh
# 查询所有名字中含有`lisi`词的文档
GET /lib3/user/_search?q=name:lisi

# 查询所有兴趣中含有`changge`词的文档，且按照年龄降序排序
GET /lib3/user/_search?q=interests:changge&sort=age:desc
```
 
## Term-level 查询

+ Term-level 查询会去倒排索引中寻找确切的`term`，它并不对搜索词进行分词
+ Term-level 查询对`keyword`类型的字段查询时，会对关键字进行 `normalize` 操作
+ term 查询只支持对单个关键字进行查询
+ terms 支持多个关键字进行查询，且多个关键字之间是或的关系


```sh
# 查询 name 完整匹配 `zhaoliu` 的文档
GET /lib3/user/_search
{
    "query": {
        "term": {"name": "zhaoliu"}
    }
}

# 查询 address 中包含词 `beijing` 或 `haidian` 的文档，在结果中输出版本号，只获得前两个结果。(注意 address 已经进行过分词了)
GET /lib3/user/_search
{
    "from": 0,
    "size": 2,
    "version": true,
    "query": {
        "terms": {
            "address": ["beijing", "haidian"]
        }
    }
}
```

### range 查询

```sh
# 按日期范围查找，注意日期格式一定是8位数字
GET /lib3/user/_search
{
    "query": {
        "range": {
            "birthday": {
                "from": "1990-10-01",
                "to": "2018-05-01",
            }
        }
    }
}

# 查询年龄在 [20,25)
GET /lib3/user/_search
{
    "query": {
        "range": {
            "age": {
                "from": "20",
                "to": "25",
                "include_lower": true,
                "include_upper": false
            }
        }
    }
}
```

### WildCard 查询

+ `*` 代表0或多个字符
+ `?` 表示任意一个字符

```sh
GET /lib4/user/_search
{
  "query": {
    "wildcard": {
      "name": {
        "value": "赵*"
      }
    }
  }
}
```

### fuzzy 查询

+ boost: 查询的权值，默认是1.0
+ min_similarity: 匹配的最小相似度，默认是0.5，对于字符串来说，相似度在0-1，对于数值来说，相似度可以大于1，日期类型相似度取值为 1d, 1m，代表一天，一个月
+ prefix_length: 指明区分词项的共同前缀长度，默认是0
+ max_expansions: 查询中的词项可以扩展的书目，默认可以无限大

```sh
GET /lib3/user/_search
{
    "query": {
        "fuzzy": {
            "name": "zhuliu"
        }
    }
}
GET /lib3/user/_search
{
    "query": {
        "fuzzy": {
            "interests": "change"
        }
    }
}
```

## Full text 查询

Full text 查询通常被用来在全文字段上进行一些查询。他们理解被查询的字段是如何被分词的，而且在执行查询之前，将会应用每个字段的分词器(或 search_analyzer) 到查询字符串上。

### match 查询

+ 对搜索字符串进行分词，分别查询`name`包含 "zhaoliu", "zhaoming" 这两个关键字的文档。

```sh
GET /lib3/user/_search
{
    "query": {
        "match": {
            "name": "zhaoliu zhaoming",
        }
    }
}
```

### multi_match

+ 支持对多个字段查询

```sh
GET /lib3/user/_search
{
    "query": {
        "multi_match": {
            "query": "changge",
            "fields": ["interests", "name"]
        }
    }
}
```

### match_phrase

按照从搜索字符串中分析出来的短语去匹配搜索的文档，按照短语顺序查找

slop 表示结果中的单词移动几次能够匹配短语，这里设置一次就能匹配我们查询的短语。

```sh
GET /lib3/user/_search
{
    "_source": {
      "includes": ["name", "address", "interests"]
    },
    "query": {
        "match_phrase": {
            "interests": {
              "query": "hejiu,changge",
              "slop": 1
            }
        }
    }
}
```

### match_phrase_prefix

+ 查询所有name以zhao开头的文档

```sh
GET /lib3/user/_search
{
    "_source": {
      "includes": ["name"]
    },
    "query": {
        "match_phrase_prefix": {
            "name": {
              "query": "zhao"
            }
        }
    }
}
```

### 控制返回字段

`_source` 控制返回值

```sh
GET /lib3/user/_search
{
    "_source": ["id", "name"],
    "query": {
        "match_phrase": {
            "interests": "duanlian,changge"
        }
    }
}
```

### 排序

`sort` 关键字进行排序

```sh
GET /lib3/user/_search
{
    "sort": {
        "age": {
            "order": "desc"
        }
    }
}
```

## 高亮返回结果

```sh
GET /lib3/user/_search
{
    "query": {
        "match": {
            "name": "zhaoliu zhaoming"
        }
    },
    "highlight": {
        "fields": {
            "name": {}
        }
    }
}
```

## Filter 查询

### 创建数据

```sh
POST /lib6/items/_bulk
{"index": {"_id": 1}}
{"price": 40, "itemID": "ID100123"}
{"index": {"_id": 2}}
{"price": 50, "itemID": "ID100124"}
{"index": {"_id": 3}}
{"price": 25, "itemID": "ID100125"}
{"index": {"_id": 4}}
{"price": 30, "itemID": "ID100126"}
{"index": {"_id": 5}}
{"price": null, "itemID": "ID100127"}
```

### 布尔查询

+ `must` 各个条件必须都被满足
+ `should` 满足一个条件即可
+ `must_not` 必须不能被满足

```
GET /lib6/items/_search
{
  "query": {
    "bool": {
      "should": [
        {"term": {"price": 30}},
        {"bool": {"must": [{"term": {"price": 25}}]}},
        {
          "bool": {
            "must_not": [{"term": {"price": 50}}]
          }
        }
      ]
    }
  }
}
```

### 范围查询 (gt, lt)

```
GET /lib6/items/_search
{
  "query": {
    "bool": {
      "filter": {
        "range": {
          "price": {
            "gte": 25,
            "lte": 50
          }
        }
      }
    }
  }
}
```

### Constant Score

+ 将所有文档分配一个固定的分数，不计算相关度，这样来节省查询时间，适用于只filter的情况

```sh
GET /lib3/user/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "age": 23
        }
      }
    }
  }
}
```

## 聚合查询

仍然使用 Filter 查询中的数据

### Sum

```sh
GET /lib6/items/_search
{
  "aggs": {
    "price_of_sum": {
      "sum": {"field": "price"}
    }
  },
  "size": 0  # 不输出查询到的文档，只输出聚合结果
}
```

### Max

```sh
GET /lib6/items/_search
{
  "aggs": {
    "price_max": {
      "max": {"field": "price"}
    }
  },
  "size": 0
}
```

### Min

```sh
GET /lib6/items/_search
{
  "aggs": {
    "price_min": {
      "min": {"field": "price"}
    }
  },
  "size": 0
}
```

### Avg

```sh
GET /lib6/items/_search
{
  "aggs": {
    "price_avg": {
      "avg": {"field": "price"}
    }
  },
  "size": 0
}
```

### Cardinality

+ 基数，互不相同的值的个数

```sh
GET /lib6/items/_search
{
  "aggs": {
    "price_cardinnality": {
      "cardinality": {"field": "price"}
    }
  },
  "size": 0
}
```

### Terms

+ 根据`price`对文档进行分组，并输出每组文档的个数

```
GET /lib6/items/_search
{
  "aggs": {
    "price_group": {
      "terms": {"field": "price"}
    }
  },
  "size": 0
}
```

### 示例

查询所有有`changge`兴趣的人，并按照年龄分组，并求平均年龄，按照评价年龄降序排序

```sh
GET /lib3/user/_search
{
  "size": 0,
  "query": {
      "term": {
        "interests": "changge"
      }
  },
  "aggs": {
    "age_count": {
      "terms": {
        "field": "age"
        , "order": {
          "age_avg": "desc"
        }
      },
      "aggs": {
        "age_avg": {
          "avg": {
            "field": "age"
          }
        }
      }
    }
  }
}
```

# 集群

## 查看集群的健康状况

```
GET _cat/health
```

+ 绿色表示所有的主分片和副分片都可用
+ 黄色表示所有的主分片可用，但副分片不是全部都可用
+ 红色表示不是所有的主分片都可用

## 水平扩容

水平扩容的极限，每个节点上只放一个分片。
如果在达到极限后想要增加更多的节点，可以增加主分片的备份节点，以此来提高扩容上限。

## ES 的容错机制

处理 master 宕机的方法

0. master节点发生宕机，集群状态变成红色。
1. 重新选取一个节点作为master节点
2. master节点会把丢失的主分片的一个副本提升为主分片，此时所有主分片都是可用的，集群状态变为黄色
3. 将宕机的服务器重启，会拷贝所有主分片的副本到该服务器上，集群的状态变成绿色
