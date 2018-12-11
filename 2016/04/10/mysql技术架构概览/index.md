
__摘要__:

> 学习 MySQL 课程时的相关笔记
> 仅仅对 MySQL 的整体做的大概介绍


<!--more-->

## MySQL 逻辑架构

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="border:1px solid #000;display:block;width:500px; height:400px;" src="https://www.processon.com/embed/57e696f4e4b091465ae113e0">
</iframe>

## MySQL锁机制

元数据锁
表级锁
存储引擎内部锁
全局读锁

## MySQL锁流程

1. SQL分析
2. 打开表（元数据锁）
3. 等待全局读锁
4. 表级锁
5. 执行SQL语句（存储引擎内部锁）
6. 释放表级锁
7. 释放元数据锁

## 锁粒度

### 表级锁

开销小，加锁快！锁的粒度大，发送冲突概率高，并发的最低

### 表级锁的锁模式

表共享读锁和表独占写锁

MyISAM只支持表锁

读锁会阻塞写，但是不会阻塞读，写锁则会把读和写都阻塞


### 行级锁

开销稍大，加锁慢，锁定粒度最小，会出现死锁，发生锁冲突概率最低
并发度最高

### 页面锁

开销和加锁时间介于表级锁和行级锁之间，会出现死锁，锁定粒度介于表锁和行锁之间，并发粒度一般

## MySQL事务

### 定义事务的方法

```sql
start transaction;
SQL 语句
commit;
```

### 事务的ACID特性

原子性 `Atomic`: 要么全部成功，要么全部回滚
一致性 `Consistency`: 数据库总是从一个一致性状态转到另一个一致性状态
隔离性 `Isolation`: 通常来讲，一个事务的修改提交以前，对其他事务不可见
持久性 `Durability`: 一旦提交，所做的修改就会永久保存到数据库中

## MySQL的开发模式

社区版： 免费，不提供技术支持
企业版：付费，提供新特性和技术支持

### 按更新发布分为：
GA(General Availability): 官方推荐的版本
RC(Release Candidate): 候选版本，最接近正式版本
beta 和 alpha版本
