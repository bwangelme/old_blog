---
title: "《K8S in Actions》 第五章学习笔记"
date: 2020-04-22T21:44:44+08:00
lastmod: 2020-04-22T21:44:44+08:00
draft: false
tags: [Kubernetes, 笔记]
author: "bwangel"
comment: true

---

> 服务：让客户端发现 Pod 并与之通信

<!--more-->
---

## 介绍服务

K8S 服务是一种 __为一组功能相同的 Pod 提供单一不变的接入点__ 的资源。

+ kubia-svc.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubia
spec:
  # 会话亲和性，即相同的客户端IP访问同一个 Pod
  sessionAffinity: ClientIP
  # 指定服务转发的端口
  ports:
    - port: 80
      name: http-default
      targetPort: http-default
    - port: 90
      name: http-mux1
      targetPort: http-mux1
  # 查找 Pod 的标签，注意 svc 不会自动创建 Pod，需要先通过 ReplicaSet 创建好 Pod
  selector:
    app: kubia
```

```sh
# 创建服务
ø> kubectl create -f kubia-svc.yaml
service/kuia created

# 查看我们刚刚创建的服务
ø> kubectl get svc
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)         AGE
kubia        ClusterIP   10.66.13.240   <none>        80/TCP,90/TCP   8m48s

# 到某个 Pod 上执行 curl 命令，访问服务的集群内部端口
ø> kubectl exec kubia-zhg6k -- curl -s 10.66.13.240:80
You\'ve hit kubia-4bv25 on default mux
ø> kubectl exec kubia-zhg6k -- curl -s 10.66.13.240:90
You\'ve hit kubia-7sd67 on mux1

# 注意，服务的IP是虚拟IP，是 ping 不通的
ø> kubectl exec -it kubia-zhg6k bash
root@kubia-zhg6k:/app# ping 10.66.13.240
PING 10.66.13.240 (10.66.13.240) 56(84) bytes of data.
^C
--- 10.66.13.240 ping statistics ---
8 packets transmitted, 0 received, 100% packet loss, time 205ms
```

### 通过环境变量发现服务

在 Pod 开始运行的时候，K8S 会初始化一系列的环境变指向现在存在的服务。(故 Pod 要在服务之后创建才能够看到这些环境变量)

```sh
# 当前集群中存在着两个服务
ø> kubectl get svc
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)         AGE
kubernetes   ClusterIP   10.66.0.1      <none>        443/TCP         31d
kubia        ClusterIP   10.66.13.240   <none>        80/TCP,90/TCP   9h

ø> kubectl exec kubia-zhg6k -- env
# KUBIA 服务的环境变量
KUBIA_SERVICE_HOST=10.66.13.240
KUBIA_SERVICE_PORT=80
KUBIA_PORT_80_TCP_PROTO=tcp
KUBIA_PORT_80_TCP_ADDR=10.66.13.240
KUBIA_SERVICE_PORT_HTTP_DEFAULT=80
KUBIA_PORT=tcp://10.66.13.240:80
KUBIA_PORT_90_TCP=tcp://10.66.13.240:90
KUBIA_PORT_90_TCP_PORT=90
KUBIA_SERVICE_PORT_HTTP_MUX1=90
KUBIA_PORT_80_TCP=tcp://10.66.13.240:80
KUBIA_PORT_80_TCP_PORT=80
KUBIA_PORT_90_TCP_PROTO=tcp
KUBIA_PORT_90_TCP_ADDR=10.66.13.240

# Kubenetes 服务的环境变量
KUBERNETES_SERVICE_PORT_HTTPS=443
KUBERNETES_SERVICE_HOST=10.66.0.1
KUBERNETES_PORT_443_TCP=tcp://10.66.0.1:443
KUBERNETES_PORT_443_TCP_ADDR=10.66.0.1
KUBERNETES_SERVICE_PORT=443
KUBERNETES_PORT=tcp://10.66.0.1:443
KUBERNETES_PORT_443_TCP_PROTO=tcp
KUBERNETES_PORT_443_TCP_PORT=443
```

### 通过 DNS 发现服务

```sh
# 在 kube-system 命名空间中存在着提供 DNS 服务的 Pod
ø> kcd kube-system
Context "gke_braided-turbine-271114_asia-east1-c_demo" modified.
ø> kubectl get pod
NAME                                             READY   STATUS    RESTARTS   AGE
kube-dns-5f886bf8d8-ddzjb                        4/4     Running   0          24d
kube-dns-5f886bf8d8-pnrts                        4/4     Running   0          26d
kube-dns-autoscaler-8687c64fc-qknwj              1/1     Running   0          24d
...

# 所有 Pod 都默认使用了集群中的 DNS 服务器
ø> kubectl exec -it kubia-zhg6k bash
root@kubia-zhg6k:/app# cat /etc/resolv.conf
nameserver 10.66.0.10
search default.svc.cluster.local svc.cluster.local cluster.local asia-east1-c.c.braided-turbine-271114.internal c.braided-turbine-271114.internal google.internal
options ndots:5
```

集群中的任何一个节点可以通过 全限定域名(FQDN) 来访问服务，它的格式如下:

```sh
kubia.default.svc.cluster.local
{服务名称}.{命名空间}.{集群域后缀}

# 集群域后缀可以省略，命名空间是默认的话也可以省略
```

```sh
# 在任意一个节点上通过 FQDN 访问服务
root@kubia-zhg6k:/app# curl kubia.default.svc.cluster.local:$KUBIA_SERVICE_PORT_HTTP_MUX1
You've hit kubia-4bv25 on mux1
root@kubia-zhg6k:/app# curl kubia.default:$KUBIA_SERVICE_PORT_HTTP_MUX1
You got it on mux1, 5.
root@kubia-zhg6k:/app# curl kubia:$KUBIA_SERVICE_PORT_HTTP_MUX1
You got it on mux1, 6.
```

## 连接集群外部的服务

Endpoints 是一种介于服务和 Pod 之间的资源，它是一个存储服务的转发 IP 及端口的列表。它和对应的服务同名。

```sh
# 查看某个服务的 Endpoints 资源
ø> kubectl describe svc kubia
Name:              kubia
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=kubia
Type:              ClusterIP
IP:                10.66.13.240

Port:              http-default  80/TCP
TargetPort:        http-default/TCP
Endpoints:         10.0.1.23:8080,10.0.2.13:8080,10.0.2.14:8080

Port:              http-mux1  90/TCP
TargetPort:        http-mux1/TCP
Endpoints:         10.0.1.23:8090,10.0.2.13:8090,10.0.2.14:8090

Session Affinity:  ClientIP
Events:            <none>

# 查看 endpoints 的具体信息
ø> kubectl get endpoints kubia
NAME    ENDPOINTS                                                  AGE
kubia   10.0.1.23:8080,10.0.2.13:8080,10.0.2.14:8080 + 3 more...   2d
ø> kubectl describe endpoints kubia
Name:         kubia
Namespace:    default
Labels:       <none>
Annotations:  <none>
Subsets:
  Addresses:          10.0.1.23,10.0.2.13,10.0.2.14
  NotReadyAddresses:  <none>
  Ports:
    Name          Port  Protocol
    ----          ----  --------
    http-default  8080  TCP
    http-mux1     8090  TCP

Events:  <none>
```

### 创建一个重定向到外部地址的服务

+ external-service.yaml

```yaml
# 这个文件只创建了一个服务，但是没有定义选择器，也就没有创建对应的 Endpoint 资源
apiVersion: v1
kind: Service
metadata:
  name: external-service
spec:
  ports:
    - port: 80
```


创建 external-service 的 Endpoints 资源，它指向了两个外部的 IP 地址

+ external-service-endpoints.yaml

```yaml
apiVersion: v1
kind: Endpoints
metadata:
  # 注意要和绑定的目标服务的名称相同
  name: external-service
subsets:
  - addresses:
    - ip: 13.250.94.254
    - ip: 13.229.188.59
    ports:
      - port: 80
```

测试:

```sh
# 客户端访问 external-service 服务会重定向到外部服务上
ø> kubectl exec -it kubia-zhg6k bash
root@kubia-zhg6k:/app# curl -v 10.66.10.171
* Expire in 0 ms for 6 (transfer 0x55b86f259f50)
*   Trying 10.66.10.171...
* TCP_NODELAY set
* Expire in 200 ms for 4 (transfer 0x55b86f259f50)
* Connected to 10.66.10.171 (10.66.10.171) port 80 (#0)
> GET / HTTP/1.1
> Host: 10.66.10.171
> User-Agent: curl/7.64.0
> Accept: */*
>
< HTTP/1.1 301 Moved Permanently
< Content-length: 0
< Location: https://10.66.10.171/
<
* Connection #0 to host 10.66.10.171 left intact
```

### 为外部服务创建别名

+ external-service-externalname.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-service-externalname
spec:
  type: ExternalName  # 外部服务的别名服务需要制定类型为 ExternalName
  externalName: httpbin.org
  ports:
    - port: 80
```

测试:

```sh
# 在集群内部可以通过 FQDN 来访问该服务
ø> kubectl exec -it kubia-zhg6k bash
root@kubia-zhg6k:/app# curl external-service-externalname/get
{
  "args": {},
  "headers": {
    "Accept": "*/*",
    "Host": "external-service-externalname",
    "User-Agent": "curl/7.64.0",
    "X-Amzn-Trace-Id": "Root=1-5ea85513-abbb4098869550459c9a0934"
  },
  "origin": "35.229.134.91",
  "url": "http://external-service-externalname/get"
}
root@kubia-zhg6k:/app# curl external-service-externalname.default.svc.cluster.local/get
{
  "args": {},
  "headers": {
    "Accept": "*/*",
    "Host": "external-service-externalname.default.svc.cluster.local",
    "User-Agent": "curl/7.64.0",
    "X-Amzn-Trace-Id": "Root=1-5ea8551c-a7ebbeae3b50c9b6c66240c9"
  },
  "origin": "35.229.134.91",
  "url": "http://external-service-externalname.default.svc.cluster.local/get"
}
```

`ExternalName` 服务仅在 DNS 级别实施，它仅为服务创建了简单的 CNAME DNS 记录。因此链接到该服务的客户端将直接连接到外部服务，完全绕过服务代理。出于这个原因，`ExternalName` 类型的服务甚至不会获得集群 IP。

## 将服务暴露给外部客户端

### 通过 NodePort 类型的服务向外暴露

通过创建 NodePort 服务，可以让 Kubernetes 在其所有 __节点__ 上保留一个端口(所有节点都使用相同的端口号)，将传入的连接转发给作为服务部分的 Pod。

### 创建 & 使用 NodePort 类型的服务

```sh
# 配置 GCK 的防火墙规则，允许外部网络访问 30123 端口
ø> gcloud compute firewall-rules create kubia-svc-rule --allow=tcp:30123
Creating firewall...⠧Created [https://www.googleapis.com/compute/v1/projects/braided-turbine-271114/global/firewalls/kubia-svc-rule].
Creating firewall...done.
NAME            NETWORK  DIRECTION  PRIORITY  ALLOW      DENY  DISABLED
kubia-svc-rule  default  INGRESS    1000      tcp:30123        False
```

+ kubia-svc-nodeport.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubia-nodeport
spec:
  type: NodePort
  ports:
    - port: 80 # 通过集群内部IP访问的端口
      targetPort: 8080  # 转发的背后 Pod 服务的端口
      nodePort: 30123 # 集群节点可访问的端口
  selector:
    app: kubia
```

```sh
# 创建 NodePort 服务
ø> kubectl create -f kubia-svc-nodeport.yaml
service/kubia-nodeport created
ø> kubectl get svc kubia-nodeport
NAME             TYPE       CLUSTER-IP   EXTERNAL-IP   PORT(S)        AGE
kubia-nodeport   NodePort   10.66.5.6    <none>        80:30123/TCP   9m39s

# 获得所有节点的 IP 地址
ø> kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="ExternalIP")].address}' | tr ' ' '\n'
35.234.11.33
35.234.27.130
35.229.134.91

# 通过节点访问 NodePort 服务
ø> curl 35.229.134.91:30123
You got it on default mux, 9.

# 通过集群内部IP访问 NodePort 服务
ø> kubectl exec -it kubia-zhg6k bash
root@kubia-zhg6k:/app# curl 10.66.5.6:80
You got it on default mux, 10.
```

+ [JSON Path 的文档](https://kubernetes.io/zh/docs/reference/kubectl/jsonpath/)