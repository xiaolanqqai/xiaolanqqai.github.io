const fs = require('fs');
const crypto = require('crypto');

/**
 * 加密JSON文件
 * @param {string} inputFile - 输入的JSON文件路径
 * @param {string} outputFile - 输出的加密文件路径
 * @param {string} password - 加密密码
 */
function encryptJSON(inputFile, outputFile, password) {
    try {
        // 读取JSON文件
        const jsonData = fs.readFileSync(inputFile, 'utf8');
        const data = Buffer.from(jsonData, 'utf8');
        
        // 生成随机盐
        const salt = crypto.randomBytes(16);
        // 生成密钥和IV
        const key = crypto.scryptSync(password, salt, 32); // 32字节密钥
        const iv = crypto.randomBytes(16); // 16字节IV
        
        // 创建加密器
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        // 加密数据
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // 组合盐、IV和加密数据
        const result = Buffer.concat([salt, iv, encrypted]);
        
        // 写入加密文件
        fs.writeFileSync(outputFile, result.toString('hex'));
        
        console.log(`JSON文件已成功加密：${inputFile} -> ${outputFile}`);
    } catch (error) {
        console.error('加密失败：', error.message);
        process.exit(1);
    }
}

/**
 * 解密JSON文件
 * @param {string} inputFile - 输入的加密文件路径
 * @param {string} outputFile - 输出的JSON文件路径
 * @param {string} password - 解密密码
 */
function decryptJSON(inputFile, outputFile, password) {
    try {
        // 读取加密文件
        const encryptedData = Buffer.from(fs.readFileSync(inputFile, 'utf8'), 'hex');
        
        // 提取盐、IV和加密数据
        const salt = encryptedData.slice(0, 16);
        const iv = encryptedData.slice(16, 32);
        const data = encryptedData.slice(32);
        
        // 生成密钥
        const key = crypto.scryptSync(password, salt, 32);
        
        // 创建解密器
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        // 解密数据
        let decrypted = decipher.update(data);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        // 写入JSON文件
        fs.writeFileSync(outputFile, decrypted.toString('utf8'));
        
        console.log(`JSON文件已成功解密：${inputFile} -> ${outputFile}`);
    } catch (error) {
        console.error('解密失败：', error.message);
        process.exit(1);
    }
}

// 命令行参数处理
function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
        console.log('用法：');
        console.log('  加密：node encrypt-json.js encrypt <输入文件> <输出文件> <密码>');
        console.log('  解密：node encrypt-json.js decrypt <输入文件> <输出文件> <密码>');
        console.log('');
        console.log('示例：');
        console.log('  node encrypt-json.js encrypt data.json encrypted.dat mypassword123');
        console.log('  node encrypt-json.js decrypt encrypted.dat decrypted.json mypassword123');
        process.exit(0);
    }
    
    const command = args[0];
    const inputFile = args[1];
    const outputFile = args[2];
    const password = args[3];
    
    if (command === 'encrypt') {
        encryptJSON(inputFile, outputFile, password);
    } else if (command === 'decrypt') {
        decryptJSON(inputFile, outputFile, password);
    } else {
        console.error('无效命令，请使用 encrypt 或 decrypt');
        process.exit(1);
    }
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = { encryptJSON, decryptJSON };