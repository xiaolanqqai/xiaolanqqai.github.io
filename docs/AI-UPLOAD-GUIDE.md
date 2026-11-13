# 本地 AI 上传 AppUpdater 产物 · 接口引导

> 面向本地执行的 AI / 自动化脚本。按本文档操作即可直接发布产物，**无需再自行摸索页面结构**。
>
> 📌 **只想直接投喂给 AI？** 用站点根目录的现成提示词 —— `{站点}/AI.md`。它自足可执行；本文档是其技术细节补充（错误对照表、参考实现等）。

## 1. 前提与边界

- GitHub token 保存在**本机浏览器 `localStorage`** 中，因此必须在**已打开本站的本地浏览器标签页**内调用接口。
- 不能用无头浏览器或远端环境代劳 —— 那里没有 token。
- 若页面报「Token 未配置」，先让用户在管理页「操作日志」面板的 **GitHub Token 注入** 区保存 token。
- 接口为 **v2**：等待 `window.AppUpdaterAPI.version >= 2`；字段与行为与 v1 不兼容（主文件默认保持、批量原子提交、错误结构化）。

## 2. 目标页面

```
{站点}/index/manager/app-manager.html
```

该页面加载完成后即导出全局接口：

```js
window.AppUpdaterAPI   // 出现即表示可调用
```

**就绪判断**：轮询等待接口存在且版本 ≥ 2。

```js
await new Promise(r => {
    const t = setInterval(() => {
        if (window.AppUpdaterAPI && window.AppUpdaterAPI.version >= 2) { clearInterval(t); r(); }
    }, 200);
});
```

## 3. 开始前必做：确认已有项目，决定上传到哪个文件夹

**不要直接新建项目。** 先确认目标应用是否已有项目文件夹，再决定 `project` 传什么：

```js
const projects = await window.AppUpdaterAPI.list();
// [{ name, description, mainFile, files: [{name, size}], downloadUrl }]
```

| 情况                       | `project` 传什么                                  | 文件落点                            |
| ------------------------ | --------------------------------------------- | ------------------------------- |
| **已有同名项目**（清单里能匹配到）      | **该已有项目名**（原样照抄，勿改写）                         | `AppUpdater/<已有项目名>/`（追加/覆盖，主文件默认不变） |
| **没有匹配项目**（全新应用）         | 新项目名，用应用的**稳定英文名**（如 `MyApp`）               | 接口自动创建并生成 `info.json`              |
| 已有项目但名字记不准               | 先用 `list()` 确认准确名称；不确定时**问用户**，不要猜             | ——                              |

### 必须避免的错误做法

❌ 为同一个应用新建名字相近的项目，例如把 `MyApp` 的更新传到 `MyApp-v2` / `MyAppNew` / `MyAppNew2`。

后果：同一个 App 的包散落在多个文件夹，`info.json` 的 `mainFile` 各自独立，**App 端已在使用的固定直链会拿不到新包**，等于更新失效。

正确做法：版本号只体现在**文件名**上，项目文件夹名保持不变。

### 文件命名建议

```
{项目名}-v{版本}.{扩展名}      例如：MyApp-v1.3.apk
```

新项目未指定主文件时，接口按**文件名自然排序**选安装包类最新者（`v1.10` 会正确排在 `v1.2` 之后），所以文件名里带版本号才会被识别为最新。

## 4. 内容从哪来（重要，别走错路）

页面**不会请求任何本地或外部 URL**。可用内容来源只有三种：

1. **调用方读取文件后直传**：`text` / `base64` / `content`(ArrayBuffer、Uint8Array) / `blob`(File)。推荐。
2. **浏览器自动化设置文件输入**：`#apiFileInput`（CDP `DOM.setFileInputFiles`、Playwright `setInputFiles`）。
3. **用户手动在页面选择文件**。

❌ **不要搭本机 HTTP 服务 + CORS 中转。** HTTPS 页面 `fetch('http://127.0.0.1:xxxx')` 会被混合内容策略拦截；即便临时加 CORS 头打通，浏览器也可能缓存该响应，表现为「重新发布拿到的还是旧内容」。这类脚手架既不稳定也不可复现。

若确实需要中转，正确做法是调用方自己读取文件后走 `publishFiles` 直传，而不是让页面去拉本地地址。

## 5. 方式一：内容直传（推荐）

### 5.1 批量发布（多文件一次原子提交）

```js
await window.AppUpdaterAPI.publishFiles('MyApp', [
    { fileName: 'MyApp-v1.3.apk', content: arrayBuffer },
    { fileName: 'apps.json', text: jsonText }
], {
    description: '我的应用',       // 可选
    setMain: true,                // 可选，显式切换主文件（多文件时建议改用 mainFile 指定）
    mainFile: 'MyApp-v1.3.apk',   // 可选，必须是项目内已存在的文件
    onProgress: (done, total, name) => console.log(done, total, name)
});
```

- 所有文件 + `info.json` 在**同一个 Git 提交**中写入：要么全成功，要么全失败，只触发一次 Pages 构建。
- 同名文件以后出现的为准。

### 5.2 单文件发布

```js
await window.AppUpdaterAPI.publish({
    project: 'MyApp',
    fileName: 'MyApp-v1.3.apk',
    text: '<文本内容>',          // 内容五选一：text / base64 / content(ArrayBuffer|string) / blob(File)
    description: '我的应用',      // 可选
    setMain: true,               // 可选，默认 false：保持现有主文件
    mainFile: 'MyApp-v1.3.apk'   // 可选
});
```

## 6. 方式二：分块上传（大文件）

```js
const id = window.AppUpdaterAPI.beginUpload('MyApp-v1.3.apk');
window.AppUpdaterAPI.appendChunk(id, uint8Chunk);        // 二进制分块
// 或 window.AppUpdaterAPI.appendChunk(id, base64Chunk, 'base64')
const result = await window.AppUpdaterAPI.commitUpload(id, 'MyApp', { setMain: true });
```

- 分块只能二选一：二进制（Uint8Array / ArrayBuffer / 文本）或 base64，**不可混用**。
- `appendChunk` 返回累计字节数；超过 100MB 会直接抛错。
- `abortUpload(id)` 可丢弃会话。

## 7. 方式三：文件输入（仅在确实能设置 input 时）

```js
await page.setInputFiles('#apiFileInput', 'C:\\build\\MyApp-v1.3.apk');   // 可多选
await window.AppUpdaterAPI.publishInputFiles('MyApp', { setMain: true });
```

- 默认读取 `#apiFileInput`；为兼容旧调用仍会读取 `#uploadInput`。
- 所有文件一次性原子提交；无论成功失败都会清空输入框。
- 返回 `Array<发布结果>`（每个文件一项，字段见 §9）。

## 8. 主文件与 info.json 规则

- **主文件默认不变**：已有 `mainFile` 不会被后续上传覆盖。要切换必须显式传 `setMain: true` / `mainFile`，或调用 `setMainFile(project, fileName)`。
- 新项目未指定时，按文件名自然排序选安装包类（apk/aab/ipa/zip/exe/bin…）最新者。
- `info.json` 采用**浅合并写回**：`name` / `description` / `mainFile` / `createdAt` / `updatedAt` 由接口维护，其余字段（`promptFile`、`promptHash`、`libs`、`notes` 等）原样保留。
- `version.json`（App 端检查更新清单）自动维护：主文件为安装包类（apk/aab/ipa/zip/exe/bin 等）时，与 `info.json` 同一次提交写入 `{version, file}`；`version` 从主文件名 `-vX.Y.Z` 解析，解析不到则沿用云端已有值，都没有则不生成。非安装包项目不会生成，**不要手动删除该文件**。
- 读到 `info.json` 但 JSON 损坏时，接口会直接报错中止，不会用空内容覆盖。

## 9. 返回字段

| 字段           | 说明                                   |
| ------------ | ------------------------------------ |
| `ok`         | 是否成功                                 |
| `project`    | 项目名（文件夹名）                            |
| `fileName`   | 文件名（`publishFiles` 为 `files[]`）      |
| `bytes`      | 真实字节数（不再用 base64 长度估算）               |
| `mainFile`   | 当前下载主文件                              |
| `downloadUrl` | 固定下载直链，格式 `{站点}/AppUpdater/<项目名>/<主文件>` |
| `folderUrl`  | 项目文件夹地址                              |
| `commitSha`  | 本次提交 SHA                             |
| `commitUrl`  | 本次提交网页地址                             |
| `unchanged`  | 内容与仓库完全一致时为 `true`（未产生新提交）           |

错误统一为 `GithubApiError`：`{ message, status, code, path, detail }`，常见 `code`：
`TOKEN_MISSING` / `TOKEN_INVALID` / `FORBIDDEN` / `RATE_LIMITED` / `NOT_FOUND` / `CONFLICT` /
`INVALID_PROJECT` / `INVALID_FILE_NAME` / `NO_CONTENT` / `FILE_TOO_LARGE_PAGE` / `FILE_TOO_LARGE_GITHUB` /
`MAIN_FILE_NOT_FOUND` / `INFO_PARSE_FAILED`。

## 10. 发布后校验

```js
await window.AppUpdaterAPI.verify({
    project: 'MyApp',
    fileName: 'MyApp-v1.3.apk',
    expectedBytes: result.bytes,   // 可选
    waitMs: 60000                  // 可选：轮询直到可下载或超时
});
// { ok, httpStatus, bytes, expectedBytes, deploy: { status, commit, updatedAt } }
```

- 提交成功 **≠** Pages 已更新；GitHub Pages/CDN 通常需要数十秒。
- `verify` 用带时间戳的 `HEAD` 请求绕过 CDN/浏览器缓存，并尝试读取 Pages 构建状态。
- 不要用「本机 HTTP 服务返回的内容」判断是否生效（会被浏览器缓存）。

## 11. 约定与限制

- **项目名**即 `AppUpdater/` 下的文件夹名：字母/数字/下划线/短横线/点/中文；禁 `..`、首尾点、控制字符。
- **文件名**：禁路径分隔符 `\ /`、`..`、首尾点与 `: * ? " < > |` 等非法字符；不能用 `info.json`。
- **项目不存在会自动创建**并生成 `info.json`，无需先建项目 —— 但**已有项目请优先复用其名称**，见 §3。
- **单文件上限**：本页通道 **40MB**（内容经 base64 传输，超过易失败）；GitHub 硬上限 **100MB**。超出请改用 git 命令行或 GitHub Releases。
- 每次调用只产生**一个提交**；`verify` 之前不要重复发布同一文件。
- 同一项目重复发布同名文件即**覆盖**。
- 固定下载直链格式：`{站点}/AppUpdater/<项目名>/<主文件>`，App 端使用该 URL 即可持续获取最新包。

## 12. 常见错误

| 报错                                              | 原因与处理                                                        |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `GitHub Token 未配置` / 401                        | 让用户在「操作日志」面板注入/重新保存 token 后重试                                 |
| `project 非法`                                     | 项目名含 `/`、空格、`..` 或首尾点；按规范改写                                     |
| `fileName 非法`                                    | 文件名为空、含 `\ / : * ? " < > |` 或 `..`，或误用了保留名 `info.json`             |
| `缺少文件内容`                                        | 未提供 `text` / `base64` / `content` / `blob` 中的任一项                  |
| `未检测到文件`                                        | 未先把文件设置到 `#apiFileInput` 就调用了 `publishInputFiles`               |
| `超过本页上传通道上限 40MB`                              | 内容直传过不了本页通道，改用 git 命令行 / GitHub Releases                       |
| `超过 GitHub 单文件硬上限 100MB`                        | 改用 GitHub Releases                                            |
| `mainFile 不存在于项目内`                              | `mainFile` 必须是项目里已有的文件名                                        |
| `Resource not accessible by personal access token` | token 缺少该仓库 `Contents` 的**写**权限（需 Read and write），或触发限流           |
| 发布「成功」但直链 404 / 旧内容                              | Pages 尚未刷新，用 `verify({ waitMs })` 等待；不要用缓存过的本机 HTTP 结果判断          |
| App 端拿不到新包（上传却「成功」）                              | 很可能传到了名字相近的新项目。用 `list()` 确认正确项目名，重传到已有项目，并删除多余项目              |

## 13. 参考实现

```js
// 1) 等待接口就绪（v2）
await new Promise(r => {
    const t = setInterval(() => {
        if (window.AppUpdaterAPI && window.AppUpdaterAPI.version >= 2) { clearInterval(t); r(); }
    }, 200);
});

// 2) 先确认已有项目，决定 project 传什么（已有就复用，勿另建相近项目）
const projects = await window.AppUpdaterAPI.list();
const target = projects.find(p => p.name === 'MyApp');   // 命中则复用已有项目名
const projectName = target ? target.name : 'MyApp';       // 未命中的全新应用才新建

// 3) 读取本地文件内容并直传（Node 侧示例；浏览器内直接传 ArrayBuffer/File 即可）
const fs = require('fs');
const data = fs.readFileSync('C:\\build\\MyApp-v1.3.apk');
const base64 = data.toString('base64');
const content = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

const result = await page.evaluate(async ({ name, buffer }) => {
    return window.AppUpdaterAPI.publishFiles(name, [
        { fileName: 'MyApp-v1.3.apk', content: buffer }
    ], { setMain: true });
}, { name: projectName, buffer: content });

// 4) 校验直链并回报
const check = await page.evaluate(async ({ name, file, bytes }) => {
    return window.AppUpdaterAPI.verify({ project: name, fileName: file, expectedBytes: bytes, waitMs: 60000 });
}, { name: result.project, file: result.files[0].fileName, bytes: result.files[0].bytes });
console.log(result.downloadUrl, check.ok);
```
