---
title: "《gRPC》学习笔记"
date: 2020-11-30T22:48:50+08:00
lastmod: 2020-11-30T22:48:50+08:00
draft: false
tags: [笔记, ]
author: "bwangel"
comment: true
---

> 学习笔记

https://grpc.io/docs/what-is-grpc/introduction/

<!--more-->
---

## Protobuf

### Protobuf 生成 Go 代码

`protoc` 生成 go 代码时依赖插件 `protoc-gen-go`，它是一个二进制文件，通过以下命令安装。

```
go install google.golang.org/protobuf/cmd/protoc-gen-go
```

+ 当调用 `protoc` 时带有 `--go_out` 选项时，`protoc` 就会使用 `protoc-gen-go` 插件来生成 Go 代码。
+ `protoc` 生成的一个 Go 文件(`{proto文件的basename}.pb.go`)，它的名字和输入的 proto 文件类似，只不过是把后缀换成了 `.pb.go`。


proto 文件中应该包含一个选项 `go_package`，它指定了包含生成的 Go 文件的包名(`full import path of the Go package that contains the generated code`)。

### 生成文件的路径

+ 默认情况下 ，生成的代码存放在 `go_packge` 定义的目录中。例如声明 `go_packge="example.com/foo/bar"`，那么生成的代码路径就是 `example.com/foo/bar/foo.pb.go`。

+ 如果指定了 `--go_opt=paths=source_relative` 选项，那么生成的 go 文件会存放和 proto 文件相同的路径中。例如 `protos/foo.proto` 文件就会生成 `protos/foo.pb.go` 文件，`foo.pb.go` 中的 `package` 取的是 `go_package` 的最后一级路径。

+ 当执行以下命令:

```
protoc --proto_path=src --go_out=build/gen --go_opt=paths=source_relative src/foo.proto src/bar/baz.proto
```

protoc 将会读取 `src/foo.proto` 和 `src/bar/baz.proto` 源文件，生成两个输出文件，`build/gen/foo.pb.go` 和 `build/gen/bar/baz.pb.go`。如果 `build/gen/bar` 目录不存在的话，编译器会自动创建。但如果 `build` 或 `build/gen` 目录不存在的话，编译器会报错。

### Message

proto 文件中的如下定义:

```
message Foo {}
```

将会生成一个结构体 `Foo`，`*Foo` 类型实现了 `proto.Message` 接口。`proto.Message` 接口的 `ProtoReflect` 方法会返回 `protoreflect.Message` 接口类型的变量，它提供了一个基于反射 Message 视角。

```
message Foo {
    message Bar
}
```

proto 文件允许嵌套的 message ，这样在 go 文件中会生成两个类型，`Foo` 和 `Foo_Bar`

### Fields

编译器为 message 中的每个 Field 在 Go 结构体中都会创建一个字段，Go 结构体中的字段始终都会使用驼峰的方式进行命名。proto 文件中的字段使用下划线的方式命名时([as it should](https://developers.google.com/protocol-buffers/docs/style))，它会自动被转换成驼峰命名，它的转换规则如下:

1. 第一个字母会是大写用于生命一个导出字段。如果第一个字符是下划线的话，它将会被替换成 `X`。
2. 如果内部下划线后面紧跟一个小写字母的话，内部下划线将会被移除，后面的小写字母将会被替换成大写。

例如，`foo_bar_baz` 将会变成 `FooBarBaz` 命名，`_my_field_name_2` 将会变成 `XMyFieldName2` 命名。

+ Proto2 数值类型对应表

.proto Type|Notes|  C++ Type|   Java Type|  Python Type[2]| Go Type
---|---|---|---|---|---
double | |    double| double|  float | `*float64`
float  | |    float | float | float  |`*float32`
int32  |Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead.|int32 | int|int|`*int32`
int64  |Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead.|int64 | long  | int/long | `*int64`
uint32 |Uses variable-length encoding.| uint32 |int[1] |int/long[3]|`*uint32`
uint64 |Uses variable-length encoding.| uint64 |long[1]|int/long[3]|`*uint64`
sint32 |Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. |  int32 | int|int|`*int32`
sint64 |Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. |  int64 | long  | int/long[3]|`*int64`
fixed32|Always four bytes. More efficient than uint32 if values are often greater than 228.|uint32| int[1]| int/long[3]|`*uint32`
fixed64|Always eight bytes. More efficient than uint64 if values are often greater than 256.|   uint64 |long[1]|int/long[3]|`*uint64`
sfixed32|   Always four bytes. |int32 | int|int|`*int32`
sfixed64|   Always eight bytes.|int64 | long |  int/long[3]|`*int64`
bool |  |   bool|   boolean|bool |  `*bool`
string| A string must always contain UTF-8 encoded or 7-bit ASCII text.|string| String| unicode (Python 2) or str (Python 3)|   `*string`
bytes | May contain any arbitrary sequence of bytes. |  string |ByteString| bytes|  []byte

+ [1] In Java, unsigned 32-bit and 64-bit integers are represented using their signed counterparts, with the top bit simply being stored in the sign bit.
+ [2] In all cases, setting values to a field will perform type checking to make sure it is valid.
+ [3] 64-bit or unsigned 32-bit integers are always represented as long when decoded, but can be an int if an int is given when setting the field. In all cases, the value must fit in the type represented when set. See [2].

---

+ proto3 数值类型对应表

.proto Type|Notes|  C++ Type|   Java Type|  Python Type[2]| Go Type|Ruby Type|  C# Type|PHP Type|   Dart Type
---|---|---|---|---|---|---|---|---|---
double|   | double| double| float | float64|Float | double |float | double
float |   | float | float | float | float32|Float | float  |float | double
int32 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead.|int32 | int|int|int32|  Fixnum or Bignum (as required) |int|integer|int
int64 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead.|int64 | long  | int/long[3]|int64 | Bignum |long |  integer/string[5] | Int64
uint32| Uses variable-length encoding.| uint32| int[1] |int/long[3]|uint32 |Fixnum or Bignum (as required) |uint  | integer|int
uint64| Uses variable-length encoding.| uint64| long[1]|int/long[3]|uint64 |Bignum |ulong  |integer/string[5] | Int64
sint32| Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. |  int32 | int|int|int32 | Fixnum or Bignum (as required) |int|integer|int
sint64| Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. |  int64 | long|   int/long[3]|int64 | Bignum| long|   integer/string[5]|  Int64
fixed32|Always four bytes. More efficient than uint32 if values are often greater than 228.|uint32 |int[1]| int/long[3]|uint32| Fixnum or Bignum (as required)| uint |  integer|int
fixed64|Always eight bytes. More efficient than uint64 if values are often greater than 256. |  uint64| long[1]|int/long[3]|uint64| Bignum| ulong|  integer/string[5] | Int64
sfixed32 |  Always four bytes. |int32|  int|int|int32|  Fixnum or Bignum (as required)| int|integer|int
sfixed64 |  Always eight bytes.|int64|  long|   int/long[3]|int64|  Bignum| long|   integer/string[5]|  Int64
bool |      bool |  boolean|bool|   bool|   TrueClass/FalseClass|   bool|   boolean|bool
string| A string must always contain UTF-8 encoded or 7-bit ASCII text, and cannot be longer than 232.| string| String| str/unicode[4]| string| String (UTF-8)| string| string| String
bytes | May contain any arbitrary sequence of bytes no longer than 232.|string| ByteString| str|[]byte| String (ASCII-8BIT)|ByteString| string| List

+ [1] In Java, unsigned 32-bit and 64-bit integers are represented using their signed counterparts, with the top bit simply being stored in the sign bit.
+ [2] In all cases, setting values to a field will perform type checking to make sure it is valid.
+ [3] 64-bit or unsigned 32-bit integers are always represented as long when decoded, but can be an int if an int is given when setting the field. In all cases, the value must fit in the type represented when set. See [2].
+ [4] Python strings are represented as unicode on decode but can be str if an ASCII string is given (this is subject to change).
+ [5] Integer is used on 64-bit machines and string is used on 32-bit machines.

### Service

`protoc-gen-go` 生成器并不会生成 Service 的代码，需要使用 [gRPC 插件](https://github.com/grpc/grpc-go/tree/master/cmd/protoc-gen-go-grpc) 去生成。

## 参考链接

+ https://developers.google.com/protocol-buffers/docs/reference/go-generated
+ https://developers.google.com/protocol-buffers/docs/proto#scalar
+ https://developers.google.com/protocol-buffers/docs/proto3#scalar
+ https://grpc.io/docs/what-is-grpc/core-concepts/
+ https://grpc.io/docs/what-is-grpc/introduction/
+ https://grpc.io/docs/languages/go/quickstart/

