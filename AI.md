# 提示词：把 App 更新包上传到 Xiaolan 的 AppUpdater

> **用法**：对 AI 说 ——「读取本站 `/AI.md`，按里面的提示词把文件上传到 AppUpdater。要上传的文件：`<本地文件路径>`」
>
> 本文档即提示词本体，读完即可照做，**不需要再摸索页面结构**。
>
> 文中 `{站点}` 指你读取本文档所使用的域名（如 `https://xiaolanqqai.cloud-ip.cc`）。

---

## 0. 你的任务

把用户指定的本地文件（App 安装包 / 资源包 / 清单）发布到本站 `AppUpdater/` 目录下**对应的**项目文件夹，确认直链生效后，把**固定下载直链**回报给用户。

若用户未说明目标项目，先按「步骤 2」查已有项目，再向用户确认。

## 1. 硬性前提（必须满足）

1. **必须在用户本地的浏览器中操作。** GitHub token 只保存在用户本机浏览器的 `localStorage` 里。
   - 不要用无头浏览器、云端沙箱或远端环境代劳 —— 那里取不到 token。
   - 使用你能操作**用户本地浏览器**的能力（浏览器自动化 / CDP / 请用户配合操作）。
2. 若页面提示「GitHub Token 未配置」：请用户在管理页「操作日志」面板 →「GitHub Token 注入」区保存 token，然后继续。
3. **接口版本 v2**：等待 `window.AppUpdaterAPI.version >= 2` 再调用；`help()` 可随时输出最新说明。

## 2. 步骤

### 步骤 1 —— 打开目标页面并等待接口就绪

```
{站点}/index/manager/app-manager.html
```

```js
await new Promise(r => {
  const t = setInterval(() => {
    if (window.AppUpdaterAPI && window.AppUpdaterAPI.version >= 2) { clearInterval(t); r(); }
  }, 200);
});
```

### 步骤 2 —— 先查已有项目，决定「传到哪」（关键，不要跳过）

```js
const projects = await window.AppUpdaterAPI.list();
// [{ name, description, mainFile, files: [{name, size}], downloadUrl }]
```

判断规则：

| 情况                | `project` 传什么                        | 文件落点                              |
| ----------------- | ----------------------------------- | --------------------------------- |
| **已有同名项目**         | **该已有项目名**（原样照抄，勿改写）                 | `AppUpdater/<已有项目名>/`（追加/覆盖，主文件默认不变） |
| **没有匹配项目**（全新应用）   | 新项目名，用 App 的**稳定英文名**（如 `MyApp`）     | 接口自动创建并生成 `info.json`              |
| **名字拿不准**          | 先问用户，**不要猜**                          | ——                                |

也可以直接读页面「AI 上传接口」卡片中的 **【当前已有项目】** 段落 —— 那是同一份实时清单。

### 步骤 3 —— 发布（首选：直接传内容）

**方式 A（推荐）—— `publishFiles`，一次原子提交多个文件**

```js
await window.AppUpdaterAPI.publishFiles('MyApp', [
  { fileName: 'MyApp-v1.3.apk', content: arrayBuffer }   // 也可 text / base64 / blob(File)
], {
  description: '我的应用',      // 可选，仅在有意义时传
  setMain: true,               // 可选，显式切换下载主文件
  mainFile: 'MyApp-v1.3.apk'   // 可选，多文件时用来指定主文件
});
```

- 文件与 `info.json` 在同一次提交里写入：**全成功或全失败**，只触发一次 Pages 构建。
- 内容来源三选一：`text`（文本）、`base64`、`content`（ArrayBuffer/Uint8Array）、`blob`（File）。
- 单文件也可用 `publish({ project, fileName, text|base64|content|blob, setMain, mainFile })`。

**方式 B —— 分块上传（大文件，避免一次性构造超大 base64）**

```js
const id = window.AppUpdaterAPI.beginUpload('MyApp-v1.3.apk');
window.AppUpdaterAPI.appendChunk(id, chunkBytes);      // 每次传一段 Uint8Array
// ...重复 appendChunk...
await window.AppUpdaterAPI.commitUpload(id, 'MyApp', { setMain: true });
```

分块只能二选一：二进制（Uint8Array/ArrayBuffer/text）或 base64，**不可混用**。

**方式 C —— 仅当你确实能设置文件输入时**

```js
await page.setInputFiles('#apiFileInput', 'C:\\build\\MyApp-v1.3.apk');   // Playwright；CDP 用 DOM.setFileInputFiles
await window.AppUpdaterAPI.publishInputFiles('MyApp', { setMain: true });
```

`publishInputFiles` 默认读 `#apiFileInput`，兼容旧的 `#uploadInput`；结束（无论成败）都会清空输入框。

### 步骤 4 —— 确认是否真正生效

```js
await window.AppUpdaterAPI.verify({
  project: 'MyApp',
  fileName: 'MyApp-v1.3.apk',
  expectedBytes: 12345678,     // 可选，按返回的 bytes 传
  waitMs: 60000                // 可选，轮询等待 Pages 刷新
});
// { ok, httpStatus, bytes, expectedBytes, deploy: { status, commit, updatedAt } }
```

**提交成功 ≠ 页面已更新**：GitHub Pages/CDN 通常需要数十秒。`ok:true` 表示直链已可下载且字节数匹配。

### 步骤 5 —— 回报给用户

把 `downloadUrl`（固定下载直链）、`project`、`fileName`、`mainFile`、`commitUrl` 与 `verify` 结果告知用户。

## 3. 注意事项与禁止事项

- ❌ **不要为同一个 App 新建名字相近的项目**（如 `MyApp`、`MyApp-v2`、`MyAppNew`）。包会散落到多个文件夹，**App 端已在使用的固定直链会失效**。版本号只体现在**文件名**上。
- ❌ **不要为本机 HTTP 服务/CORS 中转搭脚手架。** 页面**不会请求任何本地或外部 URL**：HTTPS 页面 fetch `http://127.0.0.1` 会被混合内容拦截，且浏览器可能返回缓存的旧响应（表现为「发布后还是旧内容」）。内容只能来自：你读取文件后直传、浏览器自动化设置文件输入、用户手动选择。
- ❌ 不要把 token 写进代码、文档或提交到仓库；token 只停留在浏览器 `localStorage`。
- ❌ 只处理用户明确指定的文件，不要顺手改动或删除其他项目、其他文件。
- ✅ 文件名建议 `{项目名}-v{版本}.{扩展名}`（如 `MyApp-v1.3.apk`）；新项目按自然排序（`v1.10 > v1.2`）选主文件。
- ✅ **主文件默认不变**：已有 `mainFile` 不会被后续上传覆盖。要更新下载主文件，必须显式传 `setMain: true` / `mainFile`，或调用 `setMainFile(project, fileName)`。
- ✅ **`info.json` 是浅合并写回**：`promptFile` / `libs` / `notes` 等自定义字段会保留，无需把它们搬到 `apps.json`。
- ✅ 单文件上限：**本页 40MB**（内容经 base64 传输）；GitHub 硬上限 100MB，超出请改用 GitHub Releases。
- ✅ 调用后立即写入仓库并生效，不需要点页面上的「同步到 GitHub」——那个按钮只处理页面内的暂存改动。
- ✅ 同一项目重复发布同名文件即**覆盖**。

## 4. 接口速查

| 调用 | 说明 |
| ---- | ---- |
| `list()` | 只读，返回各项目 + 主文件 + 固定直链（一次递归树读取） |
| `publish({ project, fileName, text\|base64\|content\|blob, description?, setMain?, mainFile? })` | 单文件发布，文件 + info.json 一次提交 |
| `publishFiles(project, files[], { description?, setMain?, mainFile?, onProgress? })` | 批量发布，原子提交 |
| `beginUpload(fileName)` / `appendChunk(id, chunk, encoding?)` / `commitUpload(id, project, opts?)` / `abortUpload(id)` | 分块上传 |
| `publishInputFiles(project, { input?, setMain?, mainFile? })` | 读取文件输入框发布（一次性提交全部） |
| `setMainFile(project, fileName)` | 只切换主文件，不改文件内容 |
| `verify({ project, fileName, expectedBytes?, waitMs? })` | 直链 HEAD 校验 + Pages 构建状态 |
| `help()` | 输出完整接口说明 |

返回字段：`{ ok, project, fileName, mainFile, bytes, downloadUrl, folderUrl, commitSha, commitUrl, unchanged }`

错误对象：`GithubApiError`，带 `status` / `code` / `path`（如 `TOKEN_INVALID`、`FILE_TOO_LARGE_PAGE`、`INVALID_FILE_NAME`、`CONFLICT`）。

## 5. 出错了怎么办

| 现象 | 处理 |
| ---- | ---- |
| `GitHub Token 未配置` / 401 | 让用户在「操作日志」面板重新保存 token 后重试 |
| `project 非法` | 项目名含 `/`、空格、`..` 或首尾点 |
| `fileName 非法` | 文件名为空、含 `\ / : * ? " < > |` 或 `..`，或误用了 `info.json` |
| `缺少文件内容` | 需提供 `text` / `base64` / `content` / `blob` 中的任一项 |
| `未检测到文件` | 没先把文件设置到 `#apiFileInput` 就调用了 `publishInputFiles` |
| `超过本页上传通道上限 40MB` | 内容直传过不了本页通道，改用 git 命令行 / GitHub Releases |
| `超过 GitHub 单文件硬上限 100MB` | 改用 GitHub Releases |
| 403 `Resource not accessible by personal access token` | token 缺少该仓库 `Contents` 的**写**权限（Read and write），或触发限流 |
| 上传「成功」但 App 端拿不到新包 | 多为传到了相近的新项目；也可能是 Pages 尚未刷新，用 `verify()` 确认并等待 |
| 发布后仍是旧内容 | 不要用本机 HTTP 中转（会被浏览器缓存）；用 `verify()` 的带时间戳 HEAD 结果为准 |

## 6. 开始前先向用户确认

1. 要上传的**本地文件路径**
2. 目标是**哪个项目**（已有项目名，还是新建）
3. 若新建：项目名与一句简介
4. 本次是否要**切换下载主文件**（默认保持不变）

技术细节参考：`{站点}/docs/AI-UPLOAD-GUIDE.md`
