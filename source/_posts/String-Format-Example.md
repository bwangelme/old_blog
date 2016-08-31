---
title: Python字符串Format方法示例
date: 2016-08-31 15:45:41
tags: python
---

__摘要__:
> 本文翻译自Python3文档[6.1.3.2. Format examples](https://docs.python.org/3/library/string.html#format-examples)
> 主要讲述了Python`str.format()`的一些使用方法

<!-- more -->


这部分文档包括了`str.format()`函数的一些语法例子，以及和旧的`%`格式的一些比较。

在大多数的情况下`format`的语法和旧的`%`格式的语法是相似的，除了使用了额外的`{}`和`:`而不是`%`。例如，`%03.2f`能够被翻译成`{:03.2f}`。

新的格式化语法也支持新的不同的选择，这些都在下面的例子中进行展示。

+ 根据位置来访问参数:


```python
print('{0}, {1}, {2}'.format('a', 'b', 'c'))
```

    a, b, c



```python
print('{}, {}, {}'.format('a', 'b', 'c'))  # 3.1 only
```

    a, b, c



```python
print('{2}, {1}, {0}'.format('a', 'b', 'c'))
```

    c, b, a



```python
print('{2}, {1}, {0}'.format(*'abc'))  # 这里的abc当做参数列表`args`
```

    c, b, a



```python
print('{0}{1}{0}'.format('0000', '1111'))  # 参数的指示符可以被重复
```

    000011110000


+ 根据名字来访问参数


```python
'Coordinates: {latitude}, {longitude}'.format(latitude='37.42N', longitude='-115.81W')
```




    'Coordinates: 37.42N, -115.81W'




```python
coord = {'latitude': '37.42N', 'longitude': '-115.81W'}
'Coordinates: {latitude}, {longitude}'.format(**coord)  # 这里的coord被当做了键值对参数
```




    'Coordinates: 37.42N, -115.81W'



+ 访问参数的属性


```python
c = 3-5j
"复数C{0}是由实部{0.real}和虚部{0.imag}组成的".format(c)
```




    '复数C(3-5j)是由实部3.0和虚部-5.0组成的'




```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x,y
    def __str__(self):
        return "StrPoint({self.x}, {self.y})".format(**{'self': self})
    
str(Point(4, 2))
```




    'StrPoint(4, 2)'



+ 访问参数的元素


```python
coord = (3, 5)
"X: {0[0]}; Y: {0[1]}".format(coord)
```




    'X: 3; Y: 5'



+ 替换`%s`和`%r`


```python
"repr() show quotes: {!r}， str() doesn't: {!s}".format('test1', 'test2')
```




    "repr() show quotes: 'test1'， str() doesn't: test2"



+ 对齐文本和指定宽度


```python
'{:<30}'.format('left aligned')
```




    'left aligned                  '




```python
'{:>30}'.format('right aligned')
```




    '                 right aligned'




```python
'{:^30}'.format('center aligned')
```




    '        center aligned        '




```python
'{:*^30}'.format('centered')  # 使用*作为填充字符
```




    '***********centered***********'



+ 替换`%+f`， `%-f`， `% f`，同时指定符号


```python
'{:+f}, {:+f}'.format(3.14, -3.14)  # 总是显示符号
```




    '+3.140000, -3.140000'




```python
'{: f}, {: f}'.format(3.14, -3.14)  # 在正数前显示一个空格
```




    ' 3.140000, -3.140000'




```python
'{:-f}, {:-f}'.format(3.14, -3.14)  # 仅仅显示负号，和`%f`相同
```




    '3.140000, -3.140000'



+ 替换`%x`和`%o`，在不同的进制之间转换值


```python
# 格式化同时支持二进制数

"int: {0:d}; hex: {0:x}; oct: {0:o}; bin: {0:b}".format(42)
```




    'int: 42; hex: 2a; oct: 52; bin: 101010'




```python
# 拥有0x，0o，0b作为前缀

"int: {0:d}; hex: {0:#x}; oct: {0:#o}; bin: {0:#b}".format(42)
```




    'int: 42; hex: 0x2a; oct: 0o52; bin: 0b101010'



+ 使用逗号`,`作为千的分隔


```python
'{:,}'.format(1234567890)
```




    '1,234,567,890'



+ 表达一个百分数


```python
points = 19
total = 22
'Correct answers: {:.2%}'.format(points/total)
```




    'Correct answers: 86.36%'



+ 使用指定类型的格式化器


```python
import datetime
d = datetime.datetime(2016, 8, 31, 15, 15, 30)
"{:%Y-%m-%d %H:%M:%S}".format(d)   # %s返回的是时间戳
```




    '2016-08-31 15:15:30'



+ 嵌套参数和更复杂的例子


```python
for align, text in zip('<^>', ['left', 'center', 'right']):
    print('{0:{fill}{align}16}'.format(text, fill=align, align=align))
```

    left<<<<<<<<<<<<
    ^^^^^center^^^^^
    >>>>>>>>>>>right



```python
octets = [192, 168, 0, 1]
"{:02X}{:02X}{:02X}{:02X}".format(*octets)
```




    'C0A80001'




```python
int(_, 16)
```




    3232235521




```python
width = 5
for num in range(5, 12):
    for base in 'dXob':
        print("{0:{fill}{align}#{width}{base}}".format(num, fill="*", align="^", base=base, width=width), end=' ')
    print()
    
# 数字格式化器的顺序为填充，对齐，#，宽度，基数
```

    **5** *0X5* *0o5* 0b101 
    **6** *0X6* *0o6* 0b110 
    **7** *0X7* *0o7* 0b111 
    **8** *0X8* 0o10* 0b1000 
    **9** *0X9* 0o11* 0b1001 
    *10** *0XA* 0o12* 0b1010 
    *11** *0XB* 0o13* 0b1011 

