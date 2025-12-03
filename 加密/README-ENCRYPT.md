# JSON 文件加密工具

一个简单易用的 Node.js 工具，用于加密和解密 JSON 文件，使用用户提供的密码进行保护。

## 功能特点

- 使用 AES-256-CBC 加密算法，提供强大的安全性
- 自动生成随机盐值和 IV（初始化向量），增强加密强度
- 简单的命令行界面，易于使用
- 可以作为独立脚本使用，也可以作为模块导入到其他 Node.js 项目中

## 安装要求

- Node.js 10.12.0 或更高版本（需要支持 crypto.scryptSync）

## 使用方法

### 1. 加密 JSON 文件

```bash
node encrypt-json.js encrypt <输入文件> <输出文件> <密码>
```

**示例：**
```bash
node encrypt-json.js encrypt data.json encrypted.dat mypassword123
```

### 2. 解密 JSON 文件

```bash
node encrypt-json.js decrypt <输入文件> <输出文件> <密码>
```

**示例：**
```bash
node encrypt-json.js decrypt encrypted.dat decrypted.json mypassword123
```

## 工作原理

1. **加密过程：**
   - 读取输入的 JSON 文件内容
   - 使用用户提供的密码和随机生成的盐值生成 32 字节的加密密钥
   - 生成随机的 16 字节 IV（初始化向量）
   - 使用 AES-256-CBC 算法加密数据
   - 将盐值、IV 和加密数据组合成一个缓冲区，以十六进制格式写入输出文件

2. **解密过程：**
   - 从加密文件中读取十六进制数据
   - 提取盐值、IV 和加密数据
   - 使用用户提供的密码和盐值重新生成加密密钥
   - 使用 AES-256-CBC 算法解密数据
   - 将解密后的数据以 UTF-8 格式写入输出文件

## 作为模块使用

您也可以将此工具作为模块导入到其他 Node.js 项目中：

```javascript
const { encryptJSON, decryptJSON } = require('./encrypt-json');

// 加密 JSON 文件
encryptJSON('data.json', 'encrypted.dat', 'mypassword123');

// 解密 JSON 文件
decryptJSON('encrypted.dat', 'decrypted.json', 'mypassword123');
```

## 安全性说明

- 请确保使用强密码，建议包含大小写字母、数字和特殊字符
- 不要将密码硬编码在代码中或与加密文件一起存储
- 此工具仅用于基本的数据保护，如果需要更高级的安全性，请考虑使用专业的加密解决方案

## 示例

### 1. 加密示例

假设有一个名为 `user-data.json` 的文件，内容如下：

```json
{
  "users": [
    {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    {
      "id": 2,
      "name": "李四",
      "email": "lisi@example.com"
    }
  ]
}
```

使用以下命令加密：

```bash
node encrypt-json.js encrypt user-data.json user-data.enc mysecretpassword
```

加密后会生成一个名为 `user-data.enc` 的文件，内容是加密后的十六进制数据。

### 2. 解密示例

使用以下命令解密：

```bash
node encrypt-json.js decrypt user-data.enc user-data-decrypted.json mysecretpassword
```

解密后会生成一个名为 `user-data-decrypted.json` 的文件，内容与原始 JSON 文件相同。

## 许可证

MIT License
