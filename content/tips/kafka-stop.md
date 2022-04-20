---
title: "优雅地关闭 Kafka Broker"
date: 2022-04-20T17:42:24+08:00
lastmod: 2022-04-20T17:42:24+08:00
draft: false
tags: [tips, go]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

向进程发送 `TERM` 信号就可以优雅地关闭 Kafka Broker

这是 `bin/kafka-server-stop.sh` 的内容，他的思路就是通过 ps 查找 cmd 中包括 `kafka.Kafka` 的进程，来寻找进程 ID

```sh
SIGNAL=${SIGNAL:-TERM}

OSNAME=$(uname -s)
if [[ "$OSNAME" == "OS/390" ]]; then
    if [ -z $JOBNAME ]; then
        JOBNAME="KAFKSTRT"
    fi
    PIDS=$(ps -A -o pid,jobname,comm | grep -i $JOBNAME | grep java | grep -v grep | awk '{print $1}')
elif [[ "$OSNAME" == "OS400" ]]; then
    PIDS=$(ps -Af | grep -i 'kafka\.Kafka' | grep java | grep -v grep | awk '{print $2}')
else
    PIDS=$(ps ax | grep ' kafka\.Kafka ' | grep java | grep -v grep | awk '{print $1}')
fi

if [ -z "$PIDS" ]; then
  echo "No kafka server to stop"
  exit 1
else
  kill -s $SIGNAL $PIDS
fi
```

但是 Linux 内核有限制，ps 输出的一行内容不能超过页大小 `PAGE_SIZE` (4096)，所以如果 kafka 进程的 cmd 过长，可能会导致 ps + grep 失败。

此时就需要我们手动来找对应的进程，可以通过 `ps ax | grep 'kafka'` 来寻找对应的进程。
