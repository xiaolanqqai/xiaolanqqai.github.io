# 本地 AI 上传 AppUpdater 产物 · 接口引导

> 面向本地执行的 AI / 自动化脚本。按本文档操作即可直接发布产物，**无需再自行摸索页面结构**。
>
> 📌 **只想直接投喂给 AI？** 用站点根目录的现成提示词 —— `{站点}/AI.md`。它自足可执行；本文档是其技术细节补充（错误对照表、参考实现等）。

## 1. 前提与边界

- GitHub token 保存在**本机浏览器 `localStorage`** 中，因此必须在**已打开本站的本地浏览器标签页**内调用接口。
- 不能用无头浏览器或远端环境代劳 —— 那里没有 token。
- 若页面报“Token 未配置”，先让用户在管理页「操作日志」面板的 **GitHub Token 注入** 区保存 token。

## 2. 目标页面

```
{站点}/index/manager/app-manager.html
```

该页面加载完成后即导出全局接口：

```js
window.AppUpdaterAPI   // 出现即表示可调用
```

**就绪判断**：轮询等待 `window.AppUpdaterAPI` 存在。

```js
await new Promise(r => {
    const t = setInterval(() => { if (window.AppUpdaterAPI) { clearInterval(t); r(); } }, 200);
});
```

## 3. 开始前必做：确认已有项目，决定上传到哪个文件夹

**不要直接新建项目。** 先确认目标应用是否已有项目文件夹，再决定 `project` 传什么：

```js
const projects = await window.AppUpdaterAPI.list();
// [{ name, description, mainFile, files: [{name, size}], downloadUrl }]
```

也可以直接读页面「AI 上传接口」卡片里的说明文本 —— 其中 **【当前已有项目】** 段落就是同一份清单（由页面实时填充），无需额外摸索。

### 判断规则

| 情况                       | `project` 传什么                                  | 文件落点                            |
| ------------------------ | --------------------------------------------- | ------------------------------- |
| **已有同名项目**（清单里能匹配到）      | **该已有项目名**（原样照抄，勿改写）                         | `AppUpdater/<已有项目名>/`（追加/覆盖，主文件随之更新） |
| **没有匹配项目**（全新应用）         | 新项目名，用应用的**稳定英文名**（如 `MyApp`）           | `AppUpdater/<新项目名>/`（接口自动创建并生成 `info.json`） |
| 已有项目但名字记不准               | 先用 `list()` 确认准确名称；不确定时**问用户**，不要猜             | ——                              |

### 必须避免的错误做法

❌ 为同一个应用新建名字相近的项目，例如把 `MyApp` 的更新传到 `MyApp-v2` / `MyAppNew` / `MyAppNew2`。

后果：同一个 App 的包散落在多个文件夹，`info.json` 的 `mainFile` 各自独立，**App 端已在使用的固定直链会拿不到新包**，等于更新失效。

正确做法：版本号只体现在**文件名**上，项目文件夹名保持不变。

### 文件命名建议

```
{项目名}-v{版本}.{扩展名}      例如：MyApp-v1.3.apk
```

主文件是按**文件名自然排序**识别“较新版本”的（`v1.10` 会正确排在 `v1.2` 之后），所以文件名里带版本号才会被识别为最新。若文件名不含版本号，识别结果可能不是你期望的那一个。

## 4. 方式一：直接发布本地文件（推荐，适合大文件）

免 base64 传输，让浏览器自动化把本地文件塞进页面隐藏输入框 `#uploadInput`，再由页面读取发布。

**步骤**

1. 用自动化能力把本地文件设置到 `#uploadInput`
   - CDP：`DOM.setFileInputFiles`
   - Playwright：`page.setInputFiles('#uploadInput', 'C:\\path\\app.apk')`
2. 在页面上下文执行：

```js
await window.AppUpdaterAPI.publishInputFiles('MyApp', {
    description: '我的应用',   // 可选，项目不存在时用于生成 info.json
    setMain: true              // 可选，默认 true：把该文件设为下载主文件
});
```

**返回**：`Array<发布结果>`（每个文件一项，字段见 §6）。

> 多选文件时逐个发布，文件名取自本地文件名。调用后输入框会被清空。

## 5. 方式二：传入内容发布

适合已有 base64、或内容体积较小的场景。

```js
await window.AppUpdaterAPI.publish({
    project: 'MyApp',           // 必填，已有项目请填已有项目名；不存在则自动创建
    fileName: 'MyApp-v1.3.apk', // 必填，不能含路径分隔符，不能是 info.json
    base64: '<base64 内容>',    // 内容三选一：base64 / content(ArrayBuffer) / blob(File)
    description: '我的应用',    // 可选，项目不存在时用于生成 info.json
    setMain: true               // 可选，默认 true：把该文件设为下载主文件
});
```

`base64` 之外的两种写法：

```js
{ content: arrayBufferOrUint8Array }   // 原始字节
{ blob: fileObject }                  // File / Blob 对象
```

**返回**：单个发布结果对象。

## 6. 返回字段

| 字段          | 说明                                   |
| ----------- | ------------------------------------ |
| `ok`        | 恒为 `true`                            |
| `project`   | 项目名（文件夹名）                            |
| `fileName`  | 刚落盘的文件名                              |
| `size`      | 文件字节数（base64 入参时为估算值）                |
| `mainFile`  | 当前下载主文件                              |
| `downloadUrl` | 固定下载直链，格式 `{站点}/AppUpdater/<项目名>/<主文件>` |
| `folderUrl` | 项目文件夹地址                              |

## 7. 只读查询

```js
await window.AppUpdaterAPI.list();
// [{ name, description, mainFile, files: [{name, size}], downloadUrl }]

window.AppUpdaterAPI.help();   // 重新输出完整说明（同时打印到控制台）
```

## 8. 约定与限制

- **项目名**即 `AppUpdater/` 下的文件夹名，允许字母、数字、下划线、短横线、点、中文。
- **项目不存在会自动创建**并生成 `info.json`，无需先建项目 —— 但**已有项目请优先复用其名称**，见 §3。
- **单文件 ≤ 100MB**（GitHub Contents API 限制），超限会抛错，请改用 GitHub Releases。
- 调用后**立即写入仓库并生效**，不需要点页面上的「同步到 GitHub」—— 那个按钮只处理页面内的暂存改动。
- 同一项目重复发布同名文件即**覆盖**（自动带 SHA 合并）。
- 固定下载直链格式：`{站点}/AppUpdater/<项目名>/<主文件>`，App 端使用该 URL 即可持续获取最新包。

## 9. 常见错误

| 报错                                              | 原因与处理                                                        |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `GitHub Token 未配置`                              | 让用户在「操作日志」面板注入 token 后重试                                      |
| `project 非法`                                     | 项目名含非法字符（如 `/`、空格）                                           |
| `fileName 非法`                                    | 文件名为空、含 `/`，或误用了保留名 `info.json`                              |
| `缺少文件内容`                                        | 未提供 `base64` / `content` / `blob` 中的任一项                       |
| `未检测到文件`                                        | 未先把文件设置到 `#uploadInput` 就调用了 `publishInputFiles`             |
| `文件约 xx MB，超过 100MB 上限`                         | 超出 Contents API 限制，改用 GitHub Releases                       |
| `Resource not accessible by personal access token` | token 缺少该仓库 `Contents` 的**写**权限（需 Read and write）          |
| App 端拿不到新包（上传却“成功”）                              | 很可能传到了名字相近的新项目而非已有项目。用 `list()` 确认正确项目名，重传到已有项目，并删除多余项目 |

## 10. 参考实现

```js
// 1) 等待接口就绪
await new Promise(r => { const t = setInterval(() => { if (window.AppUpdaterAPI) { clearInterval(t); r(); } }, 200); });

// 2) 先确认已有项目，决定 project 传什么（已有就复用，勿另建相近项目）
const projects = await window.AppUpdaterAPI.list();
const target = projects.find(p => p.name === 'MyApp');   // 命中则复用已有项目名
const projectName = target ? target.name : 'MyApp';       // 未命中的全新应用才新建

// 3) 自动化把本地文件塞入 #uploadInput（示例用 Playwright）
await page.setInputFiles('#uploadInput', 'C:\\build\\MyApp-v1.3.apk');

// 4) 页面上下文发布并取回固定下载直链
const [result] = await page.evaluate(name =>
    window.AppUpdaterAPI.publishInputFiles(name, { description: '我的应用', setMain: true }), projectName
);
console.log(result.downloadUrl);   // https://<站点>/AppUpdater/MyApp/MyApp-v1.3.apk
```
