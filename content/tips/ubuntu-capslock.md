---
title: "Ubuntu 将 capslock 映射成 esc"
date: 2022-02-24T20:45:00+08:00
lastmod: 2022-02-24T20:45:00+08:00
draft: false
tags: [tips, ubuntu]
author: "bwangel"
comment: true
---

<!--more-->

---

## Tips

```sh
sudo apt-get install dconf-tools
# 使 caps 成为 esc 按键
dconf write /org/gnome/desktop/input-sources/xkb-options "['caps:escape']"
# 交换 caps 和 esc 按键
dconf write "/org/gnome/desktop/input-sources/xkb-options" "['caps:swapescape']"
```

- caps 配置的说明

```
Caps Lock behavior

┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│Option                         Description                                                                          │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│caps:internal                  Caps Lock uses internal capitalization; Shift "pauses" Caps Lock                     │
│caps:internal_nocancel         Caps Lock uses internal capitalization; Shift does not affect Caps Lock              │
│caps:shift                     Caps Lock acts as Shift with locking; Shift "pauses" Caps Lock                       │
│caps:shift_nocancel            Caps Lock acts as Shift with locking; Shift does not affect Caps Lock                │
│caps:capslock                  Caps Lock toggles normal capitalization of alphabetic characters                     │
│caps:shiftlock                 Caps Lock toggles Shift Lock (affects all keys)                                      │
│caps:swapescape                Swap Esc and Caps Lock                                                               │
│caps:escape                    Make Caps Lock an additional Esc                                                     │
│caps:escape_shifted_capslock   Make Caps Lock an additional Esc, but Shift + Caps Lock is the regular Caps Lock     │
│caps:backspace                 Make Caps Lock an additional Backspace                                               │
│caps:super                     Make Caps Lock an additional Super                                                   │
│caps:hyper                     Make Caps Lock an additional Hyper                                                   │
│caps:menu                      Make Caps Lock an additional Menu key                                                │
│caps:numlock                   Make Caps Lock an additional Num Lock                                                │
│caps:ctrl_modifier             Make Caps Lock an additional Ctrl                                                    │
│caps:none                      Caps Lock is disabled                                                                │
│                                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 参考链接

- [How to permanently switch Caps Lock and Esc](https://askubuntu.com/a/365701/581894)
- [jammy 22.04: how to map Capslock to ctrl and esc](https://askubuntu.com/a/1415659/581894)
- man 7 xkeyboard-config
