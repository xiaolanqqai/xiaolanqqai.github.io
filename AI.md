# 提示词：把 App 更新包上传到 Xiaolan 的 AppUpdater

> **用法**：对 AI 说 ——「读取本站 `/AI.md`，按里面的提示词把文件上传到 AppUpdater。要上传的文件：`<本地文件路径>`」
>
> 本文档即提示词本体，读完即可照做，**不需要再摸索页面结构**。
>
> 文中 `{站点}` 指你读取本文档所使用的域名（如 `https://xiaolanqqai.cloud-ip.cc`）。

---

## 0. 你的任务

把用户指定的本地文件（App 安装包 / 更新包）发布到本站 `AppUpdater/` 目录下**对应的**项目文件夹，并把**固定下载直链**回报给用户。

若用户未说明目标项目，先按「步骤 2」查已有项目，再向用户确认。

## 1. 硬性前提（必须满足）

1. **必须在用户本地的浏览器中操作。** GitHub token 只保存在用户本机浏览器的 `localStorage` 里。
   - 不要用无头浏览器、云端沙箱或远端环境代劳 —— 那里取不到 token。
   - 使用你能操作**用户本地浏览器**的能力（浏览器自动化 / CDP / 请用户配合操作）。
2. 若页面提示「GitHub Token 未配置」：请用户在管理页「操作日志」面板 →「GitHub Token 注入」区保存 token，然后继续。

## 2. 步骤

### 步骤 1 —— 打开目标页面并等待接口就绪

```
{站点}/index/manager/app-manager.html
```

```js
await new Promise(r => {
  const t = setInterval(() => { if (window.AppUpdaterAPI) { clearInterval(t); r(); } }, 200);
});
```

页面加载完成后会导出全局接口 `window.AppUpdaterAPI`。

### 步骤 2 —— 先查已有项目，决定「传到哪」（关键，不要跳过）

```js
const projects = await window.AppUpdaterAPI.list();
// [{ name, description, mainFile, files: [{name, size}], downloadUrl }]
```

判断规则：

| 情况                | `project` 传什么                        | 文件落点                              |
| ----------------- | ----------------------------------- | --------------------------------- |
| **已有同名项目**         | **该已有项目名**（原样照抄，勿改写）                 | `AppUpdater/<已有项目名>/`（追加/覆盖，主文件随之更新） |
| **没有匹配项目**（全新应用）   | 新项目名，用 App 的**稳定英文名**（如 `MyApp`）     | 接口自动创建并生成 `info.json`              |
| **名字拿不准**          | 先问用户，**不要猜**                          | ——                                |

也可以直接读页面「AI 上传接口」卡片中的 **【当前已有项目】** 段落 —— 那是同一份实时清单。

### 步骤 3 —— 上传

**方式 A（推荐，大文件免 base64）** —— 用浏览器自动化把本地文件塞进页面隐藏输入框 `#uploadInput`（CDP `DOM.setFileInputFiles` / Playwright `page.setInputFiles`），再执行：

```js
await window.AppUpdaterAPI.publishInputFiles('MyApp', { description: '我的应用', setMain: true });
```

**方式 B（已有 base64，或小文件）**：

```js
await window.AppUpdaterAPI.publish({
  project: 'MyApp',
  fileName: 'MyApp-v1.3.apk',
  base64: '<base64 内容>',    // 也可 content: ArrayBuffer / blob: File
  description: '我的应用',     // 可选，项目不存在时用它生成 info.json
  setMain: true               // 可选，默认 true：设为下载主文件
});
```

### 步骤 4 —— 回报给用户

把返回值中的 `downloadUrl`（固定下载直链）、`project`、`fileName`、`mainFile` 告知用户。

## 3. 注意事项与禁止事项

- ❌ **不要为同一个 App 新建名字相近的项目**（如 `MyApp`、`MyApp-v2`、`MyAppNew`）。包会散落到多个文件夹，**App 端已在使用的固定直链会失效**，等于更新失败。版本号只体现在**文件名**上。
- ❌ 不要把 token 写进代码、文档或提交到仓库；token 只停留在浏览器 `localStorage`。
- ❌ 只处理用户明确指定的文件，不要顺手改动或删除其他项目、其他文件。
- ✅ 文件名建议 `{项目名}-v{版本}.{扩展名}`（如 `MyApp-v1.3.apk`）。主文件是按**文件名自然排序**识别「较新版本」的（`v1.10 > v1.2`），文件名带版本号才会被正确识别为最新。
- ✅ 单文件 ≤ **100MB**（GitHub Contents API 限制），超限请改用 GitHub Releases。
- ✅ 调用后**立即写入仓库并生效**，不需要点页面上的「同步到 GitHub」——那个按钮只处理页面内的暂存改动。
- ✅ 同一项目重复发布同名文件即**覆盖**（自动带 SHA 合并）。

## 4. 接口速查

| 调用 | 说明 |
| ---- | ---- |
| `AppUpdaterAPI.list()` | 只读，返回各项目 + 主文件 + 固定直链 |
| `AppUpdaterAPI.publishInputFiles(project, { description?, setMain? })` | 发布 `#uploadInput` 中的本地文件 |
| `AppUpdaterAPI.publish({ project, fileName, base64\|content\|blob, description?, setMain? })` | 按内容发布 |
| `AppUpdaterAPI.help()` | 输出完整接口说明 |

返回字段：`{ ok, project, fileName, size, mainFile, downloadUrl, folderUrl }`

## 5. 出错了怎么办

| 现象 | 处理 |
| ---- | ---- |
| `GitHub Token 未配置` | 让用户在「操作日志」面板注入 token 后重试 |
| `project 非法` | 项目名含 `/`、空格等非法字符 |
| `fileName 非法` | 文件名为空、含 `/`，或误用了保留名 `info.json` |
| `缺少文件内容` | 需提供 `base64` / `content` / `blob` 中的任一项 |
| `未检测到文件` | 没先把文件塞进 `#uploadInput` 就调用了 `publishInputFiles` |
| `文件约 xx MB，超过 100MB 上限` | 超出 Contents API 限制，改用 GitHub Releases |
| `Resource not accessible by personal access token` | token 缺少该仓库 `Contents` 的**写**权限（需 Read and write） |
| 上传“成功”但 App 端拿不到新包 | 很可能传到了新建的相近项目。用 `list()` 找到正确项目名后重传，并删除多余项目 |

## 6. 开始前先向用户确认

1. 要上传的**本地文件路径**
2. 目标是**哪个项目**（已有项目名，还是新建）
3. 若新建：项目名与一句简介

技术细节参考：`{站点}/docs/AI-UPLOAD-GUIDE.md`
