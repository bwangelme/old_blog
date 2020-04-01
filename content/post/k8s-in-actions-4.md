---
title: "《K8S in Actions》 第四章学习笔记"
date: 2020-04-01T21:21:52+08:00
lastmod: 2020-04-01T21:21:52+08:00
draft: false
tags: [Kubernetes, 笔记]
author: "bwangel"
comment: true

---

副本机制和其他控制器 -- 部署托管的 Pod

<!--more-->
---

## 保持 Pod 健康

如果容器的主进程崩溃或存活探针检查失败，K8S 会自动重启容器，通过这种方式来让容器获得了自我修复的能力。

这个操作是由节点上的 kubelet 执行的，在主服务器上运行的 K8S Control Plane 组件不会参与此过程。

### 存活探针

存活探针 (`liveness probe`) 可以用来定期检查容器是否还在正常运行，从而决定是否重启容器。

存活探针有三种:

1. `HTTP GET 探针`:
GET 容器的 HTTP 地址，检查响应码是否是 2xx 或 3xx
2. `TCP 探针`:
测试能否与容器的指定端口建立 TCP 连接
3. `Exec 指针`:
在容器内执行某个命令，检查命令的返回码是否是0

### 创建一个 HTTP GET 探针

#### 准备工作

1. 修改 kubia 程序，设置请求5次`/`接口后，程序就会返回 500，kubia 程序的代码在 [bwangelme/kubia@v0.2](https://github.com/bwangelme/kubia/tree/v0.2)。
2. 根据上述代码，重新创建一个镜像，[bwangel/kubia:v0.2](https://hub.docker.com/r/bwangel/kubia/tags)


#### 创建 Pod & 查看探针

+ kubia-liveness.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: kubia-unhealthy
spec:
  containers:
    - image: bwangel/kubia:v0.2
      name: kubiame
      livenessProbe:
        httpGet:
          path: /
          port: 8080
```

通过 `spec.containers.image.livenessProbe` 我们创建了一个 HTTP GET 存活探针。

+ 创建 & 查看 Pod

```sh
ø> kubectl create -f kubia-liveness.yaml
pod/kubia-unhealthy created

ø> kubectl get pod
NAME              READY   STATUS             RESTARTS   AGE
kubia-unhealthy   0/1     CrashLoopBackOff   11         30m
# RESTARTS 表示 Pod 已经重启了11次，目前 Pod 正处于 CrashLoopBackOff 状态
```

```sh
ø> kubectl describe pod kubia-unhealthy
Name:         kubia-unhealthy
Namespace:    default
Priority:     0
Node:         gke-demo-default-pool-ade08258-zjhd/10.140.0.10
Start Time:   Wed, 01 Apr 2020 22:07:04 +0800
Labels:       <none>
Annotations:  kubernetes.io/limit-ranger: LimitRanger plugin set: cpu request for container kubiame
Status:       Running
IP:           10.0.2.2
IPs:          <none>
Containers:
  kubiame:
    Container ID:   docker://6eb920af09115cb21564045fbc8ced0251e3aaecd5e7482142ecbf8ace3439e5
    Image:          bwangel/kubia:v0.2
    Image ID:       docker-pullable://bwangel/kubia@sha256:a89eaf3503fc72dc1e8c702142faefa6aeb59860c9472c1ee3e7e8154771be43
    Port:           <none>
    Host Port:      <none>
    State:          Waiting
      Reason:       CrashLoopBackOff
    # 先前的容器被 Signal INT(2) 终止了
    Last State:     Terminated
      Reason:       Error
      Exit Code:    2
      Started:      Wed, 01 Apr 2020 22:34:48 +0800
      Finished:     Wed, 01 Apr 2020 22:35:57 +0800
    Ready:          False
    # 容器已经重启了11次了
    Restart Count:  11
    Requests:
      cpu:        100m
    # 这里介绍了存活探针的属性
    # 探针将会在应用启动后延迟0秒开始检查，探针检查的超时时间为1秒，检查间隔为10秒，检查失败3次后重启应用
    Liveness:     http-get http://:8080/ delay=0s timeout=1s period=10s #success=1 #failure=3
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-hbl2l (ro)
Conditions:
  Type              Status
  Initialized       True
  Ready             False
  ContainersReady   False
  PodScheduled      True
Volumes:
  default-token-hbl2l:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-hbl2l
    Optional:    false
QoS Class:       Burstable
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute for 300s
                 node.kubernetes.io/unreachable:NoExecute for 300s
Events:
  Type     Reason     Age                   From                                          Message
  ----     ------     ----                  ----                                          -------
  Normal   Scheduled  33m                   default-scheduler                             Successfully assigned default/kubia-unhealthy to gke-demo-default-pool-ade08258-zjhd
  Normal   Pulling    33m                   kubelet, gke-demo-default-pool-ade08258-zjhd  Pulling image "bwangel/kubia:v0.2"
  Normal   Pulled     33m                   kubelet, gke-demo-default-pool-ade08258-zjhd  Successfully pulled image "bwangel/kubia:v0.2"
  Normal   Killing    29m (x3 over 32m)     kubelet, gke-demo-default-pool-ade08258-zjhd  Container kubiame failed liveness probe, will be restarted
  Normal   Created    29m (x4 over 33m)     kubelet, gke-demo-default-pool-ade08258-zjhd  Created container kubiame
  Normal   Started    29m (x4 over 33m)     kubelet, gke-demo-default-pool-ade08258-zjhd  Started container kubiame
  Normal   Pulled     29m (x3 over 32m)     kubelet, gke-demo-default-pool-ade08258-zjhd  Container image "bwangel/kubia:v0.2" already present on machine
  # HTTP GET 存活探针检查失败，Pod 重启
  Warning  Unhealthy  13m (x25 over 32m)    kubelet, gke-demo-default-pool-ade08258-zjhd  Liveness probe failed: HTTP probe failed with statuscode: 500
  Warning  BackOff    3m49s (x78 over 26m)  kubelet, gke-demo-default-pool-ade08258-zjhd  Back-off restarting failed container
```

+ __注意:__ 当容器被强行终止时，会创建一个全新的容器，而不是重启原来的容器。

所以如果想要看容器的失败日志，要通过`kubectl logs -f kubia-unhealthy --previous`命令，查看上一个容器的日志。

#### 修改存活探针的选项

```yaml
spec:
  containers:
      livenessProbe:
        httpGet:
          path: /
          port: 8080
        initialDelaySeconds: 15  # 设置应用启动15秒后，才开始探针检查
```

如果探针检测的延时很短，可能导致应用还没有完全启动就开始检测，但检测的结果始终是失败的，这样应用会被无限重启。

### 创建存活探针的注意事项

#### 1. 探针应该只检查应用内部的状态

例如 web 程序依赖的数据库崩溃了，web 程序的存活探针不应该返回失败，否则就会导致应用程序被无限重启，但这样并不能恢复数据库。

#### 2. 探针应该是轻量的

探针的CPU执行时间会占用 Pod 的执行时间，重量的探针会让 Pod 的 CPU 执行时间变短。

Java 和 Python 应用，启动时解释器会执行一些初始化操作，耗费大量的时间。应该使用 HTTP GET 探针，而不应该使用 Exec 探针。

#### 3. 探针中的操作无需重试

K8S 在检查应用的探针时就会自动重试，故探针内部只用做一次检查就好，无需重试。