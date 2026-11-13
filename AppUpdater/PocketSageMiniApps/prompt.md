# 墨本 AI 小应用制作前提概要（提示词 v3.0）

> **最低固件版本：2.9.54**（`.lua` 单文件包安装、`sys.lib` 公共库、`on_idle` 空闲回调自 2.9.54 / 2.9.33 / 2.9.47 起可用）
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
| 本地缓存 | `cache` 每应用 1MB，自动淘汰最久未更新的一条 |
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
y=50    ├──────────────┤  ← 内容区起点（ui.content_top()）
y=52    │   页面标题    │  ← ui.title(...) 居中，约 28px 高
y=88    │  自定义文字   │  ← ui.text(...) 常用位置
y=130   ├──────────────┤  ← ui.menu / ui.list 的固定起点
        │  行高 66px   │  ← 一屏最多 9 行；选中行反白
        │      …       │
y≈752   ├──────────────┤  ← ui.footer(...) 提示栏（48px）
y=800   └──────────────┘
```

- 逻辑坐标：左上角 `(0,0)`，宽 480、高 800；`ui.size()` 返回的就是这两个值。
- 建议版式：`ui.title()` 放标题/主状态；`ui.text(x, y)` 放详情（y 建议 88 起）；`ui.menu()` 放可选项（自动从 130 开始）；`ui.footer()` 放操作提示。
- **`ui.menu` / `ui.list` 不会自动清屏**，固定从 y=130 往下画，所以 `ui.text` 的 y 必须小于 130 才不会重叠。
- 中文用内置 24px 点阵字体（覆盖 ASCII + 中文标点 + GB2312 一级汉字）；生僻字显示为空白，**请用常用字**；Emoji、繁体生僻字一律不要用。
- 超过一屏的列表/正文要自己分页：行高建议 `ui.line_height() + 10`；文字按 `ui.measure` 逐字断行（可用公共库 `ui_kit.wrap_lines`，见第 5 节）。

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

### ui_kit v1 内容速览

```lua
local kit = sys.lib("ui_kit")
-- 布局常量（随屏幕自动计算）
kit.W, kit.H            -- 480, 800
kit.TOP, kit.LH         -- 正文起始 y、行高
kit.MARGIN, kit.GAP     -- 8, 10
kit.GRID_Y, kit.GRID_BOTTOM      -- 田字格区域上下沿
kit.CELL_W, kit.CELL_H           -- 田字格单元尺寸
kit.COVER_W, kit.COVER_H         -- 网格封面 140×186
kit.DETAIL_TOP, kit.DETAIL_BOTTOM-- 详情列表区域
kit.SELF_COVER_W, kit.SELF_COVER_H, kit.SELF_ROW_H   -- 详情本作行
kit.REL_COVER_W, kit.REL_COVER_H, kit.REL_ROW_H, kit.REL_TEXT_X -- 推荐行
kit.LIB_ROW_H, kit.LIB_COVER_W, kit.LIB_COVER_H, kit.LIB_TOP, kit.LIB_ROWS -- 收藏/历史列表
kit.CHAR  -- UTF-8 切分 pattern；kit.TAB = "\t"

-- 文本排版
kit.wrap_lines(text, width)      -- 按像素宽度逐字断行 → 行数组
kit.fit_line(text, width)        -- 超宽截断加 "…"
kit.truncate_utf8(text, limit)   -- 按字节截断且不切半个汉字
kit.center_in(text, x, y, width) -- 在 [x, x+width) 内水平居中画一行

-- 绘制
kit.draw_frame(x, y, w, h)       -- 双线选中框
kit.STAR_PBM                     -- 20×20 五角星位图（字库无 ★，ui.image 贴图）
kit.show_loading(title, line)    -- 「加载中」页 + 整屏刷新
```

---

## 6. 脚本 API（全部可用，无需 require）

### ui —— 绘制

| 调用 | 说明 |
|---|---|
| `ui.clear()` | 清屏（全白），状态栏由框架补画 |
| `ui.title(text)` | 页面标题，居中 y≈52 |
| `ui.text(text, x, y, width)` | 画文字；`width` 自动换行；返回占用高度 |
| `ui.center(text, y)` | 指定 y 居中一行 |
| `ui.menu(items, selected)` | 单列列表（0 基下标），y=130 起、行高 66、选中反白；单次 ≤9 项 |
| `ui.list(items, selected)` | 同版式，无右侧箭头 |
| `ui.rect(x, y, w, h, filled)` | 矩形；越界裁剪 |
| `ui.hline(x, y, w)` | 水平分割线 |
| `ui.footer(text)` | 底部提示（48px），写当前可用的按键操作 |
| `ui.size()` | `宽, 高` |
| `ui.measure(text)` | 文字像素宽度 |
| `ui.image(pbm, x, y)` | 画网关下发的 P4 PBM（480×800 内），成功返回 `true` |
| `ui.flush()` / `ui.flush(true)` | 立即刷新：不传=局刷，`true`=整屏（切页用） |
| `ui.content_top()` / `ui.line_height()` | 正文起始 y / 当前行高 |

### store / cache / fs

| 调用 | 说明 |
|---|---|
| `store.get(key)` / `store.set(key, value)` | 键值持久化（≤4KB）；非法输入静默失败 |
| `cache.get/set/del/clear/size/list` | 本地缓存 1MB/应用，二进制安全，超配额自动淘汰 |
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

---

## 9. 交付自查清单

- [ ] 头部 `--! id/name/version` 齐全，id 符合 `^[a-z0-9][a-z0-9_-]{0,15}$`
- [ ] 有全局 `draw()`；所有绘制 3 秒内完成
- [ ] 引用了 `sys.lib("ui_kit")`，且库缺失时有降级页面
- [ ] 翻页/加载走 `on_key 登记意图 → on_idle 分步执行 → draw 显示加载状态`，无整屏空白
- [ ] `on_idle` 每次只做一个网络动作并正确返回 true/false；用了 `sys.pending()` 让位
- [ ] `ui.text` 的 y 在 88~120，不与 `ui.menu`（y≥130）重叠；`ui.menu` 单次 ≤9 项
- [ ] 四键语义明确，`back` 能退出；所有网络请求判空
- [ ] `store` < 4KB；脚本 UTF-8 无 BOM、≤96KB、只用常用汉字；代码全半角标点
- [ ] 没有 io/os/require/print/load，没有死循环与超大实心矩形
