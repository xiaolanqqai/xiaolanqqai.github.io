-- ui_kit 公共库 v1（sys.lib("ui_kit") 加载，固件 2.9.54 起）
-- 小应用共用的布局常量 / 文本排版 / 图标位图 / 通用绘制。
-- 返回一个 table；由「小应用管理 → 制作提示词」同步入口下发到 /assets/apps/.lib/ui_kit.lua。
-- 源码仓库：mini-apps/libs/ui_kit.lua（改完重新打包发布即全设备生效）

local K = {}

-- ===== 布局常量（随屏幕自动计算，480×800 竖屏）=====

K.W, K.H = ui.size()
K.TOP = ui.content_top()            -- 正文起始 y（状态栏 + 间距）
K.LH = ui.line_height()             -- 当前字号行高

K.MARGIN = 8                        -- 页面左右留白
K.GAP = 10
K.PER_PAGE = 4                      -- 田字格：2 列 × 2 行
K.GRID_Y = K.TOP + 46               -- 标题下方
K.GRID_BOTTOM = K.H - 54            -- 提示栏上方
K.CELL_W = math.floor((K.W - K.MARGIN * 2 - K.GAP) / 2)
K.CELL_H = math.floor((K.GRID_BOTTOM - K.GRID_Y - K.GAP) / 2)
K.COVER_W, K.COVER_H = 140, 186     -- 网格封面（3:4）

-- 详情页纵向列表：第 1 行本作（大封面 + 资料），第 2 行起每条推荐占一行
K.DETAIL_TOP = K.TOP + 2 * K.LH + 6
K.DETAIL_BOTTOM = K.H - 54
K.SELF_COVER_W, K.SELF_COVER_H = 150, 200
K.SELF_ROW_H = 214
K.REL_COVER_W, K.REL_COVER_H = 64, 85
K.REL_ROW_H = 92
K.REL_TEXT_X = 16 + K.REL_COVER_W + 16

-- 收藏/历史合并列表：左封面 + 右书名 + 收藏星标
K.LIB_ROW_H = 92
K.LIB_COVER_W, K.LIB_COVER_H = 64, 85
K.LIB_TOP = K.GRID_Y
K.LIB_ROWS = math.max(1, math.floor((K.GRID_BOTTOM - K.GRID_Y) / K.LIB_ROW_H))

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

-- 按像素宽度逐字断行；ui.measure 与 ui.text 使用同一套字号，结果一致
function K.wrap_lines(text, width)
  local lines, line = {}, ""
  for ch in text:gmatch(K.CHAR) do
    local candidate = line .. ch
    if line ~= "" and ui.measure(candidate) > width then
      lines[#lines + 1] = line
      line = ch
    else
      line = candidate
    end
  end
  if line ~= "" then lines[#lines + 1] = line end
  if #lines == 0 then lines[1] = "" end
  return lines
end

-- 超宽截断并加省略号
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

-- ===== 通用绘制 =====

-- 双线选中框（列表/网格通用）
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
  K.center_in("请稍候 · 电源退出", 0, K.H - 86, K.W)
  ui.flush(true)
end

return K
