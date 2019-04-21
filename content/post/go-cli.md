---
title: "urfave/cli 学习笔记"
date: 2019-04-21T18:23:00+08:00
lastmod: 2019-04-21T18:23:00+08:00
draft: false
tags: [Go, cli]
author: "bwangel"
comment: true
toc: true
---

> + 原文地址: https://github.com/urfave/cli/tree/v1.20.0#overview

<!--more-->


## 环境说明

Key|Value
---|---
cli 版本|v1.20.0
cli Git Commit|[cfb38830724cc34fedffe9a2a29fb54fa9169cd1](https://github.com/urfave/cli/commit/cfb38830724cc34fedffe9a2a29fb54fa9169cd1)
Go 版本|go version go1.11.5 darwin/amd64

## 指定版本

+ 指定`V2`版本(注意：V2 版本目前(2019年04月21日)还在开发中，属于`unstable`状态)

```sh
$ go get gopkg.in/urfave/cli.v2
```

```go
...
import (
  "gopkg.in/urfave/cli.v2" // imports as package "cli"
)
...
```

+ 指定`V1`版本

```sh
$ go get gopkg.in/urfave/cli.v1
```

```go
...
import (
  "gopkg.in/urfave/cli.v1" // imports as package "cli"
)
...
```

## 基本用法

+ 下面的代码没有添加 command，只有一个默认的动作。
+ 所有命令后跟着的参数都会被放到 `c.Args` 中

```go
package main

import (
	"fmt"
	"log"
	"os"

	"gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()
	app.Name = "watch"
	app.Usage = "fight the loneliness!"
	app.Action = func(c *cli.Context) error {
		fmt.Printf("Hello %q!", c.Args().Get(0))
		return nil
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
}
```

## 添加全局 flag

+ 下面的代码中添加了全局的__flag__: `--lang`
+ __flag__的`Value`既可以通过`Destination`属性存储到自定义变量中，也可以使用`c.String("lang")`的方式来获取

```go
package main

import (
	"fmt"
	"log"
	"os"

	"gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()
	var language string

	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:  "lang",
			Value: "english",
			Usage: "language for the greeting",
			Destination: &language,
		},
	}

	app.Action = func(c *cli.Context) error {
		name := "bwangel"
		if c.NArg() > 0 {
			name = c.Args().Get(0)
		}
		// if c.String("lang") == "chinese" {
		if language == "chinese" {
			fmt.Println("你好", name)
		} else {
			fmt.Println("Hello", name)
		}
		return nil
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
}
```

## 在 Usage 中放上占位符

+ 有时候我们想在`Usage`中放上__flag__的`Value`占位符，可以在`Usage`中放置反引号包裹的内容
+ 这段代码输出的`Usage`如下:

```
GLOBAL OPTIONS:
   --config YOUR_CONFIG_FILE, -c YOUR_CONFIG_FILE  Load configuration from YOUR_CONFIG_FILE
   --help, -h                                      show help
   --version, -v                                   print the version
```

```go
package main

import (
	"log"
	"os"

	"gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()

	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:  "config, c",
			Usage: "Load configuration from `YOUR_CONFIG_FILE`",
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
}
```

## Flag 的别名

+ 有时候我们想要让一个 flag 有多个名称，例如`language`, `lang`, `l`，可以在`Name`中指定多个由__逗号__分割的名称，cli 将会自动为其创建别名

```go
package main

import (
	"log"
	"os"

	"gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()

	app.Name = "greet"
	app.Usage = "A greeting app"
	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:  "language, lang, l",
			Value: "english",
			Usage: "language for greeting",
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
	//GLOBAL OPTIONS:
	//--language value, --lang value, -l value  language for greeting (default: "english")
	//--help, -h                                show help
	//--version, -v                             print the version
}
```

+ 注意，__同一个命令中的 flag 名称__不能被定义两次，否则将会导致 panic

```go
package main

import (
	"log"
	"os"

	"gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()

	app.Name = "greet"
	app.Usage = "A greeting app"
	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:  "language, lang, l",
			Value: "english",
			Usage: "language for greeting",
		},
		cli.Int64Flag{
			Name: "length, l",
			Value: 0,
			Usage: "length of users",
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
	//Out
	//	>>> go build && ./watcher
	//	greet flag redefined: l
	//	panic: greet flag redefined: l
	//
	//	goroutine 1 [running]:
	//	flag.(*FlagSet).Var(0xc000084180, 0x1175d40, 0xc000074018, 0x1153226, 0x1, 0x1153f78, 0xf)
	//	/usr/local/opt/go/libexec/src/flag/flag.go:805 +0x529
	//	flag.(*FlagSet).Int64Var(0xc000084180, 0xc000074018, 0x1153226, 0x1, 0x0, 0x1153f78, 0xf)
	//	/usr/local/opt/go/libexec/src/flag/flag.go:630 +0x71
	//	flag.(*FlagSet).Int64(0xc000084180, 0x1153226, 0x1, 0x0, 0x1153f78, 0xf, 0x1)
	//	/usr/local/opt/go/libexec/src/flag/flag.go:643 +0x77
	//	gopkg.in/urfave/cli.v1.Int64Flag.ApplyWithError.func1(0x1153226, 0x1)
	//	/Users/michaeltsui/go/pkg/mod/gopkg.in/urfave/cli.v1@v1.20.0/flag.go:488 +0xad
	//	gopkg.in/urfave/cli.v1.eachName(0x115321e, 0x9, 0xc0000a7b88)
	//	/Users/michaeltsui/go/pkg/mod/gopkg.in/urfave/cli.v1@v1.20.0/flag.go:94 +0xc6
	//	gopkg.in/urfave/cli.v1.Int64Flag.ApplyWithError(0x115321e, 0x9, 0x1153f78, 0xf, 0x0, 0x0, 0x0, 0x0, 0x0, 0xc000084180, ...)
	//	/Users/michaeltsui/go/pkg/mod/gopkg.in/urfave/cli.v1@v1.20.0/flag.go:483 +0x113
	//	gopkg.in/urfave/cli.v1.flagSet(0x115293c, 0x5, 0xc000076080, 0x4, 0x4, 0xc000062190, 0x1, 0x1)
	//	/Users/michaeltsui/go/pkg/mod/gopkg.in/urfave/cli.v1@v1.20.0/flag.go:80 +0x128
	//	gopkg.in/urfave/cli.v1.(*App).Run(0xc000078340, 0xc000062190, 0x1, 0x1, 0x0, 0x0)
	//	/Users/michaeltsui/go/pkg/mod/gopkg.in/urfave/cli.v1@v1.20.0/app.go:187 +0xfa
	//	main.main()
	//	/Users/michaeltsui/Github/Golang/watcher/main.go:28 +0x22d
}
```

## 排序

`flags`和`commands`默认是根据定义的顺序展示的，但是如果让他们按照字母顺序输出，可以使用`FlagsByName`和`CommandsByName`和`sort`来排序。

```go
package main

import (
	"fmt"
	"log"
	"os"
	"sort"

	"gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()

	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:  "lang, l",
			Value: "english",
			Usage: "Language for the greeting",
		},
		cli.StringFlag{
			Name:  "config, c",
			Usage: "Load configuration from `FILE`",
		},
	}

	app.Commands = []cli.Command{
		{
			Name:    "complete",
			Aliases: []string{"c"},
			Usage:   "complete a task on the list",
			Action: func(c *cli.Context) error {
				fmt.Println(c.Command.Name)
				return nil
			},
		},
		{
			Name:    "add",
			Aliases: []string{"a"},
			Usage:   "add a task to the list",
			Action: func(c *cli.Context) error {
				fmt.Println(c.Command.Name)
				return nil
			},
		},
	}

	sort.Sort(cli.FlagsByName(app.Flags))
	sort.Sort(cli.CommandsByName(app.Commands))

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
	//Out
	//COMMANDS:
	//add, a       add a task to the list
	//complete, c  complete a task on the list
	//help, h      Shows a list of commands or help for one command
	//
	//GLOBAL OPTIONS:
	//--config FILE, -c FILE  Load configuration from FILE
	//--lang value, -l value  Language for the greeting (default: "english")
	//--help, -h              show help
	//--version, -v           print the version
}
```

## 从环境变量中获取值

+ 也可以通过`EnvVar`从环境变量中获取默认的值，可以使用`,`分割的方式匹配多个环境变量:
+ 环境变量会按照从前往后的顺序匹配

```go
package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()

	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:   "lang, l",
			Value:  "english",
			Usage:  "Language for the greeting",
			// 可以使用,分割多个环境变量，变量会按照从前往后的顺序匹配
			EnvVar: "APP_LANG,LANG",
		},
	}

	app.Action = func(c *cli.Context) error {
		if c.String("lang") == "chinese" || strings.HasPrefix(c.String("lang"), "zh_CN") {
			fmt.Println("你好，工程师")
		} else {
			fmt.Println("Hello, Engineer")
		}
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
	//Out
	//$ make bin && APP_LANG=english ./bin/watcher # 这里优先匹配 APP_LANG 而非 LANG
	//go build -o bin/watcher
	//Hello, Engineer

	//$ make bin && ./bin/watcher
	//go build -o bin/watcher
	//你好，工程师
}
```

## 从文件中读取配置项

+ 引入`gopkg.in/urfave/cli.v1/altsrc`即可从文件中读取配置项
+ __命令行中指定的配置项值优先级高于配置文件中指定的配置项__
+ __注意__: `altsrc`依赖于`gopkg.in/urfave/cli.v1`，所以使用`altsrc`的时候，要执行如下的`import`:

```go
import (
	cli "gopkg.in/urfave/cli.v1" // 从gopkg.in 引入 cli 而非从 GitHub 引入
	"gopkg.in/urfave/cli.v1/altsrc"
)
```

+ 支持从配置文件读取的配置项需要使用`altsrc.NewXXXFlag`包裹
+ 配置文件也要当做一个配置项写入到`app.Flags`中
+ 从配置文件添加配置项，需要使用`InitInputSourceWithContext`进行初始化

```go
// config 表示配置文件的配置项名称
app.Before := altsrc.InitInputSourceWithContext(flags, altsrc.NewYamlSourceFromFlagFunc("config"))
```

+ 目前`altsrc`仅支持`TOML`, `YAML`配置文件，如需要其他格式的配置文件，可自行实现`altsrc.InputSourceContext`

+ 示例代码

```go
package main

import (
	"fmt"
	"log"
	"os"

	cli "gopkg.in/urfave/cli.v1"
	"gopkg.in/urfave/cli.v1/altsrc"
)

func main() {
	app := cli.NewApp()
	flags := []cli.Flag{
		altsrc.NewIntFlag(cli.IntFlag{Name: "count"}),
		cli.StringFlag{
			Name: "config",
		},
	}

	app.Action = func(ctx *cli.Context) error {
		count := ctx.Int("count")
		fmt.Printf("Echo %d count\n", count)
		for i := 0; i < count; i++ {
			fmt.Println("yml is readed")
		}
		return nil
	}

	app.Before = func(ctx *cli.Context) error {
		BeforeFunc := altsrc.InitInputSourceWithContext(flags, altsrc.NewYamlSourceFromFlagFunc("config"))
		_ = BeforeFunc(ctx)
		return nil
	}
	app.Flags = flags

	if err := app.Run(os.Args); err != nil {
		log.Fatalln(err)
	}
}
```

+ 输出

```sh
>>> make bin && ./bin/watcher
go build -o bin/watcher
Echo 0 count
>>> make bin && ./bin/watcher --count 4
go build -o bin/watcher
Echo 4 count
yml is readed
yml is readed
yml is readed
yml is readed
>>> cat app.yaml
count: 10
>>> make bin && ./bin/watcher --config ./app.yaml
go build -o bin/watcher
Echo 10 count
yml is readed
yml is readed
yml is readed
yml is readed
yml is readed
yml is readed
yml is readed
yml is readed
yml is readed
yml is readed
>>> make bin && ./bin/watcher --config ./app.yaml --count 1
go build -o bin/watcher
Echo 1 count
yml is readed
```

## 子命令

+ cli 默认为根命令，每个命令可以添加子命令和选项

```go
package main

import (
	"fmt"
	"log"
	"os"

	cli "gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()

	app.Commands = []cli.Command{
		{
			Name:    "add",
			Aliases: []string{"a"},
			Usage:   "add a task to the list",
			Action: func(c *cli.Context) error {
				fmt.Println("added task: ", c.Args().First())
				return nil
			},
		},
		{
			Name:    "complete",
			Aliases: []string{"c"},
			Usage:   "complete a task on the list",
			Action: func(c *cli.Context) error {
				fmt.Println("completed task: ", c.Args().First())
				return nil
			},
		},
		{
			Name:    "template",
			Aliases: []string{"t"},
			Usage:   "options for task templates",
			Subcommands: []cli.Command{
				{
					Name:  "add",
					Usage: "add a new template",
					Flags: []cli.Flag{
						cli.StringFlag{
							Name:  "path,p",
							Usage: "template path",
						},
					},
					Action: func(c *cli.Context) error {
						fmt.Printf("new task template: %s from %s\n", c.Args().First(), c.String("path"))
						return nil
					},
				},
				{
					Name:  "remove",
					Usage: "remove an existing template",
					Action: func(c *cli.Context) error {
						fmt.Println("removed task template: ", c.Args().First())
						return nil
					},
				},
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatalln(err)
	}
}
```

```sh
>>> make bin && ./bin/watcher template add -h                                                        17:32:18 (04-21)
go build -o bin/watcher
NAME:
   watcher template add - add a new template

USAGE:
   watcher template add [command options] [arguments...]

OPTIONS:
   --path value, -p value  template path
>>> make bin && ./bin/watcher template add -p /tmpdir xff                                            17:32:49 (04-21)
go build -o bin/watcher
new task template: xff from /tmpdir
```

## 子命令分类

+ 可以通过`Category`选项让命令的帮助文本在一组中输出

```go
package main

import (
	"log"
	"os"

	cli "gopkg.in/urfave/cli.v1"
)

func main() {
	app := cli.NewApp()

	app.Commands = []cli.Command{
		{
			Name:     "env",
			Category: "info",
		},
		{
			Name:     "add",
			Category: "template",
		},
		{
			Name:     "remove",
			Category: "template",
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatalln(err)
	}
}
```

```sh
>>> make bin && ./bin/watcher -h                                                                     17:37:44 (04-21)
go build -o bin/watcher
NAME:
   watcher - A new cli application

USAGE:
   watcher [global options] command [command options] [arguments...]

VERSION:
   0.0.0

COMMANDS:
     help, h  Shows a list of commands or help for one command
   info:
     env
   template:
     add
     remove

GLOBAL OPTIONS:
   --help, -h     show help
   --version, -v  print the version
```

## 返回码

+ `app.Run`默认不会调用`os.Exit`，所以程序的默认返回码是0
+ 可以在`Action`指定错误返回值为`ExitCoder`或`MultiError`指定程序返回码

```go
package main

import (
	"gopkg.in/urfave/cli.v1"
	"log"
	"os"
)

func main() {
	app := cli.NewApp()
	app.Flags = []cli.Flag{
		cli.BoolTFlag{
			Name:  "ginger-crouton,g",
			Usage: "is it in the soup?",
		},
	}

	app.Action = func(ctx *cli.Context) error {
		if !ctx.Bool("ginger-crouton") {
			return cli.NewExitError("it is not in the soup", 86)
		}
		return nil
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatalln(err)
	}
}
```

```sh
>>> make bin && ./bin/watcher -g=false                                                               17:46:34 (04-21)
go build -o bin/watcher
it is not in the soup
1371 (michaeldeMacBook-Air) 86 ~/Github/Golang/watcher
>>> make bin && ./bin/watcher -g=0                                                                   17:46:36 (04-21)
go build -o bin/watcher
it is not in the soup
1372 (michaeldeMacBook-Air) 86 ~/Github/Golang/watcher
>>> make bin && ./bin/watcher -g=f                                                                   17:46:38 (04-21)
go build -o bin/watcher
it is not in the soup
```

## 生成帮助文本

+ 帮助文本的模板通过`AppHelpTemplate`, `CommandHelpTemplate`, `SubcommandHelpTemplate`这三个变量来定义，可以将它们重新赋值来改变帮助文本的样式
+ 也可以改变`cli.HelpPrinter`来重新定义帮助函数

```
package main

import (
	"fmt"
	"os"

	cli "gopkg.in/urfave/cli.v1"
)

func main() {
	// EXAMPLE: Append to an existing template
	cli.AppHelpTemplate = fmt.Sprintf(`%s

WEBSITE: http://awesometown.example.com

SUPPORT: support@awesometown.example.com

`, cli.AppHelpTemplate)

	// EXAMPLE: Override a template
	cli.AppHelpTemplate = `NAME:
   {{.Name}} - {{.Usage}}
USAGE:
   {{.HelpName}} {{if .VisibleFlags}}[global options]{{end}}{{if .Commands}} command [command options]{{end}} {{if .ArgsUsage}}{{.ArgsUsage}}{{else}}[arguments...]{{end}}
   {{if len .Authors}}
AUTHOR:
   {{range .Authors}}{{ . }}{{end}}
   {{end}}{{if .Commands}}
COMMANDS:
{{range .Commands}}{{if not .HideHelp}}   {{join .Names ", "}}{{ "\t"}}{{.Usage}}{{ "\n" }}{{end}}{{end}}{{end}}{{if .VisibleFlags}}
GLOBAL OPTIONS:
   {{range .VisibleFlags}}{{.}}
   {{end}}{{end}}{{if .Copyright }}
COPYRIGHT:
   {{.Copyright}}
   {{end}}{{if .Version}}
VERSION:
   {{.Version}}
   {{end}}
`

	// EXAMPLE: Replace the `HelpPrinter` func
	cli.HelpPrinter = func(w io.Writer, templ string, data interface{}) {
		fmt.Println("Ha HA.  I pwnd the help!!1")
	}

	cli.NewApp().Run(os.Args)
}
```

```sh
>>> make bin && ./bin/watcher                                                                        18:04:34 (04-21)
go build -o bin/watcher
Ha HA.  I pwnd the help!!1
```

+ `help`命令的属性可以通过`cli.HelpFlag`来改变

```go
package main

import (
	"os"

	cli "gopkg.in/urfave/cli.v1"
)

func main() {
	cli.HelpFlag = cli.BoolFlag{
		Name:   "halp, haaaaalp",
		Usage:  "HALP",
		EnvVar: "SHOW_HALP,HALPPLZ",
	}

	cli.NewApp().Run(os.Args)
}
```

```sh
>>> make bin && ./bin/watcher --haaaaalp                                                             18:05:53 (04-21)
go build -o bin/watcher
NAME:
   watcher - A new cli application

USAGE:
   watcher [global options] command [command options] [arguments...]

VERSION:
   0.0.0

COMMANDS:
     help, h  Shows a list of commands or help for one command

GLOBAL OPTIONS:
   --halp, --haaaaalp  HALP [$SHOW_HALP, $HALPPLZ]
   --version, -v       print the version
```

## 版本标志

+ 默认情况下版本是通过`cli.VersionFlag`标识符来指定的，在cli内部，`cli.VersionPrinter`将会获取它来打印`App.Version`

```
package main

import (
	"os"

	cli "gopkg.in/urfave/cli.v1"
)

func main() {
	cli.VersionFlag = cli.BoolFlag{
		Name:  "print-version, V",
		Usage: "print only the version",
	}

	app := cli.NewApp()
	app.Name = "partay"
	app.Version = "19.99.0"
	app.Run(os.Args)
}
```

```sh
>>> make bin && ./bin/watcher -V                                                                     18:09:26 (04-21)
go build -o bin/watcher
partay version 19.99.0
>>> make bin && ./bin/watcher -v                                                                     18:09:29 (04-21)
go build -o bin/watcher
Incorrect Usage. flag provided but not defined: -v
```

+ 也可以通过更改`cli.VersionPrinter`来修改打印 Version 的函数
 
```go
package main

import (
  "fmt"
  "os"

  "github.com/urfave/cli"
)

var (
  Revision = "xiaofafa"
)

func main() {
  cli.VersionPrinter = func(c *cli.Context) {
    fmt.Printf("version=%s revision=%s\n", c.App.Version, Revision)
  }

  app := cli.NewApp()
  app.Name = "partay"
  app.Version = "19.99.0"
  app.Run(os.Args)
}
```

```sh
>>> make bin && ./bin/watcher -v                                                                     18:10:12 (04-21)
go build -o bin/watcher
version=19.99.0 revision=xiaofafa
```

## 示例代码

+ [Cli 学习示例代码](https://gist.github.com/bwangelme/078d4dab53b89e06a14572611c6e95e8)

