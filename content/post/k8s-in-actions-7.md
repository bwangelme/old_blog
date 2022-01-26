---
title: "《K8s in Actions》第七章学习笔记"
date: 2021-01-08T07:51:51+08:00
lastmod: 2021-01-08T07:51:51+08:00
draft: false
tags: [kubernetes, 杂记]
author: "bwangel"
comment: true

---

> ConfigMap 和 Secret 配置应用程序
<!--more-->

---

## 配置容器化应用程序

配置应用程序的方法:

1. 向容器传递命令行参数
2. 为每个容器设置自定义的环境变量
3. 通过特殊类型的卷将配置文件挂载到容器中

## 向容器传递命令行参数

+ ENTRYPOINT 定义容器启动时被调用的可执行程序
+ CMD 指定传递给 ENTRYPOINT 的参数

shell 形式与 exec 形式的主要区别是命令是否在 shell 中调用。

+ shell 形式: `ENTRYPOINT node app.js`
+ exec 形式: `ENTRYPOINT ["node", "app.js"]`

```sh
# 使用默认的命令行参数
ø> docker run -it bwangel/fortune:args
Configured to generate new fortune every 10 seconds
Sat Feb 13 01:54:01 UTC 2021 Writing fortune to /var/htdocs/index.html
Sat Feb 13 01:54:11 UTC 2021 Writing fortune to /var/htdocs/index.html
^C

# 传递命令行参数给容器，覆盖默认的值
ø> docker run -it bwangel/fortune:args 5
Configured to generate new fortune every 5 seconds
Sat Feb 13 01:54:23 UTC 2021 Writing fortune to /var/htdocs/index.html
Sat Feb 13 01:54:28 UTC 2021 Writing fortune to /var/htdocs/index.html
Sat Feb 13 01:54:33 UTC 2021 Writing fortune to /var/htdocs/index.html
Sat Feb 13 01:54:38 UTC 2021 Writing fortune to /var/htdocs/index.html
^C
```

k8s 配置中的 `cmd` 和 `args` 选项可以覆盖镜像的 `entrypoint` 和 `cmd` 设置。

注意: 字符串值无需使用引号包裹，数值需要。

```yaml
args:
- foo
- bar
- "15"
```

## 为容器设置环境变量

环境变量被设置在 pod 的容器定义中，并非是 pod 级别。k8s 在 pod 中会自动暴露相同命名空间下 Service 的环境变量。所以环境变量可以被看作是注入的配置。

环境变量的定义中可以使用 `$(SOME_ENV)` 的形式引用其他环境变量，同样，cmd 和 args 的配置也可以引用其他环境变量。

## 利用 ConfigMap 解偶配置

configmap 是一个键值对的表，不同的命名空间下可以有同名的 configmap，通过这种方式将配置和 pod 定义分离开来。

创建 configmap 的多种来源以及最终存储的值:

```sh
k create configmap my-config --from-file=foo.json --from-file=bar=foobar.conf --from-file=config-opts/ --from-literal=some=thing
```

![](https://passage-1253400711.cos.ap-beijing.myqcloud.com//2021-02-13-112953.png)

如果创建的 Pod 中引用的 configMap 不存在，那么引用 configmap 的容器会启动失败，其他容器能够正常启动。
如果被引用的 configmap 后续又被正常创建了，那么失败的容器后面又可以重新成功运行。

__注意:__

`envFrom` 可以将 configmap 中的配置项设置为环境变量，如果配置项的名称不是一个合法的环境变量名(数字字母+下划线)，那么这个环境变量在创建时就会被自动忽略，且不会发出任何事件通知。

+ 从本地文件创建 configmap

```sh
# configmap-files 是本地的一个文件夹
ø> k create configmap fortune-config --from-file=configmap-files
configmap/fortune-config created
```

+ 检查创建的 configmap 的配置项

```sh
ø> k get configmap fortune-config -o=yaml
apiVersion: v1
# 注意，配置项中的管道符号`|`表示配置项的值是一个多行字面量
data:
  my-nginx-config.conf: |
    server {
        listen 80;
        server_name kubia.example.com;

        gzip on;
        gzip_types text/plain application/xml;

        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
        }
    }
  sleep-interval: |
    25
kind: ConfigMap
metadata:
  creationTimestamp: "2021-02-14T07:09:19Z"
  name: fortune-config
  namespace: default
  resourceVersion: "15400246"
  selfLink: /api/v1/namespaces/default/configmaps/fortune-config
  uid: a0925cca-bf39-4e67-9cd9-c5a6ea1eae83
```

+ 配置卷是通过挂载的方式加入到容器上的，挂载某一文件夹会隐藏该文件夹中已存在的文件。


mountPath 和 subPath 选项可以指定只挂载文件，而不挂载整个文件夹，这样容器的文件夹就不会覆盖了。

```yaml
spec:
  containers:
  - image: some/image
    volumeMounts:
    - name: myvolume
      # 只挂载某个文件，而不是挂载一个文件夹
      mountPath: /etc/someconfig.conf
      subPath: myconfig.conf
```

+ 更新配置且不重启容器

```sh
# edit 命令可以修改 configmap 中的配置文件
ø> k edit configmap fortune-config
configmap/fortune-config edited

# 修改完配置后，再通知 nginx 重启应用
ø> k exec -it -c web-server fortune-configmap-volume -- nginx -s reload
2021/02/16 03:39:49 [notice] 43#43: signal process started

# 这样我们就达到了不重启容器更新配置的目的
```

__注意__: configmap 更新时，不同的容器同步配置文件的时间是不同的，因此有可能出现容器间配置文件不一致的情况。


我们可以看到，被挂载的文件链接到了 `..data` 文件夹中，而 `..data` 文件夹又是一个软连接。

k8s 在更新文件的时候，会先创建好新的文件，再修改 `..data` 的链接，这样就达到了一次性更新所有文件的目的。

```sh
ø> k exec -it -c web-server fortune-configmap-volume -- ls -lA /etc/nginx/conf.d/               11:42:58 (02-16)
total 4
drwxr-xr-x    2 root     root          4096 Feb 16 03:39 ..2021_02_16_03_39_25.637552423
lrwxrwxrwx    1 root     root            31 Feb 16 03:39 ..data -> ..2021_02_16_03_39_25.637552423
lrwxrwxrwx    1 root     root            16 Feb 16 03:30 gzip.conf -> ..data/gzip.conf
```

## 使用 Secret 给容器传递敏感数据

Secret 是一种类似与 Configmap 的资源，它存储的也是键值对的映射，它支持:

1. 将 Secret 条目作为环境变量传递给容器
2. 将 Secret 条目暴露为卷中的文件

同时，为了保证 Secret 的安全性，k8s 仅仅将 Secret 分发到需要访问 Secret 的 pod 的所在节点上，同时，Secert 只会写到节点的内存上，不会写到物理存储上。

