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

## 了解 ReplicationController

### 介绍

ReplicationController 旨在创建和管理一个 Pod 的多个副本(replicas)，这就是它名字的由来，ReplicationController 是通过标签来查看和管理容器。

ReplicationController 由三部分组成:

1. Label Selector(标签选择器)，用于确定 ReplicationController 的作用域中有哪些 Pod
2. Replica Count(副本个数)，指定应该运行的 Pod 数量。
3. Pod template(Pod 模板)，用于创建新的 Pod 副本

__注意:__ ReplicationController 管理的 Pod 不会从一个节点迁移到另一个节点上，它只会在另一个节点上新建一个 Pod，或者删除当前节点上的 Pod。

### 创建 ReplicationController

以下是创建一个 ReplicationController 的示例文件

```yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: kubia
spec:
  # 定义了 RC 的副本个数和标签选择器属性
  replicas: 3
  selector:
    app: kubia
  # template 定义了 Pod 模板
  template:
    metadata:
      # 注意这里定义的标签要和 spec.selector 中定义的标签一致，否则 RC 就会不停地创建 Pod
      labels:
        app: kubia
    spec:
      containers:
        - name: kubia
          image: bwangel/kubia:v0.1
          ports:
            - containerPort: 8080
```

__注意:__ 模板文件可以不指定选择器(spec.selector)，让 K8S 自动从 Pod 模板中提取标签配置

+ 创建好 RC 后，我们可以查看 集群中的 Pod，可以看到已经有对应标签的 Pod 被创建了

```sh
ø> kubectl get pod --show-labels
NAME          READY   STATUS              RESTARTS   AGE   LABELS
kubia-8fnnc   1/1     Running             0          36s   app=kubia
kubia-gswk6   0/1     ContainerCreating   0          36s   app=kubia
kubia-q865j   1/1     Running             0          36s   app=kubia
```

+ 查看 RC 的详细信息

```sh
ø> kubectl describe rc kubia
Name:         kubia
Namespace:    default
Selector:     app=kubia
Labels:       app=kubia
Annotations:  <none>
Replicas:     3 current / 3 desired  # 副本的实际数量和期望数量
Pods Status:  3 Running / 0 Waiting / 0 Succeeded / 0 Failed  # 当前各个状态的 Pod 数量
Pod Template:
  Labels:  app=kubia
  Containers:
   kubia:
    Image:        bwangel/kubia:v0.1
    Port:         8080/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
# 这里列出了 RC 的事件
Events:
  Type    Reason            Age   From                    Message
  ----    ------            ----  ----                    -------
  Normal  SuccessfulCreate  6m7s  replication-controller  Created pod: kubia-8fnnc
  Normal  SuccessfulCreate  6m7s  replication-controller  Created pod: kubia-gswk6
  Normal  SuccessfulCreate  6m7s  replication-controller  Created pod: kubia-q865j
```

### 通过删除 Pod 来看 RC 的自动恢复能力

```sh
# 查看当前所有的 Pod
ø> kubectl get pod --show-labels
NAME          READY   STATUS    RESTARTS   AGE     LABELS
kubia-8fnnc   1/1     Running   0          9m36s   app=kubia
kubia-gswk6   1/1     Running   0          9m36s   app=kubia
kubia-q865j   1/1     Running   0          9m36s   app=kubia

# 删除某个特定的 Pod
ø> kubectl delete pod kubia-q865j
pod "kubia-q865j" deleted

# 可以看到 RC 又重建了一个 Pod
ø> kubectl get pod --show-labels
NAME          READY   STATUS    RESTARTS   AGE   LABELS
kubia-2c592   1/1     Running   0          14s   app=kubia
kubia-8fnnc   1/1     Running   0          10m   app=kubia
kubia-gswk6   1/1     Running   0          10m   app=kubia

# 查看 RC 的详细信息
ø> kubectl describe rc kubia
Name:         kubia
Selector:     app=kubia
Labels:       app=kubia
Replicas:     3 current / 3 desired
Pods Status:  3 Running / 0 Waiting / 0 Succeeded / 0 Failed
Pod Template:
  Labels:  app=kubia
Events:
  Type    Reason            Age   From                    Message
  ----    ------            ----  ----                    -------
  Normal  SuccessfulCreate  11m   replication-controller  Created pod: kubia-8fnnc
  Normal  SuccessfulCreate  11m   replication-controller  Created pod: kubia-gswk6
  Normal  SuccessfulCreate  11m   replication-controller  Created pod: kubia-q865j
  # 可以看到新增了一个新建 Pod 的事件
  Normal  SuccessfulCreate  85s   replication-controller  Created pod: kubia-2c592
```

当 K8S 的 API 服务器收到删除某个 Pod 的请求后，会将该事件通知相关的 RC。RC 收到事件通知后会去检查实际的 Pod 数量并采取适当的措施。

RC 不会对删除 Pod 操作本身做出反应，而是对删除 Pod 操作导致的状态 `Pod 数量不足` 做出了反应。

### 通过停止节点来查看 RC 的自动恢复能力

```sh
# 查看当前 Pod 的状态
ø> kubectl get pod --show-labels -o=wide
NAME          READY   STATUS    RESTARTS   AGE     IP         NODE                                  NOMINATED NODE   READINESS GATES   LABELS
kubia-2c592   1/1     Running   0          3m24s   10.0.2.5   gke-demo-default-pool-ade08258-zjhd   <none>           <none>            app=kubia
kubia-8fnnc   1/1     Running   0          13m     10.0.2.4   gke-demo-default-pool-ade08258-zjhd   <none>           <none>            app=kubia
kubia-gswk6   1/1     Running   0          13m     10.0.1.5   gke-demo-default-pool-ade08258-g3rl   <none>           <none>            app=kubia

# 停掉 gke-demo-default-pool-ade08258-g3rl 节点
ø> gcloud compute ssh gke-demo-default-pool-ade08258-g3rl
Welcome to Kubernetes v1.14.10-gke.27!

You can find documentation for Kubernetes at:
  http://docs.kubernetes.io/

The source for this release can be found at:
  /home/kubernetes/kubernetes-src.tar.gz
Or you can download it at:
  https://storage.googleapis.com/kubernetes-release-gke/release/v1.14.10-gke.27/kubernetes-src.tar.gz

It is based on the Kubernetes source at:
  https://github.com/kubernetes/kubernetes/tree/v1.14.10-gke.27

For Kubernetes copyright and licensing information, see:
  /home/kubernetes/LICENSES

# 通过关闭网卡来停掉这个节点
michaeltsui@gke-demo-default-pool-ade08258-g3rl ~ $ sudo ifconfig eth0 down
packet_write_wait: Connection to 35.234.11.33 port 22: Broken pipe
ERROR: (gcloud.compute.ssh) [/usr/bin/ssh] exited with return code [255].

# 查看所有节点的状态，发现被停掉节点的状态变成了 NotReady
ø> kubectl get node --show-labels
NAME                                  STATUS     ROLES    AGE   VERSION
gke-demo-default-pool-ade08258-g3rl   NotReady   <none>   47h   v1.14.10-gke.27
gke-demo-default-pool-ade08258-vqx4   Ready      <none>   19d   v1.14.10-gke.27
gke-demo-default-pool-ade08258-zjhd   Ready      <none>   19d   v1.14.10-gke.27

# 查看 Pod 的状态，发现新建了一个 Pod kubia-fxkbc
# 被停掉节点上的 Pod kubia-gswk6 的状态变成了 Unknown
ø> kubectl get pods --show-labels -o=wide
NAME          READY   STATUS    RESTARTS   AGE    IP         NODE                                  NOMINATED NODE   READINESS GATES   LABELS
kubia-2c592   1/1     Running   0          16m    10.0.2.5   gke-demo-default-pool-ade08258-zjhd   <none>           <none>            app=kubia
kubia-8fnnc   1/1     Running   0          26m    10.0.2.4   gke-demo-default-pool-ade08258-zjhd   <none>           <none>            app=kubia
kubia-fxkbc   1/1     Running   0          112s   10.0.2.6   gke-demo-default-pool-ade08258-zjhd   <none>           <none>            app=kubia
kubia-gswk6   1/1     Unknown   0          26m    10.0.1.5   gke-demo-default-pool-ade08258-g3rl   <none>           <none>            app=kubia

# 恢复被停掉的节点
ø> gcloud compute instances reset gke-demo-default-pool-ade08258-g3rl
Updated [https://www.googleapis.com/compute/v1/projects/braided-turbine-271114/zones/asia-east1-c/instances/gke-demo-default-pool-ade08258-g3rl].

Updates are available for some Cloud SDK components.  To install them,
please run:
  $ gcloud components update

To take a quick anonymous survey, run:
  $ gcloud survey

# 查看 K8S 集群中的节点也恢复了
ø> kubectl get node
NAME                                  STATUS   ROLES    AGE   VERSION
gke-demo-default-pool-ade08258-g3rl   Ready    <none>   47h   v1.14.10-gke.27
gke-demo-default-pool-ade08258-vqx4   Ready    <none>   19d   v1.14.10-gke.27
gke-demo-default-pool-ade08258-zjhd   Ready    <none>   19d   v1.14.10-gke.27

# 节点恢复后，查看 Pod 会发现刚刚状态为 Unknown 的 Pod 被删除了。
ø> kubectl get pods --show-labels -o=wide
NAME          READY   STATUS    RESTARTS   AGE     IP         NODE                                  NOMINATED NODE   READINESS GATES   LABELS
kubia-2c592   1/1     Running   0          19m     10.0.2.5   gke-demo-default-pool-ade08258-zjhd   <none>           <none>            app=kubia
kubia-8fnnc   1/1     Running   0          29m     10.0.2.4   gke-demo-default-pool-ade08258-zjhd   <none>           <none>            app=kubia
kubia-fxkbc   1/1     Running   0          5m35s   10.0.2.6   gke-demo-default-pool-ade08258-zjhd   <none>           <none>            app=kubia
```