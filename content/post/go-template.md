---
title: "Go 模板"
author: "bwangel"
tags: ["template", "Go"]
date: 2018-10-18T23:24:24+08:00
draft: false
---

关于 Go 模板的笔记

<!--more-->

## 字段操作

Go 语言的模板通过`{{}}`来插入变量，`{{.}}`表示当前对象，类似于 C++ 中的 this 或者 Python 中的 self。`{{ .FieldName }}`用来获取当前对象中的字段`FieldName`，需要注意的是字段名必须是`exported`的(即变量的首字母必须是大写)。

如果字段名不是`exported`的，那么就会有如下错误:

```go
template: header.html:5:14: executing "header.html" at <.title>: title is an unexported field of struct type struct { Env map[string]string; title string }
```

+ {{ \`string\` }} 可以用这种形式输出字符串`string`

## 输出嵌套内容

`with`操作可以更改当前`{{ . }}`所指向的对象。

```go
func main() {
    t := template.New("test_with")
    t.Parse(`{{ with .Env }}{{ range $key, $val := . }}
    {{ $key }}: {{ $val }}
    {{ end }}{{ end }}`)
    t.Execute(os.Stdout, struct {
        Env map[string]string
    }{
        Env: map[string]string{
            "Home":  "jc",
            "Lover": "xff",
        },
    })
}
```

## pipelines

+ 在 Go 语言模板中，任何`{{}}`里面的内容都是pipelines数据
+ pipelines数据之间可以通过`|`联系起来，例如: `{{ "<output>" | html }}`

## 自定义函数

```go
package main

import (
    "fmt"
    "html/template"
    "os"
    "strings"
)

type Friend struct {
    Fname string
}

type Person struct {
    UserName string
    Emails   []string
    Friends  []*Friend
}

func EmailDealWith(args ...interface{}) string {
    ok := false
    var s string
    if len(args) == 1 {
        s, ok = args[0].(string)
    }
    if !ok {
        s = fmt.Sprint(args...)
    }
    // find the @ symbol
    substrs := strings.Split(s, "@")
    if len(substrs) != 2 {
        return s
    }
    // replace the @ by " at "
    return (substrs[0] + " at " + substrs[1])
}

func Upper(args ...interface{}) string {
    ok := false
    var s string
    if len(args) == 1 {
        s, ok = args[0].(string)
    }
    if !ok {
        s = fmt.Sprint(args...)
    }

    return strings.ToUpper(s)
}

func main() {
    fmt.Println(EmailDealWith("a", "b", "@", "c"))

    f1 := Friend{Fname: "minux.ma"}
    f2 := Friend{Fname: "xushiwei"}
    t := template.New("fieldname example")
    t = t.Funcs(template.FuncMap{
        "emailDeal": EmailDealWith,
        "upper":     Upper,
    })
    t, _ = t.Parse(`hello {{.UserName | upper}}!
                {{range .Emails}}
                    an emails {{.|emailDeal}}
                {{end}}
                {{with .Friends}}
                {{range .}}
                    my friend name is {{.Fname}}
                {{end}}
                {{end}}
                `)
    p := Person{UserName: "Astaxie",
        Emails:  []string{"astaxie@beego.me", "astaxie@gmail.com"},
        Friends: []*Friend{&f1, &f2}}
    t.Execute(os.Stdout, p)
}
```

+ Go 模板包中还提供了许多自定义函数，[相关文档](https://golang.org/pkg/text/template/#hdr-Functions)

## Must

`Must`是一个 helper 函数，用来检查模板编译是否正确，如果不正确就会panic。

```go
func main() {
	tErr := template.New("terr")
	template.Must(tErr.Parse(`some error {{text}`))
}
// panic: template: terr:1: function "text" not defined
```

## 模板嵌套

```html
// header.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ .Title }}</title>
</head>
<body>
    {{ template "body" . }}
    {{ with .Env }}
        {{ range $key, $val := . }}
        <li>{{ $key }} -- {{ $val }}</li>
        {{ end }}
    {{ end }}
</body>
</html>

// body.html
{{ define "body" }}
<ul>
    {{ range $key, $val := .Env }}
    <li>{{ $key }} -- {{ $val }}</li>
    {{ end }}
</ul>
{{ end }}
```

```go
// main.go
package main

import (
	"log"
	"os"
	"text/template"
)

func main() {
	t, err := template.ParseFiles("header.html", "body.html")
	if err != nil {
		log.Fatalln(err)
	}

	env := map[string]string{
		"Home":  "/Users/michaletsui",
		"Shell": "/bin/bash",
	}
	err = t.Execute(os.Stdout, struct {
		Env   map[string]string
		Title string
	}{
		Env:   env,
		Title: "Go 模板",
	})

	if err != nil {
		log.Fatalln(err)
	}
}
```

+ `{{ define "blockname" }}...{{ end }}`可以定义一个 block
+ `{{ template "blockname" }}` 将会调用一个 block
+ `t.Execute`传递的对象并不会直接传递给 block，需要`{{ block "body" . }}`这样显示传递
+ 同一个集合类的模板是互相知晓的，如果同一模板被多个集合使用，则它需要在多个集合中分别解析
+ `template.ParseFiles`将第一个文件作为主模板
+ `t.ExecuteTemplate`可以指定要执行的主模板


```go
func main() {
    t, err := template.ParseFiles("body.html", "header.html")
    if err != nil {
        log.Fatalln(err)
    }

    env := map[string]string{
        "Home":  "/Users/michaletsui",
        "Shell": "/bin/bash",
    }

    data := struct {
        Env   map[string]string
        Title string
    }{
        Env:   env,
        Title: "Go 模板",
    }

    // 因为 body.html 作为主模板除了定义的block外没有其它内容，所以`t.Execute`没有不会输出任何内容
    // 故这里通过 `t.ExecuteTemplate` 来指定主模板
    // 也可以通过下面的方式
    // t = t.Lookup("header.html")
    // err = t.Execute(os.Stdout, data)
    err = t.ExecuteTemplate(os.Stdout, "header.html", data)

    if err != nil {
        log.Fatalln(err)
    }
}
```

## 参考链接

+ [Go 模板嵌套最佳实践
](https://colobu.com/2016/10/09/Go-embedded-template-best-practices/)

+ [build-web-application-with-golang 07.4](https://github.com/astaxie/build-web-application-with-golang/blob/master/zh/07.4.md#must%E6%93%8D%E4%BD%9C)