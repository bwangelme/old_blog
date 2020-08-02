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

### 通过负载均衡器将服务暴露出来

在云提供商上运行的 Kubernetes 集群通常支持从云基础架构自动提供负载均衡器。通过指定类型为 `LoadBalancer`，就可以创建一个负载均衡器。
它通常拥有自己独一无二的可公开访问的IP地址，并将所有的连接重定向到服务，可以通过负载均衡器的公开IP地址访问服务。

LoadBalancer 类型的服务是一个具有额外的基础设施提供的负载均衡器 NodePort 服务。使用 `kubectl explain` 可以看到该服务选择的 `NodePort` 端口。

+ kubia-svc-loadbalancer.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubia-loadbalancer
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: kubia
```

```sh
# 创建 loadbalancer 服务
ø> kubectl create -f kubia-svc-loadbalancer.yaml
service/kubia-loadbalancer created

# 查看创建的 lb 服务，External-IP 要等一会才会出现
ø> kubectl get svc kubia-loadbalancer
NAME                 TYPE           CLUSTER-IP    EXTERNAL-IP     PORT(S)        AGE
kubia-loadbalancer   LoadBalancer   10.66.4.173   35.221.253.22   80:32179/TCP   47s
# External-IP 可以访问
ø> ping 35.221.253.22
PING 35.221.253.22 (35.221.253.22): 56 data bytes
64 bytes from 35.221.253.22: icmp_seq=0 ttl=102 time=166.876 ms
64 bytes from 35.221.253.22: icmp_seq=1 ttl=102 time=173.021 ms
^C
--- 35.221.253.22 ping statistics ---
2 packets transmitted, 2 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 166.876/169.948/173.021/3.072 ms

# 访问 External-IP 的 80 端口
ø> http 35.221.253.22
HTTP/1.1 200 OK
Content-Length: 38
Content-Type: text/plain; charset=utf-8
Date: Mon, 20 Jul 2020 23:30:33 GMT

You\'ve hit kubia-6wjvz on default mux

# 查看负载均衡器的信息
ø> kubectl describe svc kubia-loadbalancer
Name:                     kubia-loadbalancer
Namespace:                default
Labels:                   <none>
Annotations:              <none>
Selector:                 app=kubia
Type:                     LoadBalancer
IP:                       10.66.4.173
LoadBalancer Ingress:     35.221.253.22
Port:                     <unset>  80/TCP
TargetPort:               8080/TCP
# 选择了 32179 作为节点端口
NodePort:                 <unset>  32179/TCP
Endpoints:                10.0.0.2:8080,10.0.0.3:8080,10.0.0.6:8080
Session Affinity:         None
External Traffic Policy:  Cluster
Events:
  Type    Reason                Age   From                Message
  ----    ------                ----  ----                -------
  Normal  EnsuringLoadBalancer  15m   service-controller  Ensuring load balancer
  Normal  EnsuredLoadBalancer   15m   service-controller  Ensured load balancer
```


## 通过 Ingress 暴露服务

每个 LoadBalancer 服务都需要自己的负载均衡器，以及独有的公有 IP 地址，而 Ingress 只需要一个公网 IP 就能为许多服务提供访问。

Ingress 控制器不会将请求转发给 Endpoint 服务器，只是通过 EndPoints 服务来选择一个 Pod 的IP，并且将请求转发给 Pod。


### 创建 Ingress 服务

+ kubia-ingress.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: kubia
spec:
  rules:
    - host: kubia.example.com
      http:
        paths:
          - path: /
            backend:
              serviceName: kubia-nodeport
              servicePort: 80
```

```sh
ø> kubectl create -f kubia-ingress.yaml
ingress.extensions/kubia created

# 查看 Ingress 对外暴露的 IP 地址
ø> kubectl get ingress
NAME    HOSTS               ADDRESS        PORTS   AGE
kubia   kubia.example.com   35.227.198.7   80      74s

# 在本地设置好 hosts 后，通过域名访问服务
echo '35.227.198.7 kubia.example.com' >> /etc/hosts

ø> http kubia.example.com
HTTP/1.1 200 OK
Content-Length: 44
Content-Type: text/plain; charset=utf-8
Date: Wed, 29 Jul 2020 01:25:25 GMT
Via: 1.1 google

You've hit kubia-zssz2 on default mux by 15
```

注意，通过域名访问的时候，服务如果返回500的话，会使用 Ingress 自定义的错误页面，无法看到服务返回的 500 页面。

```sh
# 服务返回500的情况
ø> http kubia.example.com
HTTP/1.1 502 Bad Gateway
Content-Length: 332
Content-Type: text/html; charset=UTF-8
Date: Tue, 28 Jul 2020 15:10:53 GMT
Referrer-Policy: no-referrer

<html><head>
<meta http-equiv="content-type" content="text/html;charset=utf-8">
<title>502 Server Error</title>
</head>
<body text=#000000 bgcolor=#ffffff>
<h1>Error: Server Error</h1>
<h2>The server encountered a temporary error and could not complete your request.<p>Please try again in 30 seconds.</h2>
<h2></h2>
</body></html>
```

### 配置 Ingress 处理 TLS 传输

创建好证书和秘钥后，存储到 Secert 资源中

```sh
# 创建 RSA 秘钥
ø> openssl genrsa -out tls.key 2048
Generating RSA private key, 2048 bit long modulus
...............................................................+++
....+++
e is 65537 (0x10001)

# 创建证书
ø> openssl req -new -x509 -sha256 -key tls.key  -out tls.cert -days 3650 -subj /CN=kubia.example.com
ø> ls
tls.cert tls.key

# 创建 Secret 资源
ø> k create secret tls tls-secret --cert=tls.cert --key=tls.key
secret/tls-secret created
```

更新 Ingress 的配置，使用 Secret 配置 HTTPS

+ kubia-ingress-tls.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: kubia
spec:
  tls:
    - hosts:
      - kubia.example.com
      secretName: tls-secret
  rules:
    - host: kubia.example.com
      http:
        paths:
          - path: /
            backend:
              serviceName: kubia-nodeport
              servicePort: 80
```


```sh
# 更新 ingress 配置
ø> kubectl apply -f kubia-ingress-tls.yaml
Warning: kubectl apply should be used on resource created by either kubectl create --save-config or kubectl apply
ingress.extensions/kubia configured


# 访问我们配置的域名，查看其证书
ø> curl -k -v https://kubia.example.com/
*   Trying 35.227.198.7...
* TCP_NODELAY set
* Connected to kubia.example.com (35.227.198.7) port 443 (#0)
* ALPN, offering h2
* ALPN, offering http/1.1
* successfully set certificate verify locations:
*   CAfile: /etc/ssl/cert.pem
  CApath: none
* TLSv1.2 (OUT), TLS handshake, Client hello (1):
* TLSv1.2 (IN), TLS handshake, Server hello (2):
* TLSv1.2 (IN), TLS handshake, Certificate (11):
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
* TLSv1.2 (IN), TLS handshake, Server finished (14):
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (OUT), TLS handshake, Finished (20):
* TLSv1.2 (IN), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-RSA-CHACHA20-POLY1305
* ALPN, server accepted to use h2
* Server certificate:
# 可以看到 CN 正是我们在创建时声明的CN配置
*  subject: CN=kubia.example.com
*  start date: Jul 30 15:08:40 2020 GMT
*  expire date: Jul 28 15:08:40 2030 GMT
*  issuer: CN=kubia.example.com
*  SSL certificate verify result: self signed certificate (18), continuing anyway.
* Using HTTP2, server supports multi-use
* Connection state changed (HTTP/2 confirmed)
* Copying HTTP/2 data in stream buffer to connection buffer after upgrade: len=0
* Using Stream ID: 1 (easy handle 0x7f869c80fc00)
> GET / HTTP/2
> Host: kubia.example.com
> User-Agent: curl/7.64.1
> Accept: */*
>
* Connection state changed (MAX_CONCURRENT_STREAMS == 100)!
< HTTP/2 200
< date: Thu, 30 Jul 2020 15:17:17 GMT
< content-length: 46
< content-type: text/plain; charset=utf-8
< via: 1.1 google
< alt-svc: clear
<
You\'ve hit kubia-zssz2 on default mux by 8026
* Connection #0 to host kubia.example.com left intact
* Closing connection 0
```

## Pod 就绪后发出信号

就绪探测器会定期调用，并确定特定的 pod 是否接收客户端请求。当容器的准备就绪探测返回成功时，表示容器已经准备好接收请求。如果容器报告它未准备就绪，则会从该服务中删除该 Pod。如果 Pod 再次准备就绪，则重新添加 Pod。

像存活探针一样，就绪探针有三种类型:

1. Exec 探针，执行一个进程，容器的状态由命令的退出状态码确定
2. HTTP GET 探针，向容器发送 HTTP GET 请求，通过响应的 HTTP 状态代码判断容器是否准备好。
3. TCP socket 探针，它打开一个 TCP 连接到容器的指定端口。如果连接已经建立，则认为容器已经准备就绪。

与存活探针不同，如果容器未通过准备检查，则不会被终止或重新启动。这是存活探针与就绪探针之间的重要区别。

+ 实验:

```sh
# 编辑 rs 的配置文件中 pod 模板的部分，加入就绪探针
# 这个就绪探针是一个 exec 类型，检测某个文件是否存在
TODO

# 删除已有的 Pod
ø> kubectl delete pod kubia-bp5xc
pod "kubia-bp5xc" deleted
ø> kubectl delete pod kubia-tt8rl
pod "kubia-tt8rl" deleted
ø> kubectl delete pod kubia-zssz2
pod "kubia-zssz2" deleted

# 查看现在的 Pod，发现都没有处于就绪状态
ø> kubectl get pods --show-labels
NAME          READY   STATUS    RESTARTS   AGE   LABELS
kubia-m7xnj   0/1     Running   0          80s   app=kubia
kubia-qsrhr   0/1     Running   0          41s   app=kubia
kubia-wpk4k   0/1     Running   0          46s   app=kubia

# 令一个 Pod 处于就绪状态
ø> kubectl exec kubia-wpk4k -- touch /var/ready

# 通过 nodeport 暴露的端口访问，发现所有的流量都走到了 kubia-wpk4k 这个 Pod 上
ø> curl 34.80.233.40:30123
You ve hit kubia-wpk4k on default mux by 65
ø> curl 34.80.233.40:30123
You ve hit kubia-wpk4k on default mux by 66
ø> curl 34.80.233.40:30123
You ve hit kubia-wpk4k on default mux by 67
ø> curl 34.80.233.40:30123
You ve hit kubia-wpk4k on default mux by 77
ø> curl 34.80.233.40:30123
You ve hit kubia-wpk4k on default mux by 78
ø> curl 34.80.233.40:30123
You ve hit kubia-wpk4k on default mux by 79
ø> curl 34.80.233.40:30123
You ve hit kubia-wpk4k on default mux by 80

# 通过 describe 查看日志，可以看到就绪指针的相关日志
ø> kubectl describe pod kubia-m7xnj
Name:           kubia-m7xnj
Namespace:      default
Priority:       0
...
Events:
  Type     Reason     Age                 From                                          Message
  ----     ------     ----                ----                                          -------
  Normal   Scheduled  11m                 default-scheduler                             Successfully assigned default/kubia-m7xnj to gke-demo-default-pool-ade08258-zjhd
  Normal   Pulled     11m                 kubelet, gke-demo-default-pool-ade08258-zjhd  Container image "bwangel/kubia:v0.4" already present on machine
  Normal   Created    11m                 kubelet, gke-demo-default-pool-ade08258-zjhd  Created container kubia
  Normal   Started    11m                 kubelet, gke-demo-default-pool-ade08258-zjhd  Started container kubia
  Warning  Unhealthy  98s (x61 over 11m)  kubelet, gke-demo-default-pool-ade08258-zjhd  Readiness probe failed: ls: cannot access '/var/ready': No such file or directory
```

+ 注意事项:

1. 应该始终定义就绪指针，针对一些启动时间长的应用，如果没有就绪指针，会让客户端请求到达时报错。
2. 就绪指针不需要关注删除容器的情况，如果删除了 Pod，K8S 会自动将其从服务中移除，不需要通过就绪指针来标记移除。

## 使用 headless 服务来发现独立的 Pod

在创建服务时，声明 `spec.ClusterInfo: None` 就可以设置一个服务为 headless 服务。

当通过 DNS 查询 FQDN 时，常规服务返回的是服务的集群IP，headless 服务返回的是 Pod IP。

headless 也会提供跨 Pod 的负载均衡，但是是通过 DNS 的轮询机制实现的，而不是像常规服务那样通过服务代理实现的。

+ kubia.svc-headless.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubia-headless
spec:
  clusterIP: None
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: kubia
```

```sh
# 创建 headless 服务
ø> kubectl create -f kubia-svc-headless.yaml
service/kubia-headless created

# 查看 headless 服务的信息，发现没有 ClusterIP
ø> kubectl get service
NAME                            TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)         AGE
external-service                ClusterIP      10.66.10.171   <none>          80/TCP          95d
external-service-externalname   ExternalName   <none>         httpbin.org     80/TCP          95d
kubernetes                      ClusterIP      10.66.0.1      <none>          443/TCP         128d
kubia                           ClusterIP      10.66.13.240   <none>          80/TCP,90/TCP   97d
kubia-headless                  ClusterIP      None           <none>          80/TCP          11s
kubia-loadbalancer              LoadBalancer   10.66.4.173    35.221.253.22   80:32179/TCP    12d
kubia-nodeport                  NodePort       10.66.5.6      <none>          80:30123/TCP    94d

ø> kubectl describe service kubia-headless
Name:              kubia-headless
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=kubia
Type:              ClusterIP
IP:                None
Port:              <unset>  80/TCP
TargetPort:        8080/TCP
Endpoints:         10.0.0.8:8080
Session Affinity:  None
Events:            <none>
```

### 通过 DNS 查找 Pod 的 IP

```sh
# 创建一个可以执行 DNS 查找命令的临时 Pod
ø> kubectl run dnsutils --image=tutum/dnsutils --generator=run-pod/v1 --command -- sleep infinity
pod/dnsutils created

# 查看 kubia ReplicaSet，可以看到只有两个 Pod 就绪
ø> kubectl get rs
NAME    DESIRED   CURRENT   READY   AGE
kubia   3         3         2       97d

# 执行 DNS 查找
ø> kubectl exec dnsutils nslookup kubia-headless
Server:         10.66.0.10
Address:        10.66.0.10#53

# 这里只返回了两个 Pod IP，因为 selector="app=kubia" 的 Pod 只有两个就绪了。
Name:   kubia-headless.default.svc.cluster.local
Address: 10.0.0.8
Name:   kubia-headless.default.svc.cluster.local
Address: 10.0.2.5

# 查找常规服务的 DNS，可以看到返回的是服务的集群IP
ø> kubectl exec dnsutils nslookup kubia
Server:         10.66.0.10
Address:        10.66.0.10#53

Name:   kubia.default.svc.cluster.local
Address: 10.66.13.240
```

### 发现所有 Pod，包括未就绪 Pod

在 K8S 1.17 版本中，在创建 headless 服务中添加`publishNotReadyAddresses`配置，就可以让 DNS 服务器查找到对应 headless 服务的未就绪 Pod。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubia-headless
spec:
  ...
  publishNotReadyAddresses: true
  ...
```

```sh
# app=kubia 中就绪的 Pod 还是只有两个
ø> kubectl get rs
NAME    DESIRED   CURRENT   READY   AGE
kubia   3         3         2       97d

ø> kubectl exec dnsutils nslookup kubia-headless
Server:         10.66.0.10
Address:        10.66.0.10#53

# 可以看到此时所有 Pod 的 IP 全部返回了
Name:   kubia-headless.default.svc.cluster.local
Address: 10.0.0.8
Name:   kubia-headless.default.svc.cluster.local
Address: 10.0.2.4
Name:   kubia-headless.default.svc.cluster.local
Address: 10.0.2.5
```

[publishNotReadyAddresses 的参考文档](https://v1-17.docs.kubernetes.io/docs/reference/generated/kubernetes-api/v1.17/)

## 排除服务故障

```sh
# 查看 pod 的 IP
ø> kubectl get pods -o jsonpath="{range .items[*]}{.metadata.name}--{.status.podIP} {end}" | tr ' ' '\n'
dnsutils--10.0.0.9
kubia-m7xnj--10.0.2.4
kubia-qsrhr--10.0.2.5
kubia-wpk4k--10.0.0.8

# 查看所有服务的集群IP
ø> kubectl get svc
NAME                            TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)         AGE
...
kubia                           ClusterIP      10.66.13.240   <none>          80/TCP,90/TCP   97d
# headless 服务是没有集群IP的
kubia-headless                  ClusterIP      None           <none>          80/TCP          44m
kubia-loadbalancer              LoadBalancer   10.66.4.173    35.221.253.22   80:32179/TCP    12d
...

# 在集群内 ping 服务的集群IP，发现是 ping 不通的
ø> kubectl exec -it kubia-wpk4k bash                                                                       11:17:47 (08-02)
root@kubia-wpk4k:/app# ping 10.66.13.240
PING 10.66.13.240 (10.66.13.240) 56(84) bytes of data.
^C
--- 10.66.13.240 ping statistics ---
6 packets transmitted, 0 received, 100% packet loss, time 116ms
```

如何排除服务故障:

1. 确保从集群内连接到服务的集群IP，而不是从外部 (k get svc 可以获得服务的集群IP)
2. 不要通过 ping 服务 IP 来判断服务是否可以访问( __请记住，服务的集群IP是虚拟IP，是无法 ping 通的__ )
3. 如果已经定义了就绪探针，请确保它返回成功；否则该 Pod 不会成为服务的一部分
4. 要确认某个容器是服务的一部分，请使用 `k get endpoints` 来检查服务对应的 endpoints 中存储有该 Pod 的IP及端口。
5. 如果尝试通过 FQDN 或其中一部分来访问服务（例如，`myservice.mynamespace.svc.cluster.local` 或 `myservice.mynamespace`），但并不起作用，请查看是否可以通过其集群IP而不是 FQDN 来访问服务。
6. 检查是否连接到服务公开的端口，而不是目标端口。
7. 尝试直接连接到 Pod IP 以确认 pod 正在接收正确端口上的连接。
8. 如果甚至无法通过 pod 的 IP 访问应用，请确保应用不是仅绑定到 localhost。
