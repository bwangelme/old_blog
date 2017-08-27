#!/bin/bash
#
# Author: bwangel<bwangel.me@gmail.com>
# Date: 8,27,2017 19:07

######################
#
# 本脚本的主要目的是查找所有文章的摘要部分，
# 如果文字“摘要”和下面的内容没有按照空行分开，
# 那么就在“摘要”和内容之间添加一个空行
#
######################

grep -E -nR '摘要' -A 2 ./content/post/*.md | \

gawk '
BEGIN {
    RS="--\n";
    FS="\n";
}
{
    if (!($2 ~ /.*-$/)) {
        print $1
    }
}

' | cut -d':' -f 1 | xargs -I{} sed -i "" '/摘要/G' {}
