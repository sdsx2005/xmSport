"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 本地测试脚本 - 自动读取data.txt并设置环境变量
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
// 加载.env文件
dotenv_1.default.config();
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
}
catch (err) {
    console.error(`❌ 读取data.txt出错: ${err.message}`);
    process.exit(1);
}
// 编译后的脚本路径
const scriptPath = path.join(__dirname, '..', 'dist', 'index.js');
console.log(`🚀 运行脚本: ${scriptPath}`);
// 运行实际脚本
const script = (0, child_process_1.spawn)('node', [scriptPath], {
    stdio: 'inherit',
    env: process.env
});
script.on('close', (code) => {
    console.log(`脚本退出，退出码: ${code || 0}`);
});
