// 简单的JavaScript语法验证脚本
const fs = require('fs');
const path = require('path');

// 读取HTML文件
const htmlPath = path.join(__dirname, 'index', 'manager', 'nav-manager.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 提取JavaScript代码块
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
let scriptBlocks = [];
let match;

while ((match = scriptRegex.exec(htmlContent)) !== null) {
    // 跳过外部脚本引用
    if (!match[0].includes('src=')) {
        scriptBlocks.push(match[1]);
    }
}

// 验证每个脚本块的语法
console.log(`找到 ${scriptBlocks.length} 个内联脚本块`);
let hasError = false;

for (let i = 0; i < scriptBlocks.length; i++) {
    try {
        // 使用Function构造函数来验证语法
        new Function(scriptBlocks[i]);
        console.log(`脚本块 ${i + 1}: 语法正确`);
    } catch (error) {
        console.error(`脚本块 ${i + 1}: 语法错误`);
        console.error(error.message);
        hasError = true;
    }
}

// 特别检查repairNavData和validateNavData函数
const functionsToCheck = ['repairNavData', 'validateNavData', 'validateSiteData', 'checkSingleUrl'];
functionsToCheck.forEach(funcName => {
    const funcRegex = new RegExp(`function ${funcName}[^{]*\{[\s\S]*?\}`, 'g');
    const funcMatches = scriptBlocks[1].match(funcRegex); // 假设主要逻辑在第二个脚本块
    
    if (funcMatches) {
        console.log(`\n找到 ${funcName} 函数，验证语法...`);
        try {
            new Function(funcMatches[0]);
            console.log(`${funcName}: 语法正确`);
        } catch (error) {
            console.error(`${funcName}: 语法错误`);
            console.error(error.message);
            hasError = true;
        }
    } else {
        console.log(`\n未找到 ${funcName} 函数`);
    }
});

console.log(`\n验证完成: ${hasError ? '发现错误' : '全部正常'}`);