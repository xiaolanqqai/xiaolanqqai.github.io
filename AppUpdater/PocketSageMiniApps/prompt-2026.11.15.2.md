# 墨本 AI 小应用制作前提概要（提示词 v3.3）

> **最低固件版本：2.9.67**（`.lua` 单文件包安装、`sys.lib` 公共库、`on_idle` 空闲回调自 2.9.54 / 2.9.33 / 2.9.47 起可用；统一状态行 `kit.draw_status` 自 2.9.65 起可用；标题栏 40..84、正文 88、底栏 756..800 的几何自 2.9.67 起生效）
>
> 用途：把本文件整段交给 AI（或作为设备端 AI 对话上传的素材），让它直接产出能在设备上运行的小应用。
> 设备端：ESP32-S3 / 480×800 单色墨水屏 / 四按键；小应用运行在固件内置的 Lua 5.4 沙箱里。
>
> **交付物：一个 `.lua` 单文件包**（见第 4 节）。文件管理器长按它即可安装；发布时也只上传这一个文件。

---

## 1. 一句话约束（先记住这些，再动笔）

| 项目 | 限制 |
|---|---|
| 语言 | Lua 5.4（无 `io`、`os`、`package`、`debug`、`require`、`dofile`、`loadfile`、`print`、`load`） |
| 可用标准库 | `base`（部分）、`table`、`string`、`math`、`utf8`、`coroutine` |
| 单脚本大小 | ≤ 96KB（UTF-8 字节数，含 `--!` 头部） |
| 应用数量 | ≤ 16 个 |
| 应用 id | `^[a-z0-9][a-z0-9_-]{0,15}$`（小写字母/数字/下划线/连字符，≤16 字符） |
| 内存 | 每个应用最多 2MB 的 Lua 堆（PSRAM）；超出即报 "not enough memory" |
| 单次回调耗时 | ≤ 3 秒（`draw()` / `on_key()` / `on_idle()` 各算一次；超时被强制中断） |
| 持久化 | `store` 键值，整体 ≤ 4KB；键 ≤32 字符、值 ≤200 字符，均不可含换行，键不可含 `=` |
| 本地缓存 | `cache` 每应用 2MB，自动淘汰最久未更新的一条 |
| 网络 | `net.get/post` 只支持 `http://` / `https://`，同步阻塞（数秒级），一次回调最多一两个请求 |
| 绘制 | 单色 1bpp，无灰度、无抗锯齿；坐标与宽高越界会被裁剪 |

**禁止**：死循环、`while true do end`、在顶层做耗时计算、递归无上限、一次画几十万个像素（大填充矩形会被逐像素循环拖死）。

### 1.1 编码与标点（设备报"语法错误"的头号原因）

- 脚本必须是 **UTF-8 无 BOM**。带 BOM 时 Lua 会报 `unexpected symbol near '<\239>'`。
- **代码部分只允许半角 ASCII**：括号 `()`、逗号 `,`、冒号 `:`、引号 `"`、等号 `=`、注释 `--` 都必须用半角。
  全角 `（），：""''` 只能出现在字符串或注释里，否则直接编译失败。
- 字符串一律用半角 `"..."` 或 `'...'`，不要用中文引号 `“”`。
- 不要使用 Lua 没有的语法：`+=`、`++`、`continue`、`switch`、三元 `? :`、`/* */` 注释。
- `if` / `elseif` 必须带 `then`；`if` / `for` / `while` / `function` 必须闭合 `end`。
- **直接定义全局 `function draw()`**，不要写 `local function draw()` 再补一层全局包装——那会变成自我递归。
- 建议保存前用本机 Lua 5.4 做一次编译检查：`luac -p main.lua`，输出为空即通过。

---

## 2. 屏幕与版式（480×800 竖屏）

```
y=0     ┌──────────────┐
        │ 状态栏 40px  │  ← 仅空闲页由框架绘制，小应用页不画
y=40    ├──────────────┤
        │ 标题栏 44px  │  ← ui.title(...)：一级黑底白字 / 二级白底+下框
y=84    ├──────────────┤
y=88    │  正文起点     │  ← ui.content_top()，不得在其上方绘制任何像素
        │  行高 36 步进 │  ← 正文一屏 16 行
        │  列表行高 64  │  ← 一屏 10 行；值右对齐 x=460；行间 1px 分隔线
y=746   ├──────────────┤  ← 正文安全下沿（746）
y=756   ├──────────────┤  ← 底栏 1px 上框线（满宽）
        │ 提示条 44px   │  ← 单行：文字 y=762、0.65 倍、左 16 起；右侧 56px 页码槽
y=794   │ ▓▓▓ 进度线    │  ← 3px，仅活动态
y=800   └──────────────┘
```

> `ui.title` 不再占用正文：标题栏固定 40..84，正文从 `ui.content_top()=88` 开始。
> `kit.TOP` 就是 88，`kit.FOOTER_H` 是 44；自定义版式只用这两个常量，不要写死 50/54/756。
> 底栏只有一行；确实放不下时固件按「第一行 3 秒、第二行 3 秒」交替，**不要主动写两行**。

- 逻辑坐标：左上角 `(0,0)`，宽 480、高 800；`ui.size()` 返回的就是这两个值。
- 建议版式：`ui.title()` 放标题；`ui.text()` 放详情（从 88 起）；`ui.footer()` 放操作提示（页码用第二参数）。
- 中文用内置 28px 点阵字体（覆盖 ASCII + 中文标点 + GB2312 一级汉字）；生僻字显示为空白，**请用常用字**；Emoji、繁体生僻字一律不要用。
- 超过一屏的列表/正文要自己分页：列表行高 64、正文行高 `ui.line_height()`（36）；文字按 `ui.measure` 逐字断行（可用 `ui_kit.wrap_lines`，见第 5 节）。
- **`ui.text` 会自动折行**：凡是"一行写满"的文案，必须自己先按宽度换行再逐行推进，否则长句折行会压到下一块文字。

### 2.1 视觉约束（固件 2.9.66 起，违反其中数值的稿子一律退回）

```text
【墨本 ai 小应用视觉约束 v1】
屏幕 480×800，1bpp，只有纯黑与纯白，无灰阶。
1) 标题调用 ui.title(文字)，≤11 个汉字；一屏只允许一个标题。
2) 正文从 ui.content_top() 开始（y=88），不得在其上方绘制任何像素。
3) 字号只用 28px 的三档缩放：1.0 / 0.85 / 0.65；中文不得小于 0.65。
4) 单行中文 ≤16 字；必须手动换行，禁止依赖 ui.text 的自动折行。
5) 左右边距 16，安全宽 448；间距只用 8 / 16 / 24 三档。
6) 列表行高 64：标签 x=20，值右对齐到 x=460；行间画 1px 分隔线，最后一行不画。
7) 选中态：列表整行反白 rect(8, y+2, 464, 60) + 白字；网格用 2px 外框，不填黑。
8) 按钮宽 448、高 56、1px 外框、文字居中；一屏最多 1 个主按钮。
9) 危险操作必须二次确认；确认按钮反白，文案以 "!" 开头（如 "! 删除"）。
10) 图标 24×24、线宽 2px、直角；只复用公共字形，不自绘细节。
11) 底栏只有一行（44px，756..800），文案 ≤20 汉字；超长由固件按 3 秒交替显示两段，不要主动写两行；页码用 page 参数放右侧槽。
12) 长任务每 ≤8 秒调用一次 progress(phase, pct)；禁止自绘浮层或转圈。
13) 空列表显示"暂无内容"并给出下一步提示，不画选中框。
14) 所有请求超时 ≤8 秒；失败必须给出中文原因和可重试入口。
15) 禁止：渐变、阴影、圆角、灰字、半透明、抖动做灰、整屏反白、动画。
```

---

## 3. 按键模型与回调框架

| 动作名 | 物理键 | 约定语义 |
|---|---|---|
| `prev` | 左键 | 上移 / 上一项 / 上一页 |
| `next` | 右键 | 下移 / 下一项 / 下一页 |
| `ok` | 语音键（短按） | 确认 / 执行 |
| `back` | 电源键（短按） | 返回 / 退出小应用 |
| `prev_long` / `next_long` / `voice_long` | 长按 | 自定义（返回上级 / 打开文件信息等） |

框架对脚本的调用契约：

1. 进入应用：执行脚本顶层一次 → 调用一次 `draw()`。
2. 每次按键：先回调 `on_key(action)`，框架随后统一调用 `draw()` 并局部刷新。
3. **空闲回调 `on_idle()`**（2.9.47 起）：松开按键 0.6 秒后每约 0.3 秒调用一次；**返回 `true` 时框架自动重绘一次（局刷）**；一旦有新按键就停。
   这是后台取图 / 预取 / 逐条加载的唯一正确入口（见 3.1 非阻塞范式）。

要点：
- `on_key` 里**不要**再主动 `draw()` + `ui.flush()`，状态改完直接返回；只有阻塞网络请求前先画「加载中」并 `ui.flush()`（局刷），首次进入可用 `ui.flush(true)` 整屏刷一次。
- `draw()` / `on_key()` / `on_idle()` 各有 3 秒上限；网络请求返回后框架会顺延本次回调的时间上限，慢接口不必自己控时。
- 没有定时器/动画；"进度/计时"效果只能靠 `on_idle` 逐步推进。

### 3.1 非阻塞范式（翻页 / 加载必备，漫巴士即范例）

```lua
-- on_key 只登记意图，绝不就地取图
function on_key(action)
  if action == "next" then
    if reader.index < reader.pages then
      reader.target = reader.index + 1   -- 只登记目标页
      if reader.target == reader.index + 1 then
        -- 缓存命中时可直接显示：登记后由 draw() 用本地缓存立即渲染
      end
    end
  end
end

-- 空闲时每次只做一小步：取一张图 / 预取下一张
function on_idle()
  if reader == nil or reader.target == nil then return false end
  -- 有新按键就先让位：sys.pending() 判断本回调期间是否来了按键
  if sys.pending and sys.pending() then return false end
  local data = fetch_page(reader.target)   -- 阻塞网络请求放在 on_idle 里做
  if data then
    reader.image = data
    reader.index = reader.target
    reader.target = nil
    return true                             -- 返回 true → 框架局刷显示新页
  end
  return false
end

function draw()
  if reader.image then
    ui.image(reader.image)
    ui.footer("第 " .. reader.index .. " / " .. reader.pages .. " 页")
  else
    ui.center("第 " .. (reader.target or reader.index) .. " 页加载中…", H / 2)
    ui.footer("正在加载 · 电源退出")        -- 加载中显示状态，不留空白
  end
end
```

规则：
- `on_key` 只改状态变量；网络请求全部挪进 `on_idle`（或用户明确确认前的"加载中"页）。
- `on_idle` 每次调用只做**一个**网络动作，做完 `return true` 让框架刷新；没活干 `return false`。
- 加载未完成时 `draw()` 必须画出加载状态文字，绝不允许整屏空白等待。

### 3.2 状态与进度反馈（2.9.65 起统一规范）

固件底栏是全局状态通道：固件任务（挑战、同步、下载）进行时，底栏会自动显示当前活动，结束后恢复页面提示。**小应用不要自绘状态条/进度框**，统一写底栏：

```lua
local kit = sys.lib("ui_kit")

-- 不确定进度：阶段词 + 已用时间（由 on_idle 每秒累加）
kit.draw_status("加载中", { subject = "第 3 页" })

-- 确定进度：有总长才写百分比
kit.draw_status("下载中", { index = 2, total = 3, percent = 45 })  -- 下载中 2/3 · 45%

-- 失败：原因 + 下一步（一行放不下就只留“语音键重试”）
ui.footer("更新失败 · 语音键重试")
```

规则：

- **只写一行**：阶段词（≤6 个汉字）+ 可选对象 + 可选 `i/N` + 可选百分比；不要换行、不要多行堆叠。
- **不确定进度不要编百分比**：用阶段词 + 已用秒数（`加载中 · 5s`）或 `i/N`。
- **不画动画/转圈/自绘进度条**；1bpp 墨水屏只接受离散步进。
- **刷新节流**：状态变化至少间隔 1.5 秒再 `ui.flush()`；同一操作最多刷 4–8 次。`on_idle` 返回 true 会触发框架局刷，不要再叠加手动 flush。
- **不要用 `ui.flush(true)` 刷进度**：整屏刷新会黑闪且耗时约 1.6 秒；`true` 只用于切页/首次进入。
- 阶段词白名单：`加载中`、`下载中`、`上传中`、`校验中`、`安装中`、`同步中`、`连接中`、`计算中`、`读取中`。

### 3.3 超时、重试与错误

- `net.get(url, timeout_ms)` 的 `timeout_ms` 是**整个请求预算**，默认 15000。建议：小接口 8000、列表/文本 15000、图片 25000。
- 固件网络层已对连接失败/5xx/不完整响应做 3 次重试（500ms/1500ms，流式下载不重试）。**脚本不要再套一层重试**，否则弱网下一次回调会被拖到十几秒。
- 失败返回 `nil, 错误`，错误以 `ERR ` 开头；用 `kit.error_text(err)` 去掉前缀并限长，只展示一行原因，动作交给底栏提示。
- 业务错误（无权限、文件不存在、参数错）不要重试；只有超时/连接类错误值得用户手动再试。
- 不要假设有流式下载接口：`net.get` 会一次性收完响应体；大内容请用 `cache` 分页 + `on_idle` 逐页拉取（单条缓存读取上限 128KB）。

---

## 4. 交付格式：`.lua` 单文件包（2.9.54 起）

**一个应用 = 一个 `.lua` 文件**。脚本头部用 `--!` 注释声明元数据，这就是安装信息与版本号的唯一真源：

```lua
--! id: clock
--! name: 时钟
--! version: 1.0

-- 以下是正常脚本代码……
```

规则：
- `--!` 元数据块必须出现在文件开头（允许普通注释行穿插，遇到第一行代码即结束）。
- `id` 必填且符合 `^[a-z0-9][a-z0-9_-]{0,15}$`；`name` 建议 ≤ 8 个汉字；`version` 缺省按 `1.0`。
- **安装**：把 `.lua` 放进共享目录（或设备存储），文件管理器里长按 → 「安装为小应用」。安装器自动写入 `/assets/apps/<id>/main.lua` 并生成 `app.json`，用户数据（store/缓存）保留。
- **AI 对话修改**：把已装应用的 `.lua`（文件管理器可见）上传给 AI 改完再装回即可，无需传 app.json。
- **发布**：只上传这个 `.lua`；打包脚本从脚本头反推 app.json 与版本号。
- 兼容旧流程：目录形式（`app.json` + `main.lua`）仍然支持。

---

## 5. 公共库 `sys.lib`（2.9.54 起）

设备内置公共库目录 `/assets/apps/.lib/`，由「小应用管理 → 制作提示词」同步入口从 GitHub 更新。脚本用 `sys.lib(name)` 加载（**沙箱没有 `load`，必须走固件编译**）：

```lua
local kit = sys.lib("ui_kit")        -- 返回库文件的返回值（必须是 table）
if not kit then
  -- 库缺失 / 语法错误 / 名字非法：返回 nil, 原因
end
```

- 库名只允许小写字母/数字/`_`/`-`，≤16 字符；同一脚本内重复调用直接复用缓存，零开销。
- 库文件对脚本只读；库代码的内存计入本应用的 Lua 堆（2MB），报错信息带 `@.lib/<名>.lua` 路径。
- **建议所有新应用都引用 `ui_kit`**：文本排版、图标、田字格布局常量统一走库，风格一致、体积更小。

### ui_kit v4 内容速览（2.9.67 起）

```lua
local kit = sys.lib("ui_kit")
-- 布局常量（随屏幕自动计算）
kit.W, kit.H            -- 480, 800
kit.TOP, kit.LH, kit.FOOTER_H    -- 正文起点 88、行高 36、底栏高 44
kit.CONTENT_BOTTOM      -- 正文安全下沿 746
kit.MARGIN, kit.GAP     -- 16, 16
kit.GRID_Y, kit.GRID_BOTTOM      -- 田字格区域上下沿
kit.CELL_W, kit.CELL_H           -- 田字格单元尺寸
kit.COVER_W, kit.COVER_H         -- 网格封面 140×186
kit.DETAIL_TOP, kit.DETAIL_BOTTOM-- 详情列表区域
kit.SELF_COVER_W, kit.SELF_COVER_H, kit.SELF_ROW_H   -- 详情本作行
kit.REL_COVER_W, kit.REL_COVER_H, kit.REL_ROW_H, kit.REL_TEXT_X -- 推荐行
kit.LIB_ROW_H, kit.LIB_COVER_W, kit.LIB_COVER_H, kit.LIB_TOP, kit.LIB_ROWS -- 收藏/历史列表
kit.CHAR  -- UTF-8 切分 pattern；kit.TAB = "\t"

-- 结构件（新应用优先用这些，不要再自己算坐标）
kit.header(title, { level = "primary"|"secondary" })
kit.footer(text, { page = "2/7" })   -- 页码放右侧槽，不参与截断
kit.progress(phase, pct, { index = 2, total = 3, elapsed = 12 })
kit.list(items, sel, { top = kit.TOP, row = 64 })  -- → 夹紧后的 sel, 可视行数
kit.grid(items, sel, { cols = 2, cover_w = 150, cover_h = 200 })  -- 2px 选中框
kit.button(label, { y = 680, danger = false, focused = true })
kit.dialog(title, lines, { ok = "确认", cancel = "取消", danger = true })
kit.icon(name, x, y, size)   -- chevron/check/cross/dot/folder/file/star
kit.divider(y, x1, x2)       -- 1px，默认左右内缩 16

-- 文本排版
kit.wrap_lines(text, width)      -- 识别 \n 与自动换行 → 行数组（kit.wrap 同义）
kit.fit_line(text, width)        -- 超宽截断加一个 "…"（kit.fit 同义）
kit.truncate_utf8(text, limit)   -- 按字节截断且不切半个汉字
kit.center_in(text, x, y, width) -- 在 [x, x+width) 内水平居中画一行
kit.measure(text, scale)         -- 文字宽度；scale 仅用于 0.85/0.65 的换算

-- 状态行（统一走底栏，不要再自绘进度框）
kit.status_line(phase, opts)     -- phase + subject + i/N + percent/elapsed
kit.draw_status(phase, opts)     -- 等价于 ui.footer(kit.status_line(...))
kit.error_text(err)              -- 去掉 "ERR " 前缀、限长后的一行错误文案

-- 绘制
kit.draw_frame(x, y, w, h)       -- 双线选中框（旧接口，保留兼容）
kit.STAR_PBM                     -- 20×20 五角星位图（字库无 ★，ui.image 贴图）
kit.show_loading(title, line)    -- 「加载中」页 + 整屏刷新（冷启动/切页用）
```

---

## 6. 脚本 API（全部可用，无需 require）

### ui —— 绘制

| 调用 | 说明 |
|---|---|
| `ui.clear()` | 清屏（全白），状态栏由框架补画 |
| `ui.title(text, secondary)` | 标题栏 40..84：不传/`false` 一级黑底白字，`true` 二级白底+下框 |
| `ui.text(text, x, y, width)` | 画文字；`width` 自动换行；返回占用高度；y 默认 `content_top()` |
| `ui.text_inv(text, x, y, width)` | 同上，反色文字（黑条上的白字） |
| `ui.center(text, y)` | 指定 y 居中一行 |
| `ui.menu(items, selected)` | 单列列表（0 基下标），y=88 起、行高 64、选中整行反白；单次 ≤10 项 |
| `ui.rect(x, y, w, h, filled)` | 矩形；越界裁剪 |
| `ui.hline(x, y, w)` | 水平分割线 |
| `ui.footer(text, page)` | 底栏单行（44px，756..800）；`page` 显示在右侧 56px 槽位；超宽时固件切两段并按 3 秒交替，绝不换行 |
| `ui.size()` | `宽, 高` |
| `ui.measure(text)` | 文字像素宽度 |
| `ui.image(pbm, x, y)` | 画网关下发的 P4 PBM（480×800 内），成功返回 `true` |
| `ui.flush()` / `ui.flush(true)` | 立即刷新：不传=局刷，`true`=整屏（切页用） |
| `ui.content_top()` / `ui.line_height()` | 正文起点 y（88）/ 当前行高（36） |

### store / cache / fs

| 调用 | 说明 |
|---|---|
| `store.get(key)` / `store.set(key, value)` | 键值持久化（≤4KB）；非法输入静默失败 |
| `cache.get/set/del/clear/size/list` | 本地缓存 2MB/应用，二进制安全，超配额自动淘汰 |
| `fs.list(dir)` | 列 `/assets/apps` 下 `dir`；每行 `类型<TAB>名称<TAB>字节数` |
| `fs.read(path)` | 读文件（≤96KB），失败 `nil, 原因` |
| `fs.size(path)` / `fs.remove(path)` | 字节数 / 删除文件或目录（2.9.39 起，文件管理器用） |

`fs` 只能读 `/assets/apps` 内文件，禁止 `..`、绝对路径、反斜杠。旧固件没有 `cache`/`fs` 时先判 `if cache then ... end`。

### net / sys

| 调用 | 说明 |
|---|---|
| `net.get(url, timeout_ms)` | 成功返回响应体（二进制安全）；失败 `nil, 错误` |
| `net.post(url, body, content_type)` | 同上，`content_type` 默认 `application/json` |
| `sys.log(text)` | 串口日志（调试） |
| `sys.exit()` | 退出小应用 |
| `sys.env("gateway")` / `sys.env("token")` | 网关地址 / 设备令牌（拼 `?token=`） |
| `sys.pending()` | 本次回调期间是否来了新按键（`on_idle` 分步加载时让位用） |
| `sys.lib(name)` | 加载公共库（见第 5 节，2.9.54 起） |
| `sys.set_wallpaper(kind, pbm)` | 设桌面/关机壁纸（P4 PBM，2.9.31 起） |
| `sys.ota_flash(source, path, size)` | 从文件刷机；`sys.app_reset(id)` / `sys.app_write(id, name, data)` 安装小应用（文件管理器用） |

### 网关文件端点（共享目录，SMB 由网关代读）

| 端点 | 返回 |
|---|---|
| `GET /device/files/list?path=` | 每行 `类型<TAB>名称<TAB>字节数` |
| `GET /device/files/text?path=` | UTF-8 正文（>48KB 或含 NUL 返回 `ERR …`） |
| `GET /device/files/image?path=&w=&h=` | P4 PBM（PNG/JPG 经网关转码） |

错误统一 `ERR 中文原因` 开头，见到前缀即当失败处理。

---

## 7. 脚本骨架（照这个结构写）

```lua
--! id: clock
--! name: 时钟
--! version: 1.0

-- 公共库：排版/布局统一走 ui_kit（2.9.54 起）
local kit = sys.lib("ui_kit")
if not kit then
  function draw()
    ui.clear()
    ui.title("时钟")
    ui.center("需要固件 2.9.54 以上", 300)
    ui.center("请在「小应用管理→制作提示词」同步公共库", 340)
    ui.footer("电源退出")
  end
  function on_key(action)
    if action == "back" then sys.exit() end
  end
  draw()
  ui.flush(true)
  return
end

local W, H, TOP, LH = kit.W, kit.H, kit.TOP, kit.LH
local sel = 1
local items = { "项目一", "项目二", "项目三" }

function draw()
  ui.title("时钟")
  ui.text("当前项：" .. tostring(sel), 20, 88, W - 40)
  ui.menu(items, sel - 1)          -- menu 用 0 基下标
  ui.footer("左右选择 · 语音确认 · 电源退出")
end

function on_key(action)
  if action == "prev" then
    sel = sel < 2 and #items or sel - 1
  elseif action == "next" then
    sel = sel > #items - 1 and 1 or sel + 1
  elseif action == "ok" then
    -- 执行选中项
  elseif action == "back" then
    sys.exit()
  end
end

draw()
ui.flush(true)
```

要点：
- 必须有全局 `draw()`；`on_key` / `on_idle` 可不写。
- `sys.lib` 失败时给出可读的降级页面（如上），不要裸报错。
- 跨启动保留的状态用 `store`；大对象（图片、长文本）用 `cache`。

---

## 8. 发布与调试

投放方式（任选其一）：
1. **单文件安装**：`.lua` 放共享目录 → 设备文件管理器长按「安装为小应用」。
2. **网关管理页**：`http://<电脑IP>:8787/device/apps/ui?token=<设备令牌>` 填表发布。
3. **直接放文件**：写入 `~/.dsh-remote/apps/<id>/{app.json,main.lua}`，设备按 hash 增量同步。

设备侧：
- 主菜单 →「小应用管理」：安装/更新、删除、版本详情；「制作提示词」行可把本提示词与公共库同步到设备。
- AI 对话上传文件时可直接选用设备上的 `.prompt.md`（本文件）与应用 `.lua`。

调试：
- `sys.log()` 打点 + 串口日志；报错直接显示在墨水屏上，照提示改。
- 脚本编译失败时固件会清掉本地 hash，下次同步自动重新下载修复。

### 8.1 已废弃 / 不再推荐的写法

| 旧写法 | 问题 | 新写法 |
|---|---|---|
| 自己用 `ui.rect` + `ui.text` 画进度框/百分比 | 与固件底栏状态通道重复，遮挡正文，整屏刷新代价高 | `kit.draw_status("下载中", {index=i,total=n,percent=p})` |
| 用 `ui.flush(true)` 刷每次进度 | 每次约 1.6s 黑闪，进度反而更慢 | 底栏文案 + `ui.flush()`，间隔 ≥1.5s |
| 在脚本里写重试循环（3 次以上） | 固件网络层已重试 3 次，叠加后单次回调可达十几秒，触发超时 | 只展示失败原因，由用户按键重试 |
| 把加载状态画在屏幕中央/顶部自绘 | 与底栏状态重复，页面跳动 | 底栏 `kit.draw_status("加载中")`；只有冷启动/切页才用 `kit.show_loading` |
| `ui.footer` 里写多行长文案 | 底栏单行，超宽会被裁切 | 阶段词 + 关键数字；详情放正文 `ui.text` |
| 把页码拼进 footer 文本（`ui.footer("… 2/7")`） | 页码参与截断，长文案会把页码挤掉 | `ui.footer("…", "2/7")` 或 `kit.footer(text, {page="2/7"})` |
| 自己排版两行底栏 / 依赖 54px 高度 | 2.9.67 起底栏只有 44px 单行，第二行会被裁掉或与正文重叠 | 文案压到 ≤20 字；确实超长交给固件 3 秒交替显示 |
| 在 `TOP+6/8/34` 等处写字给标题让位 | 2.9.66 起标题栏独立，正文起点就是 88，额外偏移会留白或压字 | 正文一律从 `ui.content_top()` / `kit.TOP` 开始 |
| 用 `y = y + LH` 推进长句段落 | `ui.text` 自动折行后仍按一行推进，下一块文字被叠印 | 先 `kit.wrap_lines(text, width)` 再逐行推进 |

---

## 9. 交付自查清单

- [ ] 头部 `--! id/name/version` 齐全，id 符合 `^[a-z0-9][a-z0-9_-]{0,15}$`
- [ ] 有全局 `draw()`；所有绘制 3 秒内完成
- [ ] 引用了 `sys.lib("ui_kit")`，且库缺失时有降级页面
- [ ] 翻页/加载走 `on_key 登记意图 → on_idle 分步执行 → draw 显示加载状态`，无整屏空白
- [ ] `on_idle` 每次只做一个网络动作并正确返回 true/false；用了 `sys.pending()` 让位
- [ ] `ui.text` 的 y 在 88~120，不与 `ui.menu`（y=88 起、行高 64）重叠；`ui.menu` 单次 ≤10 项
- [ ] 长句先用 `kit.wrap_lines` 换行；单行中文 ≤16 字，没有依赖自动折行压到下一块
- [ ] 底栏 ≤20 汉字，页码走 `ui.footer(text, page)` 右槽，没有把页码拼进正文，也没有自己排两行
- [ ] 选中态为整行反白 `rect(8,y+2,464,60)`、值右对齐 x=460、行间 1px 分隔线（最后一行不画）
- [ ] 状态/进度只写底栏（`kit.draw_status`），没有自绘进度框；进度刷新间隔 ≥1.5s，未用 `ui.flush(true)` 刷进度
- [ ] 四键语义明确，`back` 能退出；所有网络请求判空
- [ ] `store` < 4KB；脚本 UTF-8 无 BOM、≤96KB、只用常用汉字；代码全半角标点
- [ ] 没有 io/os/require/print/load，没有死循环与超大实心矩形
