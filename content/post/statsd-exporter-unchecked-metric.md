---
title: "Statsd Exporter 如何跳过 prom 的指标检查"
date: 2023-06-01T07:29:34+08:00
lastmod: 2023-06-01T07:29:34+08:00
draft: false
tags: [prometheus, go]
author: "bwangel"
comment: true

---

<!--more-->
---

## statsd exporter 中构造一些特殊的指标

statsd exporter 是 prometheus 官方提供的，将 statsd 指标转换成 prom 指标的 exporter。

statsd exporter 中，可以创建名字相同但 label 不同的同名指标。例如下面的这种序列，

```
qae_app_request_latencies_count{app="mrpink",role="web",task="default"} 1
qae_app_request_latencies_count{app="mrpink",itf="count_by_item",role="service",service_type="thrift",task="ThriftSvcInstance"} 1
```

我们用个简单例子来说明一下:

### 准备 statsd exporter 的配置文件

+ exporter_config.yaml

```yaml
defaults:
  # 所有指标使用 glob 匹配的模式
  match_type: glob
  glob_disable_ordering: false
  ttl: 5m #

mappings:
- match: "qae.*.web.*.req_time"
  name: "qae_app_request_latencies"
  match_metric_type: timer
  timer_type: histogram
  labels:
      app: "$1"
      role: "web"
      task: "$2"

# labels 中的 $1, $2 等是从 match 中捕获的匹配组
- match: "qae.*.service.*.*.*.req_time"
  name: "qae_app_request_latencies"
  match_metric_type: timer
  timer_type: histogram
  labels:
    app: "$1"
    role: "service"
    task: "$2"
    itf: "$4"
    service_type: "thrift"

# 其他不符合规范的指标都会被丢弃掉
- match: "."
  match_type: regex
  action: drop
  name: "dropped"
```

### 启动 statsd exporter

在 statsd_exporter 的代码目录下执行 go build 命令，并启动它:

```sh
$ go build -o /tmp/exporter . && /tmp/exporter --statsd.mapping-config=exporter_config.yaml --log.level=debug

ts=2023-05-31T23:42:11.802Z caller=main.go:292 level=info msg="Starting StatsD -> Prometheus Exporter" version="(version=, branch=, revision=f40cab3899c8effd25a5daee6f69e30eea796a96-modified)"
ts=2023-05-31T23:42:11.802Z caller=main.go:293 level=info msg="Build context" context="(go=go1.18.8, platform=linux/amd64, user=, date=, tags=unknown)"
ts=2023-05-31T23:42:11.803Z caller=main.go:342 level=info msg="Accepting StatsD Traffic" udp=:9125 tcp=:9125 unixgram=
ts=2023-05-31T23:42:11.803Z caller=main.go:343 level=info msg="Accepting Prometheus Requests" addr=:9102
# 可以看到，statsd server 运行在 9125 端口，prom server 运行在 9102 端口
```

### 使用 statsd client 向 statsd exporter 发送指标

+ 发送指标的代码

```go
package main

import (
	"github.com/cactus/go-statsd-client/v5/statsd"
	"log"
	"time"
)

func sendMetrics(client statsd.Statter) {
	err := client.TimingDuration("web.default.req_time", time.Millisecond*500, 1)
	if err != nil {
		log.Fatalln(err)
	}
	err = client.TimingDuration("service.ThriftSvcInstance.ThriftSvcInstance.count_by_item.req_time", time.Millisecond*300, 1)
	if err != nil {
		log.Fatalln(err)
	}
}

func main() {
	config := &statsd.ClientConfig{
		Address: "127.0.0.1:9125",
		Prefix:  "qae.mrpink",
	}

	client, err := statsd.NewClientWithConfig(config)

	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	sendMetrics(client)
}
```

执行上述代码，就会向 statsd exporter 发送两个 timer 指标

```
qae.mrpink.web.default.req_time:500|ms
qae.mrpink.service.ThriftSvcInstance.ThriftSvcInstance.count_by_item.req_time:300|ms
```

### 检查 statsd exporter 的 prom 指标

```sh
$ curl -s localhost:9102/metrics | rg qae_app_request_latencies_count

qae_app_request_latencies_count{app="mrpink",role="web",task="default"} 1
qae_app_request_latencies_count{app="mrpink",itf="count_by_item",role="service",service_type="thrift",task="ThriftSvcInstance"} 1
```

可以看到，statsd exporter 中存储了两个同名的指标序列 `qae_app_request_latencies_count`, 但是他们的 label 却不同。

## 使用 prometheus client_golang 构造同样的指标就会报错

如果我们想要使用 prometheus 提供的的官方客户端 [client_golang](https://github.com/prometheus/client_golang/), 发送同样的指标，就会遇到错误

```go
package main

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"log"
	"net/http"
	"time"
)

var (
	AppRequestLatencies = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name: "qae_app_request_latencies",
		Help: "web request count and req time latency",
	}, []string{"app", "role", "task"})
	ThriftAppRequestLatencies = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name: "qae_app_request_latencies",
		Help: "service request count and req time latency",
	}, []string{"app", "role", "task", "itf", "service_type"})
)

func SendMetrics() {
	dur1 := time.Duration(300) * time.Millisecond
	AppRequestLatencies.With(map[string]string{
		"app":  "mrpink",
		"role": "web",
		"task": "default",
	}).Observe(dur1.Seconds())
	dur2 := time.Duration(500) * time.Millisecond
	ThriftAppRequestLatencies.With(map[string]string{
		"app":          "mrpink",
		"role":         "service",
		"task":         "ThriftSvcInstance",
		"service_type": "thrift",
		"itf":          "count_by_item",
	}).Observe(dur2.Seconds())

	log.Println("Send metrics done")
}

func main() {
	addr := "0.0.0.0:8090"
	promMux := http.NewServeMux()
	promMux.Handle("/metrics", promhttp.Handler())

	go func() {
		time.Sleep(time.Second * 3)
		SendMetrics()
	}()

	err := http.ListenAndServe(addr, promMux)
	log.Printf("Start prom server on %v\n", addr)
	if err != nil {
		log.Fatalf("Starting the http server %v failed: %v\n", addr, err)
	}
}
```

执行以上代码，会抛出 panic 异常

```sh
$ go run prom_client/main.go

panic: a previously registered descriptor with the same fully-qualified name as Desc{fqName: "qae_app_request_latencies", help: "service request count and req time latency", constLabels: {}, variableLabels: [{app <nil>} {role <nil>} {task <nil>} {itf <nil>} {service_type <nil>}]} has different label names or a different help string

goroutine 1 [running]:
github.com/prometheus/client_golang/prometheus.(*Registry).MustRegister(0x0?, {0xc000118010?, 0x1, 0x0?})
        /home/xuyundong/.gvm/pkgsets/go1.18.8/global/pkg/mod/github.com/prometheus/client_golang@v1.15.1/prometheus/registry.go:405 +0x7f
github.com/prometheus/client_golang/prometheus/promauto.Factory.NewHistogramVec({{0x922410?, 0xc0000a2960?}}, {{0x0, 0x0}, {0x0, 0x0}, {0x87e012, 0x19}, {0x88794e, 0x2a}, ...}, ...)
        /home/xuyundong/.gvm/pkgsets/go1.18.8/global/pkg/mod/github.com/prometheus/client_golang@v1.15.1/prometheus/promauto/auto.go:362 +0x1cc
github.com/prometheus/client_golang/prometheus/promauto.NewHistogramVec(...)
        /home/xuyundong/.gvm/pkgsets/go1.18.8/global/pkg/mod/github.com/prometheus/client_golang@v1.15.1/prometheus/promauto/auto.go:235
main.init()
        /home/xuyundong/Github/Golang/statsd_client/prom_client/main.go:17 +0x269
exit status 2
```

## Prometheus client_golang 的检查逻辑

于是我有些好奇，statsd exporter 是如何做到，可以发送同名不同 label 的指标的。
简单的阅读了 client_golang 和 statsd_exporter 的指标之后，我找到了答案。

我阅读的代码的版本是

- [client_golang - release-1.15](https://github.com/prometheus/client_golang/tree/release-1.15)
- [statsd_exporter - 0.23.1](https://github.com/prometheus/statsd_exporter/tree/v0.23.1)

client_golang 中定义了两个接口

- [prometheus.Collector](https://github.com/prometheus/client_golang/blob/release-1.15/prometheus/collector.go#L27)
- [prometheus.Registerer](https://github.com/prometheus/client_golang/blob/release-1.15/prometheus/registry.go#L96)

client_golang 中每种指标都实现了 `prometheus.Collector`, 所有的指标会注册到一个实现了 `prometheus.Registerer` 接口的实例中，再由此实例收集并输出指标。

我们在代码中定义指标的代码是:

```go
opts := prometheus.HistogramOpts{
    Name: "qae_app_request_latencies",
    Help: "web request count and req time latency",
}
labels := []string{"app", "role", "task"}
AppRequestLatencies = promauto.NewHistogramVec(opts, labels)
```

client_golang 实际执行的代码如下, 它会注册一个 Histogram 指标，并将其注册到 `DefaultRegisterer` 中。`DefaultRegisterer` 就是一个实现了 `prometheus.Registerer` 接口的实例。

```go
h := prometheus.NewHistogramVec(opts, labelNames)
prometheus.DefaultRegisterer.MustRegister(h)
// MustRegister 底层调用了 Register 方法，在 Register 返回 err 时会 panic
// prometheus.DefaultRegisterer.Register(h)
```

`prometheus.Collector` 接口有一个 `Describe` 方法，它用于获取指标的信息。具体做法是传入一个 channel 参数，指标将 Desc 信息写入到 channel 中。

```go
type Collector interface {
        # Desc 包含指标名, label, help 等信息
        Describe(chan<- *Desc)
....
}
```

接着我们来看一下 `DefaultRegisterer` 的 [Register](https://github.com/prometheus/client_golang/blob/release-1.15/prometheus/registry.go#L270) 函数的实现，

```go
// 以下代码中我省略了一些无关的内容
func (r *Registry) Register(c Collector) error {
	// c 是 Collector 对象
	var (
		descChan           = make(chan *Desc, capDescChan)
	)
	go func() {
		c.Describe(descChan)
		close(descChan)
	}()
	r.mtx.Lock()
	defer func() {
		// 为了防止 goroutine 泄漏，descChan 必须被消费完
		for range descChan {
		}
		r.mtx.Unlock()
	}()

....

	for desc := range descChan {
		// desc.id 是根据指标名和固定 label 名算出来的 hash,
		// 如果注册的两个指标 name 和固定 label 名完全相同，则返回错误 duplicateDescErr
		if _, exists := r.descIDs[desc.id]; exists {
			duplicateDescErr = fmt.Errorf("descriptor %s already exists with the same fully-qualified name and const label values", desc)
		}
		// fqName 是指标名
		// dimHash 是 根据指标 label 名 + help 算出来的 hash
		// 如果注册了两个同名的指标，但是它们的 label 或者 help 信息不同的话，则会返回错误
		if dimHash, exists := r.dimHashesByName[desc.fqName]; exists {
			if dimHash != desc.dimHash {
				return fmt.Errorf("a previously registered descriptor with the same fully-qualified name as %s has different label names or a different help string", desc)
			}
		} else {
			...
		}
```

从以上代码可以看出，`Register` 中会通过 `Describe` 方法拿到指标的信息，并进行若干检查。如果两个同名指标的 label 名不同，则会返回错误 `a previously registered descriptor with the same fully-qualified name as Desc... has different label names or a different help string`。

## statsd exporter 中跳过检查的方法

那么 statsd exporter 是如何跳过上述检查的呢，很简单，让 `Describe` 返回空就好。statsd exporter 中的每个指标都用 [uncheckedCollector](https://github.com/prometheus/statsd_exporter/blob/v0.23.1/pkg/registry/registry.go#L33-L42) 包裹了一下。

`uncheckedCollector` 的定义如下

```go
type uncheckedCollector struct {
	c prometheus.Collector
}

func (u uncheckedCollector) Describe(_ chan<- *prometheus.Desc) {}
func (u uncheckedCollector) Collect(c chan<- prometheus.Metric) {
	u.c.Collect(c)
}
```

它的 `Describe` 方法什么也不返回，那么 `Register` 中的检查也会被跳过了。

这样最终实现了注册同名不同 label 指标的目的。
