-- ui_kit 公共库 v3（sys.lib("ui_kit") 加载，固件 2.9.54 起；v3 自 2.9.66 起）
-- 小应用共用的布局常量 / 文本排版 / 状态行 / 结构件（标题栏、底栏、列表、按钮、网格）。
-- 返回一个 table；由「小应用管理 → 制作提示词」同步入口下发到 /assets/apps/.lib/ui_kit.lua。
-- 源码仓库：mini-apps/libs/ui_kit.lua（改完重新打包发布即全设备生效）
--
-- 【墨本 ai 小应用视觉约束 v1】固件 2.9.66 起生效：
--  1) 标题 ui.title(文字)，≤11 个汉字；一屏只允许一个标题。
--  2) 正文从 ui.content_top() 开始（y=88），不得在其上方绘制任何像素。
--  3) 字号只用 28px 的三档缩放 1.0 / 0.85 / 0.65（Lua 目前只有 1.0 一档）。
--  4) 单行中文 ≤16 字；必须手动换行，禁止依赖 ui.text 的自动折行。
--  5) 左右边距 16，安全宽 448；间距只用 8 / 16 / 24 三档。
--  6) 列表行高 64：标签 x=20，值右对齐 x=460；行间 1px 分隔线，最后一行不画。
--  7) 选中态：列表整行反白 rect(8,y+2,464,60) + 白字；网格用 2px 外框，不填黑。
--  8) 按钮宽 448、高 56、1px 外框、文字居中；一屏最多 1 个主按钮。
--  9) 危险操作必须二次确认；确认按钮反白，文案以 "!" 开头。
-- 10) 图标 24×24、线宽 2px、直角；只复用 K.icon 的公共字形。
-- 11) 底栏只写一行 ≤20 汉字，用 " · " 分隔；页码用 footer 的 page 参数放右侧槽。
-- 12) 长任务每 ≤8 秒反馈一次（phase/pct）；禁止自绘浮层、转圈或动画。
-- 13) 空列表显示"暂无内容"并给出下一步提示，不画选中框。
-- 14) 所有请求超时 ≤8 秒；失败必须给出中文原因和可重试入口。
-- 15) 禁止：渐变、阴影、圆角、灰字、半透明、抖动做灰、整屏反白、动画。

local K = {}

K.VERSION = "3"

-- ===== 布局常量（随屏幕自动计算，480×800 竖屏）=====

K.W, K.H = ui.size()
K.TOP = ui.content_top()            -- 正文起始 y（标题栏下方，当前 88）
K.LH = ui.line_height()             -- 当前字号行高（1.0 倍为 36）
K.FOOTER_H = 54                     -- 底栏高（746..800），正文不要画进这条带
K.CONTENT_BOTTOM = K.H - K.FOOTER_H - 10   -- 正文安全下沿（736）

K.MARGIN = 16                       -- 页面左右留白（视觉约束第 5 条）
K.GAP = 16                          -- 组件间距
K.PER_PAGE = 4                      -- 田字格：2 列 × 2 行
K.GRID_Y = K.TOP                    -- 网格起点（标题栏已独立，不再额外留白）
K.GRID_BOTTOM = K.CONTENT_BOTTOM
K.CELL_W = math.floor((K.W - K.MARGIN * 2 - K.GAP) / 2)
K.CELL_H = math.floor((K.GRID_BOTTOM - K.GRID_Y - K.GAP) / 2)
K.COVER_W, K.COVER_H = 140, 186     -- 网格封面（3:4）

-- 详情页纵向列表：第 1 行本作（大封面 + 资料），第 2 行起每条推荐占一行
K.DETAIL_TOP = K.TOP + 2 * K.LH + 6
K.DETAIL_BOTTOM = K.CONTENT_BOTTOM
K.SELF_COVER_W, K.SELF_COVER_H = 150, 200
K.SELF_ROW_H = 214
K.REL_COVER_W, K.REL_COVER_H = 64, 85
K.REL_ROW_H = 92
K.REL_TEXT_X = 16 + K.REL_COVER_W + 16

-- 收藏/历史合并列表：左封面 + 右书名 + 收藏星标
K.LIB_ROW_H = 92
K.LIB_COVER_W, K.LIB_COVER_H = 64, 85
K.LIB_TOP = K.GRID_Y
K.LIB_ROWS = math.max(1, math.floor((K.GRID_BOTTOM - K.LIB_TOP) / K.LIB_ROW_H))

-- 按字符切分 UTF-8；固件已加载 utf8 库，缺失时退回逐字节
K.CHAR = (utf8 and utf8.charpattern) or "."
K.TAB = "\t"

-- 字库只含 ASCII、中文标点与 GB2312 一级汉字，没有 ★：直接贴 20×20 五角星位图
K.STAR_PBM = "P4\n20 20\n" .. string.char(
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x60, 0x00, 0x00, 0x60, 0x00, 0x00, 0xf0, 0x00,
  0x00, 0xf0, 0x00, 0x00, 0xf0, 0x00, 0x3f, 0xff, 0xc0, 0x1f, 0xff, 0x80, 0x0f, 0xff, 0x00,
  0x07, 0xfe, 0x00, 0x03, 0xfc, 0x00, 0x03, 0xfc, 0x00, 0x03, 0xfc, 0x00, 0x07, 0x9e, 0x00,
  0x07, 0x0e, 0x00, 0x04, 0x02, 0x00, 0x08, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)

-- ===== 文本排版 =====

-- 按像素宽度逐字断行，识别 \n 强制换行；ui.measure 与 ui.text 同源，结果一致
function K.wrap_lines(text, width)
  local lines = {}
  local source = tostring(text or "")
  for para in (source .. "\n"):gmatch("([^\n]*)\n") do
    if para == "" then
      lines[#lines + 1] = ""
    else
      local line = ""
      for ch in para:gmatch(K.CHAR) do
        local candidate = line .. ch
        if line ~= "" and ui.measure(candidate) > width then
          lines[#lines + 1] = line
          line = ch
        else
          line = candidate
        end
      end
      if line ~= "" then lines[#lines + 1] = line end
    end
  end
  if #lines == 0 then lines[1] = "" end
  return lines
end

-- 超宽截断并加省略号（只加一个）
function K.fit_line(text, width)
  if ui.measure(text) <= width then return text end
  local out = ""
  for ch in text:gmatch(K.CHAR) do
    if ui.measure(out .. ch .. "…") > width then break end
    out = out .. ch
  end
  return out .. "…"
end

-- 按 UTF-8 字符边界截断：直接 sub 可能切出半个汉字，字库与网关都难以处理
function K.truncate_utf8(text, limit)
  if #text <= limit then return text end
  local cut = limit
  while cut > 0 do
    local b = text:byte(cut + 1)
    if not b or b < 0x80 or b >= 0xC0 then break end
    cut = cut - 1
  end
  return text:sub(1, cut) .. "…"
end

-- 在 [x, x+width) 区间内水平居中画一行
function K.center_in(text, x, y, width)
  local tw = ui.measure(text)
  ui.text(text, x + math.floor((width - tw) / 2), y, width)
end

-- 宽度测量：与宿主同源；scale 仅为兼容 0.85/0.65 的换算，绘制仍为 1.0 一档
function K.measure(text, scale)
  local w = ui.measure(tostring(text or ""))
  if scale and scale ~= 1.0 then w = math.floor(w * scale + 0.5) end
  return w
end

K.fit = K.fit_line
K.wrap = K.wrap_lines

-- ===== 统一状态行（固件 2.9.65 起）=====
-- 规范：状态只写底栏一行；阶段词 ≤6 个汉字；有总长才写百分比；不画动画/自绘进度框。
-- 用法：K.draw_status("下载中", { index = 2, total = 3, percent = 45 })
--      → 底栏 "下载中 2/3 · 45%"
function K.status_line(phase, opts)
  opts = opts or {}
  local text = phase or ""
  if opts.subject and opts.subject ~= "" then
    text = text .. " " .. K.fit_line(opts.subject, 140)
  end
  if opts.index and opts.total and opts.total > 1 then
    text = text .. " " .. opts.index .. "/" .. opts.total
  end
  if opts.percent and opts.percent >= 0 then
    local sep = (opts.index and opts.total and opts.total > 1) and " · " or " "
    text = text .. sep .. math.floor(opts.percent) .. "%"
  elseif opts.elapsed and opts.elapsed > 0 then
    text = text .. " · " .. math.floor(opts.elapsed) .. "s"
  end
  return K.fit_line(text, K.W - 32)
end

-- 直接写到底栏（推荐入口：小应用不要再自己画状态/进度）
function K.draw_status(phase, opts)
  ui.footer(K.status_line(phase, opts))
end

-- 把网关/网络错误收敛成一行可读文案：去掉 "ERR " 前缀并限长
function K.error_text(err)
  if err == nil or err == "" then return "未知错误" end
  local text = tostring(err)
  if text:sub(1, 4) == "ERR " then text = text:sub(5) end
  return K.truncate_utf8(text, 64)
end

-- ===== 结构件（视觉约束 6~12 条）=====

-- 标题栏：level="primary" 黑底白字（一级页）/ "secondary" 白底 + 下框线（子页）
function K.header(title, opts)
  opts = opts or {}
  ui.title(title or "", opts.level == "secondary")
  return K.TOP
end

-- 底栏：单行提示 + 右侧页码槽（page 永不参与截断）。
-- 第二参数可传页码字符串，也可传 { page = "2/7" }
function K.footer(text, opts)
  local page = ""
  if type(opts) == "string" then
    page = opts
  elseif opts then
    page = opts.page or ""
  end
  ui.footer(text or "", page)
end

-- 活动行：与底栏同一行；阶段词 + 可选对象 + i/N + 百分比/已用时
-- 3px 进度线由固件绘制，小应用只负责文案
function K.progress(phase, pct, opts)
  opts = opts or {}
  if pct then opts.percent = pct end
  K.draw_status(phase, opts)
end

-- 列表/菜单：行高 64、1px 分隔线、选中整行反白、自动夹紧与滚动窗口。
-- items 可为字符串数组，或 { label=, value=, disabled= } 数组。
-- 返回夹紧后的 sel 与当前可视行数。
function K.list(items, sel, opts)
  items = items or {}
  opts = opts or {}
  local top = opts.top or K.TOP
  local bottom = opts.bottom or K.CONTENT_BOTTOM
  local row = opts.row or 64
  local value_x = opts.value_x or (K.W - 20)
  local count = #items
  if count == 0 then return 0, 0 end

  sel = math.floor(sel or 1)
  if sel < 1 then sel = 1 end
  if sel > count then sel = count end

  local max_rows = math.max(1, math.floor((bottom - top) / row))
  -- 与固件 DrawList/DrawMenu 一致：按整页对齐滚动，页码可用 math.ceil(sel / max_rows)
  local first = math.floor((sel - 1) / max_rows) * max_rows + 1

  local text_y_off = math.floor((row - K.LH) / 2)
  for i = 0, max_rows - 1 do
    local index = first + i
    local item = items[index]
    if not item then break end
    local label, value, disabled
    if type(item) == "table" then
      label = item.label or item.text or ""
      value = item.value
      disabled = item.disabled
    else
      label = tostring(item)
    end

    local y = top + i * row
    local selected = (index == sel)
    if selected then ui.rect(8, y + 2, K.W - 16, row - 4, true) end

    local label_right = value_x
    if value and value ~= "" then
      local shown = K.fit_line(tostring(value), 160)
      local vw = ui.measure(shown)
      if selected then
        ui.text_inv(shown, value_x - vw, y + text_y_off, vw + 4)
      else
        ui.text(shown, value_x - vw, y + text_y_off, vw + 4)
      end
      label_right = value_x - vw - 16
    end
    if disabled then label = label .. "（不可用）" end
    local shown = K.fit_line(tostring(label), math.max(20, label_right - 20))
    if selected then
      ui.text_inv(shown, 20, y + text_y_off, math.max(1, label_right - 20))
    else
      ui.text(shown, 20, y + text_y_off, math.max(1, label_right - 20))
    end
    if index < count then ui.hline(20, y + row - 1, K.W - 40) end
  end
  return sel, max_rows
end

-- 田字格：2×2、封面 + 标题 2 行、2px 选中外框（不填黑）。
-- items 为 { text=, image= } 数组；image 为 P4 PBM 字符串（可空）。
function K.grid(items, sel, opts)
  items = items or {}
  opts = opts or {}
  local cols = opts.cols or 2
  local cover_w = opts.cover_w or 150
  local cover_h = opts.cover_h or 200
  local title_lines = opts.title_lines or 2
  local per = cols * 2
  local cell_w = math.floor((K.W - K.MARGIN * 2 - K.GAP * (cols - 1)) / cols)
  local cell_h = math.floor((K.CONTENT_BOTTOM - K.TOP - K.GAP) / 2)
  local count = #items
  if count == 0 then return 0, 0 end

  sel = math.floor(sel or 1)
  if sel < 1 then sel = 1 end
  if sel > count then sel = count end
  local page = math.floor((sel - 1) / per)
  local first = page * per + 1

  for slot = 1, per do
    local item = items[first + slot - 1]
    if item then
      local col = (slot - 1) % cols
      local rowi = math.floor((slot - 1) / cols)
      local cx = K.MARGIN + col * (cell_w + K.GAP)
      local cy = K.TOP + rowi * (cell_h + K.GAP)
      local ix = cx + math.floor((cell_w - cover_w) / 2)
      if item.image and ui.image(item.image, ix, cy + 4) then
        -- 封面已画
      else
        ui.rect(ix, cy + 4, cover_w, cover_h, false)
        K.center_in("暂无封面", ix, cy + 4 + math.floor(cover_h / 2) - math.floor(K.LH / 2),
                    cover_w)
      end
      local lines = K.wrap_lines(item.text or "", cell_w - 16)
      if #lines > title_lines then
        lines[title_lines] = K.fit_line(lines[title_lines] .. "…", cell_w - 16)
        for i = title_lines + 1, #lines do lines[i] = nil end
      end
      local ty = cy + 4 + cover_h + 6
      for i = 1, #lines do ui.text(lines[i], cx + 8, ty + (i - 1) * K.LH, cell_w - 16) end
      if first + slot - 1 == sel then
        ui.rect(cx, cy, cell_w, cell_h, false)
        ui.rect(cx + 1, cy + 1, cell_w - 2, cell_h - 2, false)
      end
    end
  end
  return sel, per
end

-- 主按钮：448×56、1px 外框、文字居中；danger 反白且文案以 "!" 开头
function K.button(label, opts)
  opts = opts or {}
  local y = opts.y or (K.CONTENT_BOTTOM - 56)
  local w = K.W - K.MARGIN * 2
  local h = 56
  label = tostring(label or "")
  if opts.danger and label:sub(1, 1) ~= "!" then label = "! " .. label end
  if opts.danger then
    ui.rect(K.MARGIN, y, w, h, true)
    local tw = ui.measure(label)
    ui.text_inv(label, K.MARGIN + math.floor((w - tw) / 2), y + math.floor((h - K.LH) / 2),
                tw + 4)
  else
    ui.rect(K.MARGIN, y, w, h, false)
    if opts.focused then ui.rect(K.MARGIN + 2, y + 2, w - 4, h - 4, false) end
    K.center_in(label, K.MARGIN, y + math.floor((h - K.LH) / 2), w)
  end
  return y, h
end

-- 确认对话框：正文最多 3 行（含自动换行后的行数）+ 主按钮 + 底栏两个动作。
-- 调用方负责先 ui.clear()。
function K.dialog(title, lines, opts)
  lines = lines or {}
  opts = opts or {}
  K.header(title or "", { level = "secondary" })
  local y = K.TOP + 16
  local text_w = K.W - K.MARGIN * 2
  local drawn = 0
  for i = 1, #lines do
    if drawn >= 3 then break end
    for _, line in ipairs(K.wrap_lines(lines[i], text_w)) do
      if drawn >= 3 then break end
      ui.text(line, K.MARGIN, y, text_w)
      y = y + K.LH
      drawn = drawn + 1
    end
  end
  local label = opts.ok or "确认"
  if opts.danger and label:sub(1, 1) ~= "!" then label = "! " .. label end
  K.button(label, { y = K.CONTENT_BOTTOM - 56, danger = opts.danger, focused = true })
  ui.footer("语音 " .. (opts.ok or "确认") .. " · 电源 " .. (opts.cancel or "取消"))
end

-- 图标：24×24、2px 线、直角，只提供公共字形
function K.icon(name, x, y, size)
  local s = size or 24
  local t = 2
  local r = x + s - 1
  local b = y + s - 1
  if name == "chevron" then
    for i = 0, math.floor(s / 2) - 1 do
      ui.rect(x + i * 2, y + math.floor(s / 2) - i - 1, t, t, true)
      ui.rect(x + i * 2, y + math.floor(s / 2) + i - 1, t, t, true)
    end
  elseif name == "check" then
    for i = 0, math.floor(s / 2) do
      ui.rect(x + math.floor(s / 4) + i, y + math.floor(s / 2) + i, t, t, true)
    end
    for i = 0, math.floor(s / 2) do
      ui.rect(x + math.floor(s / 4) + math.floor(s / 2) + i, y + s - math.floor(s / 4) - i - 2,
              t, t, true)
    end
  elseif name == "cross" then
    for i = 0, s - 1 do
      ui.rect(x + i, y + i, t, t, true)
      ui.rect(x + s - t - i, y + i, t, t, true)
    end
  elseif name == "dot" then
    local cx, cy, rad = x + math.floor(s / 2), y + math.floor(s / 2), math.floor(s / 2) - t
    for dy = -rad, rad do
      local dx = math.floor(math.sqrt(rad * rad - dy * dy) + 0.5)
      ui.rect(cx - dx, cy + dy, 3, 1, true)
      ui.rect(cx + dx - 2, cy + dy, 3, 1, true)
    end
  elseif name == "folder" then
    ui.rect(x, y + 4, s, s - 6, false)
    ui.rect(x, y + 2, math.floor(s / 2), 2, true)
  elseif name == "file" then
    ui.rect(x + 4, y + 2, s - 8, s - 4, false)
    ui.hline(x + 6, y + 8, s - 12)
    ui.hline(x + 6, y + 13, s - 12)
  elseif name == "star" then
    ui.image(K.STAR_PBM, x + math.floor((s - 20) / 2), y + math.floor((s - 20) / 2))
  end
  return s
end

-- 1px 分隔线，默认左右各内缩 16
function K.divider(y, x1, x2)
  x1 = x1 or K.MARGIN
  x2 = x2 or (K.W - K.MARGIN)
  ui.rect(x1, y, x2 - x1, 1, true)
end

-- 双线选中框（列表/网格通用的旧接口，保留兼容）
function K.draw_frame(x, y, w, h)
  ui.rect(x, y, w, h, false)
  ui.rect(x + 2, y + 2, w - 4, h - 4, false)
end

-- 所有可能卡住的等待都先在这里显示「加载中」并整屏刷新；
-- 阻塞请求结束后框架会顺延本回调的时间上限
function K.show_loading(title, line)
  ui.clear()
  ui.title(title)
  K.center_in("加载中…", 0, K.TOP + 150, K.W)
  if line then
    local lines = K.wrap_lines(line, K.W - 60)
    for i = 1, math.min(#lines, 2) do
      K.center_in(lines[i], 0, K.TOP + 196 + (i - 1) * K.LH, K.W)
    end
  end
  ui.footer("加载中 · 电源退出")
  ui.flush(true)
end

return K
