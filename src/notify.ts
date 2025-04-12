import axios from 'axios';
import { toQueryString } from './utils';
import { NotificationResult } from './types';

// 通知相关常量
const SERVERCHAN_API = 'https://sctapi.ftqq.com';
const PUSHPLUS_API = 'https://www.pushplus.plus/send';
const BARK_API = 'https://api.day.app';
const TELEGRAM_API = 'https://api.telegram.org/bot';
const DINGTALK_API = 'https://oapi.dingtalk.com/robot/send?access_token=';
const WECOM_API = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=';

/**
 * 获取通知标题
 * @returns {string} 通知标题
 */
export function getNotifyTitle(): string {
  // 获取GitHub Action的相关信息
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '小米运动';
  const runId = process.env.GITHUB_RUN_ID || '';
  const runNumber = process.env.GITHUB_RUN_NUMBER || '';
  
  // 组装标题，包含项目名称和运行信息
  let title = `${repoName}`;
  
  // 如果是在GitHub Action环境中运行，添加运行ID和序号
  if (runId && runNumber) {
    title += ` #${runNumber}`;
  }
  
  return title;
}

/**
 * 处理通知结果
 * @param {string} platform - 通知平台名称
 * @param {object} response - 通知平台响应
 * @returns {NotificationResult} 处理结果
 */
function handleNotifyResult(platform: string, response: any): NotificationResult {
  try {
    const statusCode = response.status;
    const result = response.data;
    
    // 构建信息字符串
    let infoStr = `状态码: ${statusCode}`;
    if (typeof result === 'object') {
      infoStr += `, 响应: ${JSON.stringify(result)}`;
    } else if (typeof result === 'string') {
      infoStr += `, 响应: ${result}`;
    }
    
    console.log(`📤 ${platform} 通知结果: ${infoStr}`);
    
    // 根据平台判断是否发送成功
    let success = false;
    let message = '';
    
    switch (platform) {
      case 'Server酱':
        success = statusCode === 200 && result.code === 0;
        message = result.message || '未知错误';
        break;
      case 'Bark':
        success = statusCode === 200 && result.code === 200;
        message = result.message || '未知错误';
        break;
      case 'Telegram':
        success = statusCode === 200 && result.ok === true;
        message = result.description || '未知错误';
        break;
      case 'DingTalk':
        success = statusCode === 200 && result.errcode === 0;
        message = result.errmsg || '未知错误';
        break;
      case 'Wecom':
        success = statusCode === 200 && result.errcode === 0;
        message = result.errmsg || '未知错误';
        break;
      case 'PushPlus':
        success = statusCode === 200 && result.code === 200;
        message = result.msg || '未知错误';
        break;
      default:
        success = statusCode >= 200 && statusCode < 300;
        message = '通知已发送';
    }
    
    if (success) {
      console.log(`✅ ${platform} 通知发送成功`);
    } else {
      console.error(`❌ ${platform} 通知发送失败: ${message}`);
    }
    
    return { success, message, platform };
  } catch (error: any) {
    console.error(`❌ 处理 ${platform} 通知结果时出错: ${error.message}`);
    return { success: false, message: error.message, platform };
  }
}

/**
 * 发送Server酱通知
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<NotificationResult>} 发送结果
 */
async function sendServerChan(title: string, content: string): Promise<NotificationResult> {
  try {
    const key = process.env.SERVERCHAN_KEY;
    if (!key) {
      return { success: false, message: 'KEY未设置', platform: 'Server酱' };
    }
    
    // 构建请求数据
    const data = {
      title: title,
      desp: content
    };
    
    // 发送请求
    const response = await axios.post(`${SERVERCHAN_API}/${key}.send`, data);
    
    return handleNotifyResult('Server酱', response);
  } catch (error: any) {
    console.error(`❌ 发送Server酱通知时出错: ${error.message}`);
    return { success: false, message: error.message, platform: 'Server酱' };
  }
}

/**
 * 发送Bark通知
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<NotificationResult>} 发送结果
 */
async function sendBark(title: string, content: string): Promise<NotificationResult> {
  try {
    let key = process.env.BARK_KEY;
    if (!key) {
      return { success: false, message: 'KEY未设置', platform: 'Bark' };
    }
    
    // 处理key，可能是完整URL或仅为key
    let url: string;
    if (key.startsWith('http')) {
      // 如果是完整URL
      if (key.endsWith('/')) {
        key = key.substring(0, key.length - 1);
      }
      url = `${key}/${encodeURIComponent(title)}/${encodeURIComponent(content)}`;
    } else {
      // 如果只是key
      url = `${BARK_API}/${key}/${encodeURIComponent(title)}/${encodeURIComponent(content)}`;
    }
    
    // 可选参数
    url += `?isArchive=1&sound=default`;
    
    // 发送请求
    const response = await axios.get(url);
    
    return handleNotifyResult('Bark', response);
  } catch (error: any) {
    console.error(`❌ 发送Bark通知时出错: ${error.message}`);
    return { success: false, message: error.message, platform: 'Bark' };
  }
}

/**
 * 发送Telegram通知
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<NotificationResult>} 发送结果
 */
async function sendTelegram(title: string, content: string): Promise<NotificationResult> {
  try {
    const botToken = process.env.TG_BOT_TOKEN;
    const chatId = process.env.TG_CHAT_ID;
    
    if (!botToken || !chatId) {
      return { success: false, message: '配置不完整', platform: 'Telegram' };
    }
    
    // 构建请求数据
    const data = {
      chat_id: chatId,
      text: `${title}\n\n${content}`,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };
    
    // 发送请求
    const response = await axios.post(`${TELEGRAM_API}${botToken}/sendMessage`, data);
    
    return handleNotifyResult('Telegram', response);
  } catch (error: any) {
    console.error(`❌ 发送Telegram通知时出错: ${error.message}`);
    return { success: false, message: error.message, platform: 'Telegram' };
  }
}

/**
 * 发送钉钉通知
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<NotificationResult>} 发送结果
 */
async function sendDingTalk(title: string, content: string): Promise<NotificationResult> {
  try {
    const webhook = process.env.DINGTALK_WEBHOOK;
    const secret = process.env.DINGTALK_SECRET;
    
    if (!webhook) {
      return { success: false, message: 'Webhook未设置', platform: 'DingTalk' };
    }
    
    // 从完整webhook URL中提取access_token
    let accessToken = webhook;
    if (webhook.includes('access_token=')) {
      accessToken = webhook.split('access_token=')[1];
      if (accessToken.includes('&')) {
        accessToken = accessToken.split('&')[0];
      }
    }
    
    // 构建请求URL
    let url = `${DINGTALK_API}${accessToken}`;
    
    // 如果有加签密钥，计算签名
    if (secret) {
      const crypto = require('crypto');
      const timestamp = Date.now();
      const stringToSign = `${timestamp}\n${secret}`;
      const signature = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64');
      
      url += `&timestamp=${timestamp}&sign=${encodeURIComponent(signature)}`;
    }
    
    // 构建请求数据
    const data = {
      msgtype: 'markdown',
      markdown: {
        title: title,
        text: `## ${title}\n\n${content.replace(/\n/g, '\n\n')}`
      }
    };
    
    // 发送请求
    const response = await axios.post(url, data);
    
    return handleNotifyResult('DingTalk', response);
  } catch (error: any) {
    console.error(`❌ 发送钉钉通知时出错: ${error.message}`);
    return { success: false, message: error.message, platform: 'DingTalk' };
  }
}

/**
 * 发送企业微信通知
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<NotificationResult>} 发送结果
 */
async function sendWecom(title: string, content: string): Promise<NotificationResult> {
  try {
    const key = process.env.WECOM_KEY;
    if (!key) {
      return { success: false, message: 'KEY未设置', platform: 'Wecom' };
    }
    
    // 构建请求数据
    const data = {
      msgtype: 'markdown',
      markdown: {
        content: `## ${title}\n\n${content.replace(/\n/g, '\n\n')}`
      }
    };
    
    // 发送请求
    const response = await axios.post(`${WECOM_API}${key}`, data);
    
    return handleNotifyResult('Wecom', response);
  } catch (error: any) {
    console.error(`❌ 发送企业微信通知时出错: ${error.message}`);
    return { success: false, message: error.message, platform: 'Wecom' };
  }
}

/**
 * 发送PushPlus通知
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<NotificationResult>} 发送结果
 */
async function sendPushPlus(title: string, content: string): Promise<NotificationResult> {
  try {
    const token = process.env.PUSHPLUS_TOKEN;
    if (!token) {
      return { success: false, message: 'TOKEN未设置', platform: 'PushPlus' };
    }
    
    // 构建请求数据
    const data = {
      token: token,
      title: title,
      content: content,
      template: 'markdown',
      channel: 'wechat'
    };
    
    // 发送请求
    const response = await axios.post(PUSHPLUS_API, data);
    
    return handleNotifyResult('PushPlus', response);
  } catch (error: any) {
    console.error(`❌ 发送PushPlus通知时出错: ${error.message}`);
    return { success: false, message: error.message, platform: 'PushPlus' };
  }
}

/**
 * 发送通知到所有配置的平台
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<void>}
 */
export async function sendNotification(title: string, content: string, platform?: string): Promise<void> {
  console.log('开始发送通知...');
  
  try {
    // 发送到Server酱
    await sendServerChan(title, content);
    
    // 发送到Bark
    await sendBark(title, content);
    
    // 发送到Telegram
    await sendTelegram(title, content);
    
    // 发送到钉钉
    await sendDingTalk(title, content);
    
    // 发送到企业微信
    await sendWecom(title, content);
    
    // 发送到PushPlus
    await sendPushPlus(title, content);
    
  } catch (error: any) {
    console.error(`❌ 发送通知时出错: ${error.message}`);
  }
} 