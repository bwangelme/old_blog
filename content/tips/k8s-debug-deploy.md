---
title: "K8s 查询 Deployment 的错误"
date: 2022-09-15T10:31:16+08:00
lastmod: 2022-09-15T10:31:16+08:00
draft: false
tags: [tips, k8s]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

有时 Deployment 部署失败，我们通过 `k descript deploy xxx` 只能看到一个错误信息

```
Conditions:
  Type             Status  Reason
  ----             ------  ------
  ReplicaFailure   True    FailedCreate
Events:            <none>
```

此时我们需要找到 deploy 对应的 replicaset, describe replicaset 就能够看到对应的错误了

```
$ k describe replicaset <replica-set-name>

Type     Reason            Age                From                   Message
  ----     ------            ----               ----                   -------
  Normal   SuccessfulCreate  13m                replicaset-controller  Created pod: pod
  Warning  FailedCreate      13m                replicaset-controller  Error creating: pods "pod" is forbidden: exceeded quota: custom-resource-quota, requested: cpu=510m, used: cpu=1630m, limited: cpu=2
```

## 参考链接

- [kubernetes-replicafailure-failedcreate-but-no-events](https://stackoverflow.com/a/64016529/5161084)
