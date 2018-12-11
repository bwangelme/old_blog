
__摘要:__

> 1. MySQL 语句中 from 部分的子查询


<!--more-->

## 子查询的解释

子查询在 SELECT 语句的 FROM 部分是合法的，实际的语法是：

> SELECT ... FROM (subquery) [AS] name ...

`[AS] name` 部分是必须的，因为 FROM 部分中的每一个表都必须有一个名字。在子查询中 SELECT 的每一列都必须有一个独一无二的名字。

## 子查询的例子

### 一个简单的例子

为了方便演示，我们假设创建了这样的一个表。

```sql
CREATE TABLE t1(s1 INT, s2 CHAR(5), s3 FLOAT);
```

然后我们向其中插入了如下的数据：

```sql
INSERT INTO t1 VALUES (1, '1', 1.0)
INSERT INTO t1 VALUES (2, '2', 2.0)
```

最后我们执行一个如下的查询：

```sql
SELECT sb1, sb2, sb3
    FROM (SELECT s1 AS sb1, s2 AS sb2, s3*2 AS sb3 FROM t1) AS sb
    WHERE sb1 > 1;
+------+------+------+
| sb1  | sb2  | sb3  |
+------+------+------+
|    2 | 2    |    4 |
+------+------+------+
1 row in set (0.00 sec)
```

可以看到这里将子查询的结果构造成一个表 sb，并从中进行第二步的筛选。

### 从一个表中选出最后几个元素

如果我们想要选出某个表中最后几行怎么办呢，我今天就遇到了这个问题，感觉下面这个子查询的方式最令我满意：

```sql
SELECT * FROM (
    SELECT * FROM tmp_table ORDER BY id DESC LIMIT 50
    ) sub
    ORDER BY id ASC
```

在上面的例子中，我们首先在子查询中查询最后50行，但此时查询结果是逆序的。然后我们再在外面的查询中再来重新排序一遍，变成正序排列，此时我们就能获得`tmp_table`表中的最后50行了。

### 选出分组求和的平均数

这是 MySQL 官方文档上给出的一个例子，如果我们想要取出分组了的表的一组和的平均值，那么该怎么做呢？首先，这样查询肯定是错误的：

```sql
SELECT AVG(SUM(column 1)) FROM t1 GROUP BY column1;  -- error
```

此时我们就可以用到我们的子查询的语法了，我们可以这样写：

```sql
SELECT AVG(sum_column1)
    FROM (SELECT SUM(column1) AS sum_column1)
        FROM t1 GROUP BY column1) AS t1;
```

这里需要注意的是，在子查询中使用的`sum_column1`列在外部查询中也可以被识别出来。

## 参考链接：

+ [Select last N rows from MySQL](http://stackoverflow.com/questions/12125904/select-last-n-rows-from-mysql/12125925#12125925)
+ [Subqueries in the FROM Clause](http://dev.mysql.com/doc/refman/5.7/en/from-clause-subqueries.html)
