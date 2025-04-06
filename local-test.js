/**
 * 本地测试脚本 - 自动读取data.txt并设置环境变量
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 加载.env文件
require('dotenv').config();

// 读取data.txt文件
try {
  const dataFilePath = path.join(__dirname, 'src', 'data.txt');
  const dataContent = fs.readFileSync(dataFilePath, 'utf8');
  
  console.log('✅ 已读取data.txt文件');
  
  // 设置DATA_JSON环境变量
  process.env.DATA_JSON = dataContent;
  
  // 启动主程序
  console.log('🚀 正在启动主程序...');
  
  const childProcess = spawn('node', ['src/index.js'], {
    stdio: 'inherit',
    env: process.env
  });
  
  childProcess.on('exit', (code) => {
    console.log(`⏹️ 程序执行结束，退出码: ${code}`);
  });
  
} catch (error) {
  console.error(`❌ 读取data.txt文件失败: ${error.message}`);
  process.exit(1);
} 