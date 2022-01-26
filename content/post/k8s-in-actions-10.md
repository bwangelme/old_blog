---
title: "《k8s in actions》第十章杂记"
date: 2022-01-18T10:11:27+08:00
lastmod: 2022-01-18T10:11:27+08:00
draft: false
tags: [kubernetes, 杂记]
author: "bwangel"
comment: true

---

<!--more-->
---

## 杂记

- StatefulSet 用于创建有状态的服务，StatefulSet 创建的每个 Pod 都有一个从0开始的顺序索引，这个会体现在 Pod 的名称，主机名和存储上。

- Pod 挂掉后，这个 Pod 实例会在另一个节点上重建，且新的实例必须和被替换的示例有如下相同的标识:

    1. 相同的名称
    2. 相同的网络标识(主机名/IP)
    3. 相同的状态

- StatefulSet 的每个 Pod 都会创建一个持久卷声明(Persistent Volume Claim)。
  - 对 StatefulSet 执行缩容后，Pod 会被删除，但是它对应的持久卷声明不会删除，卷也不会删。需要开发者手动删除 PVC 时卷才会被删除。
  后续对 StatefulSet 执行扩容后，该索引的 Pod 又被创建了，则新 Pod 会使用之前遗留的卷。

- StatefulSet 保证 Pod 的 at-most-one 语义，即同一个索引的 Pod 最多只会创建一个。
- 删除 Pod 后，API Server 会将 Pod 标记为 Terminating 状态，使用 `k get pod` 依然能够查询到该 Pod。这是因为 API Server 必须等到 kubelet 报告该 Pod 处于删除状态后，API Server 才会真正删除 Pod 的信息。
  - 如果整个节点都挂了，确认该 Pod 已经无用了，可以使用 `k delete pod xx --force --grace-period 0` 删除该 Pod。这样 API Server 就不会等待 kubelet 的等待，直接删除 Pod 的信息

## 利用 calico 和 kubeadm 搭建 K8S 集群

+ https://projectcalico.docs.tigera.io/getting-started/kubernetes/quickstart
+ https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/

```shell
sudo kubeadm init --apiserver-advertise-address 192.168.57.101 --pod-network-cidr=10.1.0.0/16
kubeadm join 192.168.57.101:6443 --token efw8cb.x7rt4piplnoehba4 \
        --discovery-token-ca-cert-hash sha256:2939553704626b85761e11beb9230eb1194916d16ce174477591683b7c0b1df2
```

+ 安装 calico 插件

```shell
# 安装 calico operator
kubectl create -f conf/calico/tigera-operator.yaml
# 安装 自定义资源，注意，我修改了 ipPool.CIDR
kubectl create -f conf/calico/custom-resources.yaml
# 观察 calico 的相关pod，是否都处于 running 状态
kubectl get pods -n calico-system
# 去掉主节点的 taint，可以让 pod 调度上去
kubectl taint nodes --all node-role.kubernetes.io/master-
# 查看节点是否都处于 ready 状态
kubectl get nodes -o wide
```

## 实验

### 通过 Service 访问 Pod

1. 部署一个非 headless 的 Service (即 Service 有 IP)
2. 通过 Service 的 IP 访问 Pod

在 pod 内 ping svc 的 IP 超时，怀疑是网络部署的问题 (重新部署 calico 后解决)

```shell
root@dev-d68d66dff-lkfll:~# ping 10.98.169.254
PING 10.98.169.254 (10.98.169.254) 56(84) bytes of data.
^C
--- 10.98.169.254 ping statistics ---
3 packets transmitted, 0 received, 100% packet loss, time 2041ms
```

### 通过 SRV DNS 记录让 pod 彼此发现

statefulset 创建的时候，可以通过 `spec.serviceName` 字段制定 pod 绑定的 service 名字。

我们创建了一个名字叫 kubia 的 headless Service。在其他 pod 中，可以通过 SRV 记录查询到 statefulset pod 的 IP

```shell
root@dev-d68d66dff-j49lc:~# dig SRV kubia.default.svc.cluster.local

; <<>> DiG 9.11.3-1ubuntu1.16-Ubuntu <<>> SRV kubia.default.svc.cluster.local
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 3910
;; flags: qr aa rd; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 3
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
; COOKIE: 2ff40eb09b50498b (echoed)
;; QUESTION SECTION:
;kubia.default.svc.cluster.local. IN    SRV

;; ANSWER SECTION:
kubia.default.svc.cluster.local. 30 IN  SRV     0 50 80 kubia-0.kubia.default.svc.cluster.local.
kubia.default.svc.cluster.local. 30 IN  SRV     0 50 80 kubia-1.kubia.default.svc.cluster.local.

;; ADDITIONAL SECTION:
kubia-1.kubia.default.svc.cluster.local. 30 IN A 10.1.169.130
kubia-0.kubia.default.svc.cluster.local. 30 IN A 10.1.107.193

;; Query time: 0 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Sat Jan 22 15:25:04 UTC 2022
;; MSG SIZE  rcvd: 362
```

### Pod 重用存储

0. 创建一个 statefulset ，有两个 pod, pod-0 和 pod-1
1. 在 pod-1 的 volume 中写入内容。
2. 将 statefulset 的 pod 数改成 1, pod-1 被删除
3. 将 statefulset 的 pod 数改成 1，新的 pod-1' 被创建
4. 访问 pod-1'，它的内容和 pod-1 内容一样

### 通过 kubectl proxy 访问 pod

1. 创建 pod 时要声明 `containers[*].ports`
2. 启动 kubectl proxy
3. 在本地访问 pod 暴露的端口， `curl localhost:8001/api/v1/namespaces/default/pods/dev-6968fdb999-94ddx/proxy/ip`，如果pod 没有声明暴露的端口，默认会使用 80

## 问题

### 安装 flannel 插件失败

dev pod 在 k8s-node2 上，kubia-1 在 k8s-node2 上，kubia-2 在 k8s-node3 上。

dev pod 能够和 kubia-1 通信，无法和 kubia-2 通信。其他 pod 也是如此，跨节点的 pod 无法通信。

查看 `kube-flannel-ds` 的 pod 日志，发现了如下的报错:

```shell
E0121 01:40:13.395131       1 reflector.go:127] github.com/flannel-io/flannel/subnet/kube/kube.go:379: Failed to watch *v1.Node: failed to list *v1.Node: Get "https://10.96.0.1:443/api/v1/nodes?resourceVersion=4657": dial tcp 10.96.0.1:443: connect: network is unreachable
E0121 01:40:56.634458       1 reflector.go:127] github.com/flannel-io/flannel/subnet/kube/kube.go:379: Failed to watch *v1.Node: failed to list *v1.Node: Get "https://10.96.0.1:443/api/v1/nodes?resourceVersion=4657": dial tcp 10.96.0.1:443: connect: network is unreachable
```

搜索到了相关的 github issue，kubeadm 作者回复说建议换用其他的 CNI 插件 [链接](https://github.com/kubernetes/kubeadm/issues/1817#issuecomment-538311661)

参考阅读: https://www.91the.top/k8s/kubernetes-probelem.html

TODO: 安装完网络插件后，一定要看 pod 日志中是否有报错，此次安装完 flannel 之后，pod 都显示是 Running 状态，但 pod 日志中有连接超时的错误

### k8s 拉取镜像失败

```shell
  Type     Reason     Age               From               Message
  ----     ------     ----              ----               -------
  Normal   Scheduled  18s               default-scheduler  Successfully assigned default/dev-79d7bcddc6-q4rz7 to k8s-node2
  Warning  Failed     13s               kubelet            Failed to pull image "bwangel/dev:0.1": rpc error: code = Unknown desc = Error response from daemon: pull access denied for bwangel/dev, repository does not exist or may require 'docker login': denied: requested access to the resource is denied
  Warning  Failed     13s               kubelet            Error: ErrImagePull
  Normal   BackOff    13s               kubelet            Back-off pulling image "bwangel/dev:0.1"
  Warning  Failed     13s               kubelet            Error: ImagePullBackOff
  Normal   Pulling    1s (x2 over 18s)  kubelet            Pulling image "bwangel/dev:0.1"
```

### 创建 StatefulSet 服务

创建服务时，启动 pod 出现了如下的错误:

```shell
Events:
  Type     Reason                  Age                   From               Message
  ----     ------                  ----                  ----               -------
  Warning  FailedScheduling        3m16s                 default-scheduler  0/3 nodes are available: 3 pod has unbound immediate PersistentVolumeClaims.
  Normal   Scheduled               3m15s                 default-scheduler  Successfully assigned default/kubia-0 to k8s-node3
  Warning  FailedCreatePodSandBox  3m15s                 kubelet            Failed to create pod sandbox: rpc error: code = Unknown desc = [failed to set up sandbox container "96322b4278a93ee85612b031fdf02d00cee3cbfbb680aa7a62ac5e4a50a6966d" network for pod "kubia-0": networkPlugin cni failed to set up pod "kubia-0_default" network: unable to allocate IP address: Post "http://127.0.0.1:6784/ip/96322b4278a93ee85612b031fdf02d00cee3cbfbb680aa7a62ac5e4a50a6966d": dial tcp 127.0.0.1:6784: connect: connection refused, failed to clean up sandbox container "96322b4278a93ee85612b031fdf02d00cee3cbfbb680aa7a62ac5e4a50a6966d" network for pod "kubia-0": networkPlugin cni failed to teardown pod "kubia-0_default" network: Delete "http://127.0.0.1:6784/ip/96322b4278a93ee85612b031fdf02d00cee3cbfbb680aa7a62ac5e4a50a6966d": dial tcp 127.0.0.1:6784: connect: connection refused]
  Normal   SandboxChanged          10s (x15 over 3m14s)  kubelet            Pod sandbox changed, it will be killed and re-created.
```

解决方案:

1. 删掉了 weave CNI 插件
2. 重新安装 flannel 插件

安装 flannel 的命令:

1. 启动 master 节点: `sudo kubeadm init --apiserver-advertise-address 192.168.57.101 --pod-network-cidr=10.244.0.0/16`
2. 安装 flannel: `k apply -f conf/kube-flannel.yml` [kube-flannel.yml 文件内容](https://github.com/bwangelme/k8s-in-vagrant/blob/08fe5f9679ad14b52163faff7d503ccfa1c1ca1b/conf/kube-flannel.yml)


### k proxy 访问 pod 失败

使用 `k proxy` 启动代理服务后，使用 curl 访问 pod 超时

```shell
ø> curl -m3 -v localhost:8001/api/v1/namespaces/default/pods/kubia-0/proxy/                                   23:02:30 (01-19)
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 8001 (#0)
> GET /api/v1/namespaces/default/pods/kubia-0/proxy/ HTTP/1.1
> Host: localhost:8001
> User-Agent: curl/7.64.1
> Accept: */*
>
* Operation timed out after 3004 milliseconds with 0 bytes received
* Closing connection 0
curl: (28) Operation timed out after 3004 milliseconds with 0 bytes received
```

### 跨节点 Pod 无法互通

__表现__

1. 搭建完 calico 网络，跨节点pod 能够互通的
2. 过了一段时间后，网络不通。
3. `tigera-operator` 中的 Pod `tigera-operator-c4b9549c7-scvn22` 挂掉了,

设置了配置文件 `/etc/NetworkManager/conf.d/calico.conf`，并重启后恢复了，还不了解原因

查看信息

```shell
tigera-operator    tigera-operator-c4b9549c7-scvn2           0/1     CrashLoopBackOff   42 (3m6s ago)   11h   192.168.57.101   k8s-node1   <none>           <none>

ø> k -n tigera-operator logs tigera-operator-c4b9549c7-scvn2                                                  10:25:35 (01-23)
2022/01/23 02:22:01 [INFO] Version: v1.23.5
2022/01/23 02:22:01 [INFO] Go Version: go1.16.7b7
2022/01/23 02:22:01 [INFO] Go OS/Arch: linux/amd64
2022/01/23 02:22:01 [ERROR] Get "https://10.96.0.1:443/api?timeout=32s": dial tcp 10.96.0.1:443: connect: network is unreachable
```

4. dev pod 和 kubia-1 属于不通节点，dev ping kubia-1 超时。dev ping 同节点上的 kubia-0 可以成功
