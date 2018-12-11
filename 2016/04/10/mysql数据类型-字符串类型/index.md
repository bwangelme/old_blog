
__摘要__:

> 这是一篇关于MySQL的文章，主要介绍MySQL数据类型-字符串类型


<!--more-->
字符串类型
==========

## 1. char字符串系列

存储用户的姓名，家庭住址，爱好，发布的文章等。

Char字符串系列|字节|描述|
----|----|----|
`char(M)`|M|M为0~255之间的整数|
`varchar(M)`|M|M为0~65535之间的整数|
注：汉字占两个字节|


+ `char`会占用定长字节的空间来进行存储,检索时会自动删除尾部空格
+ `varchar`会灵活地根据存储的值的长度来分配存储空间,检索时不会删除尾部空格。

```sql
create table c_v(
    v varchar(4),
    c char(4)
);

insert into c_v values('ab  ', 'ab  ')

select length(v), length(c) from c_v;
/* 结果会显示v和c字段长度的不同，char会自动忽略尾部的空格。*/

select concat(v, 'xff'), concat(c, 'xff') from test10;
/* concat是连接函数，从结果可以看到c后面没有空格。*/
```


## 2. TEXT系列字符串类型

|Text系列字符串类型|字节|描述|
|----|----|----|
|TINYTEXT|0~255|值的长度+2个字节|
|TEXT|0~65525|值的长度+2个字节|
|MEIDUMTEXT|0~16772150|值的长度+3个字节|
|LONGTEXT|0~4294967285|值的长度+4个字节|

## 3. BINARY系列字符串类型

|BINARY系列字符串类型|字节|描述|
|----|----|----|
|BINARY(M)|M|允许长度为0~M|
|VARBINARY(M)|M|允许长度为0~M|

## 4. BLOB系列字符串类型

|BLOB系列字符串类型|字节|
|TINYBLOB|0~255|
|BLOB|0~2^16|
|MEDIUMBLOB|0~2^24|
|LONGBLOB|0~2^32|

## 5. 枚举类型和集合类型

枚举类型ENUM 单选

集合类型SET 多选

示例：

```sql
mysql> create table student3(
    -> name varchar(100),
    -> sex enum('male', 'female'),
    -> hobby set('music', 'book', 'game', 'dance')
    -> );

insert into student3 values('xff', 'female', 'book,game');
```

## 6. 建议

**为了优化存储，任何情况下均应该使用最精确的类型**
