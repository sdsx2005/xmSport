/**
 * 本地测试脚本 - 自动读取data.txt并设置环境变量
 */
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// 加载.env文件
dotenv.config();

// 读取data.txt文件
try {
  // 先尝试从dist目录读取
  let dataPath = path.join(__dirname, '..', 'dist', 'data.txt');
  
  // 如果dist中不存在，则从src目录读取
  if (!fs.existsSync(dataPath)) {
    dataPath = path.join(__dirname, 'data.txt');
  }
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ 错误: 找不到data.txt文件，请确保src或dist目录中存在此文件');
    process.exit(1);
  }
  
  const dataContent = fs.readFileSync(dataPath, 'utf8');
  
  // 设置DATA_JSON环境变量
  process.env.DATA_JSON = dataContent;
  
  console.log('✅ 已读取data.txt并设置为环境变量');
} catch (err: any) {
  console.error(`❌ 读取data.txt出错: ${err.message}`);
  process.exit(1);
}

// 编译后的脚本路径
const scriptPath = path.join(__dirname, '..', 'dist', 'index.js');

console.log(`🚀 运行脚本: ${scriptPath}`);

// 运行实际脚本
const script = spawn('node', [scriptPath], {
  stdio: 'inherit',
  env: process.env
});

script.on('close', (code) => {
  console.log(`脚本退出，退出码: ${code || 0}`);
}); 