/**
 * 通知模块 - 支持多种推送渠道发送脚本运行结果通知
 */
const axios = require('axios');
const { formatDate } = require('./utils');

/**
 * 构建通知标题
 * @returns {string} 通知标题
 */
function getNotifyTitle() {
  return `小米运动步数修改 - ${formatDate(new Date(), 'Asia/Shanghai', '+8').split(' ')[0]}`;
}

/**
 * 处理通知发送的结果
 * @param {string} platform - 平台名称
 * @param {Object} response - 响应结果
 */
function handleNotifyResult(platform, response) {
  if (response && response.status === 200) {
    console.log(`✅ ${platform}通知发送成功`);
  } else {
    console.log(`⚠️ ${platform}通知发送失败: ${response?.statusText || '未知错误'}`);
  }
}

/**
 * Server酱通知 (ServerChan)
 * @param {string} key - Server酱发送KEY (SCKey)
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<Object>} 发送结果
 */
async function sendServerChan(key, title, content) {
  if (!key) return { success: false, message: 'Server酱KEY未设置' };
  
  try {
    const url = `https://sctapi.ftqq.com/${key}.send`;
    const response = await axios.post(url, {
      title: title,
      desp: content
    });
    handleNotifyResult('Server酱', response);
    return { success: true };
  } catch (error) {
    console.error(`❌ Server酱通知发送失败: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Bark通知
 * @param {string} key - Bark推送KEY
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<Object>} 发送结果
 */
async function sendBark(key, title, content) {
  if (!key) return { success: false, message: 'Bark KEY未设置' };
  
  try {
    // 处理Bark地址，兼容自建服务和官方服务
    let barkUrl = key;
    if (!barkUrl.startsWith('http')) {
      barkUrl = `https://api.day.app/${key}`;
    }
    if (!barkUrl.endsWith('/')) {
      barkUrl += '/';
    }
    
    const url = `${barkUrl}${encodeURIComponent(title)}/${encodeURIComponent(content)}`;
    const response = await axios.get(url);
    handleNotifyResult('Bark', response);
    return { success: true };
  } catch (error) {
    console.error(`❌ Bark通知发送失败: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Telegram Bot通知
 * @param {string} botToken - Telegram Bot Token
 * @param {string} chatId - Telegram Chat ID
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<Object>} 发送结果
 */
async function sendTelegram(botToken, chatId, title, content) {
  if (!botToken || !chatId) {
    console.error('❌ Telegram配置不完整: Token或ChatID未设置');
    return { success: false, message: 'Telegram配置不完整: Token或ChatID未设置' };
  }
  
  try {
    console.log(`🔄 正在发送Telegram消息...`);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    // 只发送内容，避免重复标题
    const plainTextPayload = {
      chat_id: chatId,
      text: content, // 不再包含标题，只发送内容
      parse_mode: '' // 不使用任何格式化
    };
    
    console.log(`📤 正在尝试以纯文本模式发送Telegram消息...`);
    const response = await axios.post(url, plainTextPayload);
    
    if (response.data && response.data.ok) {
      console.log(`✅ Telegram通知发送成功`);
      return { success: true };
    } else {
      console.error(`❌ Telegram API返回错误: ${JSON.stringify(response.data)}`);
      return { success: false, message: JSON.stringify(response.data) };
    }
  } catch (error) {
    console.error(`❌ Telegram通知发送失败:`);
    console.error(`- 错误消息: ${error.message}`);
    
    if (error.response) {
      console.error(`- 状态码: ${error.response.status}`);
      console.error(`- 响应数据: ${JSON.stringify(error.response.data)}`);
      
      // 如果是格式问题，尝试不使用格式化再次发送
      if (error.response.status === 400 && error.response.data?.description?.includes('parse')) {
        try {
          console.log(`🔄 尝试以纯文本格式重新发送...`);
          const retryUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          const retryPayload = {
            chat_id: chatId,
            text: content, // 只发送内容
            parse_mode: '' // 不使用任何格式化
          };
          
          const retryResponse = await axios.post(retryUrl, retryPayload);
          if (retryResponse.data && retryResponse.data.ok) {
            console.log(`✅ Telegram通知重新发送成功`);
            return { success: true };
          }
        } catch (retryError) {
          console.error(`❌ Telegram通知重新发送也失败: ${retryError.message}`);
        }
      }
    }
    
    return { success: false, message: error.message };
  }
}

/**
 * 钉钉机器人通知
 * @param {string} webhook - 钉钉Webhook地址
 * @param {string} secret - 钉钉安全密钥
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<Object>} 发送结果
 */
async function sendDingTalk(webhook, secret, title, content) {
  if (!webhook) return { success: false, message: '钉钉Webhook未设置' };
  
  try {
    // 如果有安全密钥，需要计算签名
    let url = webhook;
    if (secret) {
      const crypto = require('crypto');
      const timestamp = Date.now();
      const hmac = crypto.createHmac('sha256', secret);
      const sign = encodeURIComponent(hmac.update(`${timestamp}\n${secret}`).digest('base64'));
      url = `${webhook}&timestamp=${timestamp}&sign=${sign}`;
    }
    
    const response = await axios.post(url, {
      msgtype: 'markdown',
      markdown: {
        title: title,
        text: `### ${title}\n${content}`
      }
    });
    handleNotifyResult('钉钉', response);
    return { success: true };
  } catch (error) {
    console.error(`❌ 钉钉通知发送失败: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * 企业微信通知
 * @param {string} key - 企业微信Webhook Key
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<Object>} 发送结果
 */
async function sendWecom(key, title, content) {
  if (!key) return { success: false, message: '企业微信KEY未设置' };
  
  try {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`;
    const response = await axios.post(url, {
      msgtype: 'markdown',
      markdown: {
        content: `### ${title}\n${content}`
      }
    });
    handleNotifyResult('企业微信', response);
    return { success: true };
  } catch (error) {
    console.error(`❌ 企业微信通知发送失败: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * PushPlus通知
 * @param {string} token - PushPlus Token
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @returns {Promise<Object>} 发送结果
 */
async function sendPushPlus(token, title, content) {
  if (!token) return { success: false, message: 'PushPlus Token未设置' };
  
  try {
    const url = 'https://www.pushplus.plus/send';
    const response = await axios.post(url, {
      token: token,
      title: title,
      content: content,
      template: 'markdown'
    });
    handleNotifyResult('PushPlus', response);
    return { success: true };
  } catch (error) {
    console.error(`❌ PushPlus通知发送失败: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * 发送通知到所有已配置的平台
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容（已包含标题信息）
 */
async function sendNotification(title, content) {
  try {    
    console.log('📣 正在发送通知...');
    const notifyTasks = [];
    let notifyCount = 0;
    
    // Server酱通知
    if (process.env.SERVERCHAN_KEY) {
      notifyTasks.push(sendServerChan(process.env.SERVERCHAN_KEY, title, content));
      notifyCount++;
    }
    
    // Bark通知
    if (process.env.BARK_KEY) {
      notifyTasks.push(sendBark(process.env.BARK_KEY, title, content));
      notifyCount++;
    }
    
    // Telegram通知
    if (process.env.TG_BOT_TOKEN && process.env.TG_CHAT_ID) {
      notifyTasks.push(sendTelegram(process.env.TG_BOT_TOKEN, process.env.TG_CHAT_ID, title, content));
      notifyCount++;
    }
    
    // 钉钉通知
    if (process.env.DINGTALK_WEBHOOK) {
      notifyTasks.push(sendDingTalk(process.env.DINGTALK_WEBHOOK, process.env.DINGTALK_SECRET, title, content));
      notifyCount++;
    }
    
    // 企业微信通知
    if (process.env.WECOM_KEY) {
      notifyTasks.push(sendWecom(process.env.WECOM_KEY, title, content));
      notifyCount++;
    }
    
    // PushPlus通知
    if (process.env.PUSHPLUS_TOKEN) {
      notifyTasks.push(sendPushPlus(process.env.PUSHPLUS_TOKEN, title, content));
      notifyCount++;
    }
    
    if (notifyCount === 0) {
      console.log('ℹ️ 未配置任何通知渠道，跳过通知发送');
      return;
    }
    
    // 等待所有通知发送完成
    const results = await Promise.allSettled(notifyTasks);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    console.log(`📊 通知发送完成: ${successCount}/${notifyCount} 个渠道发送成功`);
  } catch (error) {
    console.error(`❌ 发送通知时出错: ${error.message}`);
  }
}

module.exports = {
  getNotifyTitle,
  sendNotification
}; 