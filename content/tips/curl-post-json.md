---
title: "CURL POST JSON 数据"
date: 2021-10-18T23:57:42+08:00
lastmod: 2021-10-18T23:57:42+08:00
draft: false
tags: [tips, curl]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

```sh
curl -X PUT -H "Content-Type: application/json" -d '@/tmp/demo.json' :9200/demo
ø> cat /tmp/demo.json
{
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1
    }
}
```
