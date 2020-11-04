---
title: "《Maven》学习笔记"
date: 2020-11-02T22:16:19+08:00
lastmod: 2020-11-02T22:16:19+08:00
draft: false
tags: [笔记, ]
author: "bwangel"
comment: true
---

> [Maven](https://maven.apache.org/) 学习笔记

<!--more-->
---

## Maven 约定的目录结构

```
ProjectName/
   |
   |--- src/
        |
        |--- main/ [放置主程序的 Java 代码和配置文件]
             |--- java/ [放置主程序包和包中的 java 文件]
             |--- resources/ [放置主程序的配置文件]
        |--- test/ [放置测试程序代码和配置文件]
             |--- java/ [放置测试程序的包和包中的 Java 文件]
             |--- resources/ [放置测试程序的配置文件]
   |--- pom.xml [Maven 项目的核心文件]
```

## Maven 生命周期

Maven 的生命周期，就是 maven 构建项目的过程。

清理 -> 编译 -> 测试 -> 打包 -> 安装 -> 部署

每次执行命令时都会把生命周期前面的命令都执行一遍，只有前面的命令成功执行后，后面的命令才会跟着执行。

Maven 命令执行时，真正完成功能的是插件，插件是从中央仓库下载的 Jar 包，下载到了本机默认仓库(`$HOME/.m2/repository`)中。

### Maven 清理(clean)

将 `target` 目录删除删除。

### Maven 编译(compile)

Maven 编译 Java 程序后生成的 class 文件放到了 target 目录中。

1. 把 src/main/java 目录下的所有 Java 文件编译成类文件，拷贝到 target/classes 目录下
2. 把 src/main/resources 目录下的所有文件拷贝到 target/classes 目录下

### Maven 编译测试文件(test-compile)

编译测试文件，步骤和 编译类似，不过是将文件拷贝到 target/test-classes 目录下

### Maven 测试 (test)

测试结果会生成一个报告，保存在 `target/surefire-reports` 中。

### Maven 打包 (build)

将项目打包成 jar 文件，生产 `target/{artifactId}-{version}.jar` 文件。

## Maven 配置

仓库是用来存放 maven 使用的插件和项目使用的 jar 包。

+ localRepository 本地仓库的位置

远程仓库:

1. 中央仓库，最权威的仓库: https://repo.maven.apache.org/maven2/
2. 中央仓库的镜像，中央仓库在各个位置的备份
3. 私有仓库，在公司内部，局域网中使用的

寻找资源的顺序，本地仓库-->私有仓库-->镜像仓库-->中央仓库

## Pom 文件

Project Object Model，项目对象模型文件。

groupId + artifactId + version 合起来成为 __坐标__，坐标可以在互联网上唯一地标识一个项目。

可以在 https://mvnrepository.com/ 搜索项目

字段名|说明
---|---
modelVersion|Maven 模型的版本，对于 Maven2 和 Maven3来说，它只能是4.0.0
groupId|组织名称，一般是公司域名的倒写。
artifactId|项目名称，也就是模块名称
version|版本号，如果项目还在开发中，是不稳定版本，通常在版本后带 `-SNAPSHOT`，version 使用三位数字标识，例如 `1.0.0`
packing|项目打包的类型，可以使用 jar, war, rar, ear, pom，默认是 jar
dependencies 和 dependency|项目的依赖
properties|配置属性
build|构建相关的配置
parent|声明继承父工程的pom配置
modules|聚合

## Archetype

Archetype 即原型的意思，是 Maven 创建项目的一些模板。

Maven Archetype 插件从原型目录( archetype catalog)读取所有的原型。

原型目录有三种:

1. remote, 从 https://repo1.maven.org/maven2/archetype-catalog.xml 下载
2. local，从 `$HOME/.m2/repository/archetype-catalog.xml` 读取 (maven 3.3.9 是这样的)
3. internal，Maven Archetype 插件内置的原型目录

Maven Archetype 插件默认从 internal 读取原型目录，但是 idea 在创建项目的时候，会从 repo1.maven.org 下载原型目录，这个文件有9.9M大，且从外网下载，这样就导致了从原型创建 maven 项目非常慢。

我们可以在 idea 的设置中(`File -> New Project Settings -> Settings for new projects -> Build, Execution, deployment -> Build Tools -> Maven -> Runner -> VM Options`)添加选项 `-DarchetypeCatalog=local`，这样在新建项目时就不会从互联网上下载原型目录文件了。

## 依赖的范围

dependency 中的 `scope` 选项，`scope` 的值有 `compile`, `test`, `provided` 三种值，默认是 `compile`。

生命周期 \ scope的值|compile|test|provided
---|---|---|---
编译周期|参与|不参与|参与
测试周期|参与|参与|参与
打包周期|参与|不参与|不参与
安装周期|参与|不参与|不参与

## Maven 全局属性

`<properties>` 中可以定义变量

```xml
<properties>
 <spring.version>5.2.5</spring.version>
</properties>


<dependencies>
<dependency>
   <groupId>com.springframework</groupId>
   <artifactId>spring-core</artifactId>
   <version>${spring.version}</version>
</dependency>
</dependencies>
```

resource 配置可以设置编译打包时拷贝的文件

```xml
<build>
<!-- 告诉 maven，编译和打包时不仅拷贝 java class 文件，也拷贝 include 中定义的文件 -->
	<resources>
		<resource>
			<directory>src/main/java</directory>
			<includes>
				<include>**/*.properties</include>
				<include>**/*.xml</include>
			</includes>
			<!-- 关闭过滤 -->
			<filtering>false</filtering>
		</resource>
	</resources>
</build>

```


## 参考资料

1. [动力节点 Maven 教程](https://www.bilibili.com/video/BV1dp4y1Q7Hf/?p=6)
2. [How does the Archetype Plugin know about archetypes?](https://maven.apache.org/archetype/maven-archetype-plugin/specification/archetype-catalog.html)

