---
title: '看病记录Web.md'
date: 2016-04-10 10:56:54
tags: 项目计划
---

__摘要__: 这是一篇关于项目计划的文章，主要介绍看病记录Web
<!-- more -->
看病记录Web程序
===============

## 0. 整体设计

一个看病记录的web，记录每次看病去的医院，药品，价钱，以及往返时间等

医院，药品，疾病！单独列出来记录

## 1. 数据库设计，利用MySQL，图片文件存储于本地

```python
class Log():
  """看病记录表
    medicines: json 字符串
      medicines: {
        medicines: [
          medicine: IntegerField()  # 药品的表ID
          number: IntegerField()  # 药品的购买数量
        ]
      }
  """
  sickness = ForeignKey(Sickness)
  add_datetime = DateField()
  medicines = TextField(Medicine)
  hospital = ForeignKey(Hospital)
  symptom = ForeignKey(Symptom)
  start_time = TimeField()  # 启程时间
  end_time = TiemField()  # 返程时间


class Medicine():
  """药品表
  """
  approve_number = CharField()
  name = CharField()
  price = FloatField()
  url = CharField()
  comments = TextField()

  def to_json():
    """Medicine.to_json

    返回序列化后的字符串
    """
    pass


class Hospital():
  """医院表
  """
  position = CharField()
  name = CharField()


class Symptom():
  """症状表
  """
  img = FileField()  # 文件域，用来存储图片


class Sickness():
  """疾病表
  """
  name = CharField()
  comment = TextField()
```

## 2. Web接口设计

## 2.1 医院模块

`/hospital/new/` 添加医院

`/hospital/delete/` 删除医院

`/hospital/update/` 更改医院

`/hospital/hospital_id/` 查找id为hostpital_id的医院

## 2.2 药品模块

`/medicine/new/` 添加医院

`/medicine/delete/` 删除药品

`/medicine/update/` 更改药品

`/medicine/medicine_id/` 查找id为medicine_id的医院

## 2.3 看病记录模块

`/log/new/` 添加看病记录

`/log/delete/` 删除看病记录

`/log/update/` 更改看病记录

`/log/log_id/` 查找id为log_id的看病记录

`/log/all/` 显示所有看病记录

## 2.4 疾病模块

`/sickness/new/` 添加疾病

`/sickness/delete/` 删除疾病

`/sickness/update/` 更改疾病

`/sickness/sickness_id/` 查找id为sickness_id的疾病


## 3. 前端页面设计

## 3.1 index 页面

显示所有看病记录，存在分页机制

## 3.2 看病记录详情页

显示当前这个看病记录的详情

## 3.3 其他功能

增，删，改的功能先用Django的admin模块
