---
title: "《K8S in Actions》 第三章学习笔记"
date: 2020-03-19T00:03:01+08:00
lastmod: 2020-03-19T00:03:01+08:00
draft: false
tags: [kubernetes, 杂记]
author: "bwangel"
comment: true

---

> Pod - 运行于 Kubernetes 中的容器

<!--more-->

---

## 介绍 pod

+ pod 内可以运行一个或多个容器，一个 pod 绝不会跨越多个工作节点。
+ pod 内的容器可以分为主容器和 sidecar 容器。(支持容器)

---

+ Question: 为什么每个容器内只运行一个进程?
+ Answer: 如果我们在容器内运行多个进程，那么管理这些进程的启动，停止，重启就会变得复杂。同时，由于进程们的输出都写到了 Docker 的输出中，分别管理它们的日志也不容易，未能充分利用 Docker 的特性。

### Pod 内容器的共享与隔离

Kubernetes 通过配置 Docker 来让一个 pod 内的所有容器共享 Linux 命名空间。

具体来说: 

+ pod 内的所有容器共享 Network, UTS，IPC 命名空间，这样 pod 内的所有容器具有相同的网络环境和主机名，他们之间可以相互进行 IPC 通信。(配置端口时要注意不让他们的端口发生冲突，同时他们可以通过 localhost 地址进行通信。)
+ PID 命名空间默认是不共享的，可以通过配置开启。
+ Mount 命名空间是不共享的，pod 内的容器相互是独立的根目录。如果容器之间想要共享文件的话，可以配置 k8s Volume 资源共享文件目录

### Pod 的网络

k8s 集群中所有的 pod 都在同一个网络地址空间中，他们之间没有 NAT 网关。

## 通过 Manifest 创建 Pod

### 常用命令

```sh
# 输出一个 Pod 的 yaml 配置
`kubectl get pod podName -o=yaml`

# 获取配置的文档
`kubectl explain pod`
`kubectl explain pod.spec.containers`

# 通过 manifest 创建一个 Pod
`kubectl create -f somefile.yaml`
```

### Manifest 说明

```
apiVersion: v1
kind: Pod
metadata:
  annotations:
    kubernetes.io/limit-ranger: 'LimitRanger plugin set: cpu request for container
      kubiame'
  creationTimestamp: "2020-03-16T13:35:38Z"
  generateName: kubiame-
  labels:
    run: kubiame
  name: kubiame-8wt8x
  namespace: default
  ownerReferences:
  - apiVersion: v1
    blockOwnerDeletion: true
    controller: true
    kind: ReplicationController
    name: kubiame
    uid: bd10842d-6602-11ea-93a6-42010a8c003a
  resourceVersion: "591803"
  selfLink: /api/v1/namespaces/default/pods/kubiame-8wt8x
  uid: 05e120ae-678b-11ea-baaa-42010a8c0091
spec:
  containers:
  - image: bwangel/kubia:v0.1
    imagePullPolicy: IfNotPresent
    name: kubiame
    ports:
    - containerPort: 8080
      protocol: TCP
    resources:
      requests:
        cpu: 100m
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: default-token-hbl2l
      readOnly: true
  dnsPolicy: ClusterFirst
  enableServiceLinks: true
  nodeName: gke-demo-default-pool-ade08258-vqx4
  priority: 0
  restartPolicy: Always
  schedulerName: default-scheduler
  securityContext: {}
  serviceAccount: default
  serviceAccountName: default
  terminationGracePeriodSeconds: 30
  tolerations:
  - effect: NoExecute
    key: node.kubernetes.io/not-ready
    operator: Exists
    tolerationSeconds: 300
  - effect: NoExecute
    key: node.kubernetes.io/unreachable
    operator: Exists
    tolerationSeconds: 300
  volumes:
  - name: default-token-hbl2l
    secret:
      defaultMode: 420
      secretName: default-token-hbl2l
status:
  conditions:
  - lastProbeTime: null
    lastTransitionTime: "2020-03-16T13:35:38Z"
    status: "True"
    type: Initialized
  - lastProbeTime: null
    lastTransitionTime: "2020-03-16T13:36:18Z"
    status: "True"
    type: Ready
  - lastProbeTime: null
    lastTransitionTime: "2020-03-16T13:36:18Z"
    status: "True"
    type: ContainersReady
  - lastProbeTime: null
    lastTransitionTime: "2020-03-16T13:35:38Z"
    status: "True"
    type: PodScheduled
  containerStatuses:
  - containerID: docker://59a3d4a8f8778b7fa6424f91246180a82435cda5867915008250004b2171562a
    image: bwangel/kubia:v0.1
    imageID: docker-pullable://bwangel/kubia@sha256:16a200e2b44a2e9b28fe9c40338d3766f376130f806e263193dba02fb6d40c7c
    lastState: {}
    name: kubiame
    ready: true
    restartCount: 0
    state:
      running:
        startedAt: "2020-03-16T13:36:17Z"
  hostIP: 10.140.0.2
  phase: Running
  podIP: 10.0.0.6
  qosClass: Burstable
  startTime: "2020-03-16T13:35:38Z"
```

上面是通过 `kubectl get pod -o=yaml` 获取的完整的配置文件，一个 Pod 的YAML配置文件主要包括这么几部分:

名称|说明
---|---
`apiVersion`|k8s API 的版本
`kind`|定义的资源的类型
`metadata`部分| Pod 的名称，命名空间，标签以及其他信息
`spec`部分| Pod 内容的实际说明，例如 Pod 的容器，卷等
`status`部分| Pod 的状态信息 (创建 Pod 时，无需指定 status 部分)


## 创建一个 Pod

下面是创建 Pod 所需的 Manifest 文件, `kubia-manual.yaml`，使用命令 `kubectl create -f kubia-manual.yaml` 就可以创建一个 Pod 了。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: kubia-manual
spec:
  containers:
    - image: bwangel/kubia:v0.1
      name: kubiame
      ports:
      - containerPort: 8080
        protocol: TCP
```

需要注意的是, `ports` 部分是信息式的，即使 Manifest 中未声明 `ports`，只要应用监听了`0.0.0.0:8080`，其他 Pod 仍然能够访问这个 Pod 的 8080 端口。采用这样的声明可以让其他用户方便地了解到这个 Pod 暴露了哪些端口。

## 端口转发 & 查看日志

可以通过`端口转发`来访问 pod

```
kubectl port-forward kubia-manual <本地端口>:<Pod 暴露的端口>
```

```sh
# 查看日志
kubectl logs -f <Pod 名称> -c <容器的名称>
```

## 使用标签组织 Pod

标签是可以附加到资源的任意键值对，用以选择具有该确切标签的资源(这是通过标签选择器完成的)。

### 查看 Pod 的标签

```sh
# 查看所有标签
ø> kubectl get pod --show-labels
NAME              READY   STATUS    RESTARTS   AGE     LABELS
kubia-manual      1/1     Running   0          6d      <none>
kubia-manual-v2   1/1     Running   0          59s     creation_method=manual,env=prod
kubiame-fvh8x     1/1     Running   0          5d22h   run=kubiame
kubiame-hcjkf     1/1     Running   0          5d22h   run=kubiame
kubiame-qvw7w     1/1     Running   0          5d22h   run=kubiame
# 查看指定标签
ø> kubectl get pod -L creation_method,env
NAME              READY   STATUS    RESTARTS   AGE     CREATION_METHOD   ENV
kubia-manual      1/1     Running   0          6d
kubia-manual-v2   1/1     Running   0          63s     manual            prod
kubiame-fvh8x     1/1     Running   0          5d22h
kubiame-hcjkf     1/1     Running   0          5d22h
kubiame-qvw7w     1/1     Running   0          5d22h
```

### 修改 Pod 的标签

```sh
# 为 Pod 新增标签
ø> kubectl label pod kubia-manual creation_method=manual
pod/kubia-manual labeled
# 修改 Pod 的已有标签
ø> kubectl label pod kubia-manual-v2 env=debug --overwrite
pod/kubia-manual-v2 labeled
ø> kubectl get pod -L creation_method,env
NAME              READY   STATUS    RESTARTS   AGE     CREATION_METHOD   ENV
kubia-manual      1/1     Running   0          6d      manual
kubia-manual-v2   1/1     Running   0          2m52s   manual            debug
```

## 通过标签选择器列出 Pod 子集

标签选择器可以根据资源的以下条件来选择资源:


```sh
# 包含(或者不包含)使用特定建的标签
ø> kubectl get pod -l creation_method
NAME              READY   STATUS    RESTARTS   AGE
kubia-manual      1/1     Running   0          6d
kubia-manual-v2   1/1     Running   0          17m
ø> kubectl get pod -l '!creation_method'
NAME            READY   STATUS    RESTARTS   AGE
kubiame-fvh8x   1/1     Running   0          5d22h
kubiame-hcjkf   1/1     Running   0          5d22h
kubiame-qvw7w   1/1     Running   0          5d22h

# 包含具有特定建和值的标签
ø> kubectl get pod -l creation_method=manual
NAME              READY   STATUS    RESTARTS   AGE
kubia-manual      1/1     Running   0          6d
kubia-manual-v2   1/1     Running   0          18m
ø> kubectl get pod -l 'env in (debug,prod)'
NAME              READY   STATUS    RESTARTS   AGE
kubia-manual-v2   1/1     Running   0          20m

# 键的值值不是我们指定的值
ø> kubectl get pod -l 'creation_method!=manual'
NAME            READY   STATUS    RESTARTS   AGE
kubiame-fvh8x   1/1     Running   0          5d22h
kubiame-hcjkf   1/1     Running   0          5d22h
kubiame-qvw7w   1/1     Running   0          5d22h
ø> kubectl get pod -l 'env notin (debug,prod)' --show-labels
NAME            READY   STATUS    RESTARTS   AGE     LABELS
kubia-manual    1/1     Running   0          6d1h    creation_method=manual
kubiame-fvh8x   1/1     Running   0          5d22h   run=kubiame
kubiame-hcjkf   1/1     Running   0          5d22h   run=kubiame
kubiame-qvw7w   1/1     Running   0          5d22h   run=kubiame
```

+ 当条件有多个时，他们是`and`的关系

```sh
ø> kubectl get pod -l 'creation_method=manual,env=debug' --show-labels
NAME              READY   STATUS    RESTARTS   AGE   LABELS
kubia-manual-v2   1/1     Running   0          25m   creation_method=manual,env=debug
```

## 使用标签和选择器来约束 Pod 调度

```sh
# 为节点添加标签
ø> kubectl label node gke-demo-default-pool-ade08258-g3rl gpu=true
node/gke-demo-default-pool-ade08258-g3rl labeled
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: kubia-gpu
spec:
  nodeSelector:
    gpu: "true"
  containers:
    - image: bwangel/kubia:v0.1
      name: kubiame
      ports:
      - containerPort: 8080
        protocol: TCP
```

通过 `spec.NodeSelector` 可以约束这个 Pod 只在 `gpu=true` 的节点上调度。

每个节点都有一个默认标签: `kubernetes.io/hostname={节点的主机名}`，可以通过这个标签来让某个 Pod 只在一个节点上调度。

但是如果这个节点挂了的话，这个 Pod 则不会调度。

## 注解 Pod

```sh
# 添加注解
ø> kubectl annotate pod kubia-gpu bwangel.me/someannotation="foo bar"
pod/kubia-gpu annotated

# 查看注解
ø> kubectl describe pod kubia-gpu
Name:         kubia-gpu
Annotations:  bwangel.me/someannotation: foo bar
              kubernetes.io/limit-ranger: LimitRanger plugin set: cpu request for container kubiame
```

## 使用命名空间对资源进行分组

### 命名空间介绍

k8s 命名空间和 Linux 的命名空间不同，它只是简单地为对象名称提供了一个作用域，可以让我们在不同的命名空间中使用相同的名称，k8s 命名空间并不会隔离网络。

节点资源是全局的且未被约束于单一命名空间的资源，其他的大多数资源都和命名空间有关。

k8s 中所有的内容都是一个 API 对象，都可以通过向 K8S API 服务器提供 YAML manifest，来实现创建，读取，更新和删除操作。

### 查看命名空间及资源

```sh
# 获取所有命名空间

ø> kubectl get ns
NAME                   STATUS   AGE
default                Active   11d
kube-node-lease        Active   11d
kube-public            Active   11d
kube-system            Active   11d
kubernetes-dashboard   Active   9d

# 列出只属于某个 NS 的 Pod
ø> kubectl get pod -n kubernetes-dashboard
NAME                                          READY   STATUS    RESTARTS   AGE
kubernetes-dashboard-6f89577b77-fhbfb         1/1     Running   0          6d8h
kubernetes-metrics-scraper-79c9985bc6-bx59z   1/1     Running   0          6d8h
```

### 创建命名空间

可以通过以下 yaml 文件创建命名空间，也可以通过 `k create namespace {namespace}` 命令来创建命名空间。

命名空间的名字可以包括 字母，数字，横杠(`-`)，但是不能包括点(`.`)。

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bwangel
```

### 为资源指定命名空间

可以在 Pod 的创建文件中设置 `metadata.namespace` 字段，为资源指定命名空间，也可以通过 `k create -f pod.yaml -n {namespace}` 命令指定资源的命名空间。

```yaml
metadata:
  name: kubia-manual
  namespace: bwangel
```

### 切换命名空间

```sh
# 切换当前 kubectl 的默认命名空间到 bwangel
kubectl config set-context $(kubectl config current-context) --namespace bwangel

# 创建 kcd 命名，快速地切换命名空间
(( $+commands[kubectl] )) && alias kcd='kubectl config set-context $(kubectl config current-context) --namespace'

# 查看当前命名空间
ø> kubectl config view| grep namespace:
    namespace: default
```

## 停止和移除 Pod

k8s 在终止容器时，首先会向进程发送 `SIGTERM` 信号，并等待30秒。如果没有关闭的话，则继续发送 `SIGKILL` 信号。

如果应用程序想要正常结束的话，需要处理 `SIGTERM` 信号。

```sh
# 通过标签删除容器
ø> kubectl delete pod -l creation_method=manual
pod "kubia-manual" deleted
pod "kubia-manual-v2" deleted

# 删除所有资源(注：删除的是当前命名空间下的)
ø> kubectl delete all --all
pod "kubia-gpu" deleted
pod "kubiame-fvh8x" deleted
pod "kubiame-hcjkf" deleted
pod "kubiame-qvw7w" deleted
replicationcontroller "kubiame" deleted
service "kubernetes" deleted
service "kubia-http" deleted

# 删除命名空间
ø> kubectl delete ns bwangel
namespace "bwangel" deleted
```