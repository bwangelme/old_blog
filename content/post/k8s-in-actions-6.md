---
title: "《K8S in Actions》第六章学习笔记"
date: 2020-10-11T14:47:13+08:00
lastmod: 2020-10-11T14:47:13+08:00
draft: false
tags: [kubernetes, 杂记]
author: "bwangel"
comment: true

---

> 卷: 将磁盘挂载到容器
<!--more-->
---

## 介绍卷

+ 卷被定义为 Pod 的一部分，且和 Pod 拥有相同的生命周期。在重启容器之后，新容器可以识别前一个容器写入卷的所有文件。
另外，如果一个 Pod 包含有多个容器，那么这个卷可以同时被 Pod 内的所有容器使用。

+ 填充或装入卷的过程是在 Pod 内的容器启动之前执行的。

+ 卷被绑定到 Pod 的生命周期中，只有在 Pod 存在时才会存在，但是取决于卷的类型，某些类型下，即使在 Pod 和 卷消失之后，卷的文件也可能保持和原样，并可以挂载到新的卷中。

## 通过卷在容器之间共享数据

### 使用 emptyDir 卷

`emptyDir`卷提供一个空目录，供 pod 内的应用程序写入。`emptyDir` 卷的生命周期和 Pod 的生命周期相关联，所以当删除 Pod 时，卷的内容就会丢失。

+ 构建 fortune 镜像

[Dockerfile 及容器入口文件](https://github.com/bwangelme/k8s-in-actions/tree/master/fortune)

```sh
docker build -t bwangel/fortune .
docker push bwangel/fortune
```

emptyDir 卷是在承载 Pod 的工作节点的实际磁盘上创建的，因此其性能取决与节点磁盘的类型，我们也可以通知 k8s 在 tmfs 文件系统(存在内存而非磁盘)上创建 emptyDir。只需要修改卷的 `medium` 设置即可:

```yaml
volumes:
    - name: html
      emptyDir:
        medium: Memory
```

### 通过端口转发访问 Pod

+ fortune-pod.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: fortune
spec:
  containers:
  - image: bwangel/fortune
    name: html-generator
    volumeMounts:
    - name: html
      mountPath: /var/htdocs
  - image: nginx:alpine
    name: web-server
    volumeMounts:
    - name: html
      mountPath: /usr/share/nginx/html
      readOnly: true
  volumes:
  - name: html
    emptyDir: {}
```

下面的命令创建了一个 fortune 的 Pod，并设置了本地端口8080 转发到 fortune Pod 的 80 端口

```sh
$ k create -f fortune-pod.yaml
$ k port-forward fortune 8080:8080
$ http localhost:8080
HTTP/1.1 200 OK
Accept-Ranges: bytes
Connection: keep-alive
Content-Length: 24
Content-Type: text/html
Date: Tue, 05 Jan 2021 00:38:47 GMT
ETag: "5ff3b512-18"
Last-Modified: Tue, 05 Jan 2021 00:38:42 GMT
Server: nginx/1.19.6

You now have Asian Flu.
```

### 通过 LoadBalancer 服务来访问 Pod

+ webview-svc.yaml

```yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: webview
spec:
  replicas: 3
  template:
    metadata:
      name: webview-v1
      labels:
        app: webview
    spec:
      containers:
      - image: bwangel/fortune
        name: html-generator
        volumeMounts:
        - name: html
          mountPath: /var/htdocs
      - image: nginx:alpine
        name: web-server
        volumeMounts:
        - name: html
          mountPath: /usr/share/nginx/html
          readOnly: true
      volumes:
      - name: html
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: webview
spec:
  type: LoadBalancer
  selector:
    app: webview
  ports:
    - port: 80
      targetPort: 80
```

下面的命令创建了一个名为 webview 的 Loadbalancer 服务和一个名为 webview 的 RC，我们可以通过 LoadBalancer 的外部IP 访问到 Pod。

```sh
ø> k create -f 6chapter/webview-svc.yaml
ø> k get svc webview
NAME      TYPE           CLUSTER-IP    EXTERNAL-IP    PORT(S)        AGE
webview   LoadBalancer   10.3.242.84   34.84.233.43   80:31870/TCP   9m21s
ø> http 34.84.233.43
HTTP/1.1 200 OK
Accept-Ranges: bytes
Connection: keep-alive
Content-Length: 51
Content-Type: text/html
Date: Tue, 05 Jan 2021 00:43:12 GMT
ETag: "5ff3b61c-33"
Last-Modified: Tue, 05 Jan 2021 00:43:08 GMT
Server: nginx/1.19.6

You'll feel much better once you've given up hope.
```

## 访问工作节点文件系统上的文件

hostPath 卷可以让 Pod 读取/写入 工作节点的文件系统。

从下面的例子中可以看到，系统的 fluentd-gke-jvbcc Pod 使用 hostPath 卷来读取工作节点上的 `/var/log` 和 `/var/lib/docker/containers` 等目录。

```
ø> kubectl describe pod fluentd-gke-jvbcc --namespace kube-system
Name:                 fluentd-gke-jvbcc
...
Volumes:
  varrun:
    Type:          HostPath (bare host directory volume)
    Path:          /var/run/google-fluentd
    HostPathType:
  varlog:
    Type:          HostPath (bare host directory volume)
    Path:          /var/log
    HostPathType:
  varlibdockercontainers:
    Type:          HostPath (bare host directory volume)
    Path:          /var/lib/docker/containers
    HostPathType:
  input-config-volume:
    Type:      ConfigMap (a volume populated by a ConfigMap)
    Name:      fluentd-gke-input-config-v1.2.9
    Optional:  false
  config-volume:
    Type:      ConfigMap (a volume populated by a ConfigMap)
    Name:      fluentd-gke-config-v1.2.9
    Optional:  false
  fluentd-gke-token-299pv:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  fluentd-gke-token-299pv
    Optional:    false
...
```

## 使用持久化存储

```sh
# 创建 GCE 持久磁盘存储
gcloud compute disks create --size=10Gib --zone=asia-northeast1-a mongodb

# 下面的命令可以查看 Pod 被调度到了哪一个节点上
ø> k get pod -o wide gitrepo-volume-pod
NAME                 READY   STATUS    RESTARTS   AGE   IP         NODE                                   NOMINATED NODE   READINESS GATES
gitrepo-volume-pod   1/1     Running   0          31h   10.0.0.7   gke-kubia-default-pool-83589229-zfw4   <none>           <none>
```

+ mongodb-pod-gcepd.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mongodb
spec:
  volumes:
  - name: mongodb-data
    # 声明卷的类型和它使用的文件系统
    gcePersistentDisk:
      pdName: mongodb
      fsType: ext4
  containers:
  - image: mongo
    name: mongodb
    # 根据卷的名字将卷挂载到容器上
    volumeMounts:
    - name: mongodb-data
      mountPath: /data/db
    ports:
    - containerPort: 27017
      protocol: TCP
```

+ 操作实录

```sh
# 创建 mongodb Pod
ø> k create -f 6chapter/mongodb-pod-gcepd.yaml
pod/mongodb created
# 查看 Pod 状态，已经成功运行了
ø> k get pods mongodb
NAME                 READY   STATUS    RESTARTS   AGE
mongodb              1/1     Running   0          60s
# 登录 Mongodb 数据库
ø> k exec -it mongodb -- mongo
> use mystore
switched to db mystore
# 向数据库中写入数据
> db.foo.insert({'name': 'foo'})
WriteResult({ "nInserted" : 1 })
> db.foo.find()
{ "_id" : ObjectId("5ff64ad47af44ac9535a9abe"), "name" : "foo" }
>
bye
# 删除 Pod 并重建
ø> k delete pod mongodb
pod "mongodb" deleted
ø> k create -f 6chapter/mongodb-pod-gcepd.yaml
pod/mongodb created
# 重新登录 MongoDB 进行查找，发现之前创建的记录还在
ø> k exec -it mongodb -- mongo
> use mystore
switched to db mystore
> db.foo.find()
{ "_id" : ObjectId("5ff64ad47af44ac9535a9abe"), "name" : "foo" }
>
bye
```

## 从底层技术解耦 Pod

### 持久卷和持久卷声明的工作模式

Persistent Volume(PV)，持久卷，管理员声明的一种和存储系统绑定的资源。

持久卷不属于任何命名空间，它和节点一样，是集群层面的资源。

Persitent Volume Claim(PVC)，持久卷声明，开发人员声明的一种持久卷资源请求，K8S 将会根据 PVC 中的声明，分配合适的持久卷资源和 PVC 绑定起来。

PVC 状态说明:

+ RWO -- ReadWriteOnce  仅允许单个节点的挂载读写
+ ROX -- ReadOnlyMany  允许多个节点的挂载只读
+ RWX -- ReadWriteMany 允许多个节点挂载读写这个卷

__注意:__ RWO, ROX, RWX 涉及可以同时使用卷的 __工作节点__ 的数量而非 Pod 的数量。

PVC 只能在特定命名空间中创建，且只能被这个命名空间的 Pod 使用。

它们的工作模式:

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-01-07-091724.png)

### 创建持久卷

+ mongodb-pv-gcepd.yaml

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mongodb-pv
spec:
  capacity:
    storage: 10Gi
  # 声明持久卷的访问模式，单节点读写和多节点只读
  accessModes:
  - ReadWriteOnce
  - ReadOnlyMany
  # pvc 删除后，保留 pv
  persistentVolumeReclaimPolicy: Retain
  gcePersistentDisk:
    pdName: mongodb
    fsType: ext4
```

```sh
ø> k create -f 6chapter/mongodb-pv-gcepd.yaml
persistentvolume/mongodb-pv created
# 查看持久卷，可以看到持久卷的状态是 Available
ø> k get pv
NAME         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
mongodb-pv   10Gi       RWO,ROX        Retain           Available                                   3s
```

### 创建持久卷声明

+ mongodb-pvc.yaml

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
spec:
  # 声明需要的 pv 的特征，存储是1Gi，访问模式是单节点读写
  resources:
    requests:
      storage: 1Gi
  accessModes:
  - ReadWriteOnce
  storageClassName: ""
```

```sh
# 创建 pvc
ø> k create -f 6chapter/mongodb-pvc.yaml
persistentvolumeclaim/mongodb-pvc created
ø> k get pvc
NAME          STATUS   VOLUME       CAPACITY   ACCESS MODES   STORAGECLASS   AGE
mongodb-pvc   Bound    mongodb-pv   10Gi       RWO,ROX                       3s
# 查看pv，可以看到它的状态已经变成了 Bound，且被绑定到了 default/mongodb-pvc 上
ø> k get pv
NAME         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                 STORAGECLASS   REASON   AGE
mongodb-pv   10Gi       RWO,ROX        Retain           Bound    default/mongodb-pvc                           3m51s
```

### 在 Pod 中使用 持久卷声明

+ mongodb-pod-pvc.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mongodb
spec:
  containers:
  - image: mongo
    name: mongodb
    volumeMounts:
    - name: mongodb-data
      mountPath: /data/db
    ports:
    - containerPort: 27017
      protocol: TCP
  # 将刚刚创建的 PVC 声明为一种卷
  volumes:
  - name: mongodb-data
    persistentVolumeClaim:
      claimName: mongodb-pvc
```

```sh
# 创建 Pod
ø> k create -f 6chapter/mongodb-pod-pvc.yaml
pod/mongodb created
# 登录 mongodb，查询我们之前创建的数据
ø> k exec -it mongodb -- mongo
> use mystore
switched to db mystore
# 可以看到之前创建的数据仍然存在
> db.foo.find()
{ "_id" : ObjectId("5ff64ad47af44ac9535a9abe"), "name" : "foo" }
>
bye
```

### 删除持久卷声明

```sh
ø> k delete pod mongodb
pod "mongodb" deleted
2598 (lazyubuntu) ~/Github/k8s-in-actions (master)
ø> k delete pvc mongodb-pvc
persistentvolumeclaim "mongodb-pvc" deleted
ø> k get pv
NAME         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM                 STORAGECLASS   REASON   AGE
mongodb-pv   10Gi       RWO,ROX        Retain           Released   default/mongodb-pvc                           12m
```

当我们删除 PVC 之后，可以看到 PV 没有变成可用的状态，而是变成了 `Released` 状态。这是因为我们在创建 PV 时声明它的 `RECLAIM POLICY` 是 `Retain` 。此时需要系统管理员来确定 PV 中的数据是否还可用，手动回收卷并更改其状态，然后这个PV才能够被重新使用。

## 持久卷的动态配置

StorageClass 是一种集群资源，它绑定了一个 __制备程序__ ，可以根据 PVC 的申请，来动态地创建 PV 并绑定到实际的存储上。

+ 持久卷动态配置的完整图示

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-01-08-073419.png)


+ k8s 中有个默认的存储类 (StorageClass) `standard`，如果 PVC 声明中没有指定存储类，那就使用这个默认的存储类来创建 PV 。

```sh
ø> k get sc standard -o yaml
allowVolumeExpansion: true
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  annotations:
    # 这个注解声明它是默认的存储类
    storageclass.kubernetes.io/is-default-class: "true"
  creationTimestamp: "2021-01-03T16:26:12Z"
  labels:
    addonmanager.kubernetes.io/mode: EnsureExists
  name: standard
  resourceVersion: "263"
  selfLink: /apis/storage.k8s.io/v1/storageclasses/standard
  uid: 278b918a-466e-454b-bab4-f25833314feb
parameters:
  type: pd-standard
provisioner: kubernetes.io/gce-pd  # 这是它所配置的制备程序
reclaimPolicy: Delete  # 声明创建的 PV 的使用策略
volumeBindingMode: Immediate
```
