/**
 * 小米运动API服务
 * 包含与小米运动API通信的核心功能
 */
const axios = require('axios');
const { toQueryString } = require('./utils');

// 辅助函数：延时等待
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 全局配置
const MAX_RETRIES = 3;           // 最大重试次数
const RETRY_DELAY = 3000;        // 重试延迟(ms)
const RETRY_MULTIPLIER = 2;      // 重试延迟倍数

/**
 * 带重试机制的请求函数
 * @param {Function} requestFn - 请求函数
 * @param {string} operationName - 操作名称
 * @param {number} maxRetries - 最大重试次数
 * @param {number} initialDelay - 初始延迟(ms)
 * @param {number} delayMultiplier - 延迟倍数
 * @returns {Promise<any>} 请求结果
 */
async function withRetry(requestFn, operationName, maxRetries = MAX_RETRIES, initialDelay = RETRY_DELAY, delayMultiplier = RETRY_MULTIPLIER) {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await requestFn();
    } catch (error) {
      retries++;
      
      // 429错误特殊处理
      const isRateLimited = error.response && error.response.status === 429;
      
      if (retries > maxRetries || (!isRateLimited && error.response && error.response.status >= 400 && error.response.status < 500)) {
        console.error(`❌ ${operationName}失败(尝试 ${retries}/${maxRetries}): ${error.message}`);
        throw error;
      }
      
      // 计算下次重试延迟
      if (isRateLimited) {
        // 限流时使用更长的延迟
        delay = delay * delayMultiplier * 2;
        console.warn(`⏳ 请求被限流，将在 ${delay}ms 后重试 (${retries}/${maxRetries})...`);
      } else {
        delay = delay * delayMultiplier;
        console.warn(`⏳ ${operationName}失败，将在 ${delay}ms 后重试 (${retries}/${maxRetries})...`);
      }
      
      await sleep(delay);
    }
  }
}

/**
 * 获取登录code
 * @param {string} phoneNumber - 手机号
 * @param {string} password - 密码  
 * @returns {Promise<string>} 返回code字符串
 */
async function getCode(phoneNumber, password) {
  return withRetry(async () => {
    const url = `https://api-user.huami.com/registrations/+86${phoneNumber}/tokens`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': 'MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)'
    };
    const data = {
      client_id: 'HuaMi',
      password: password,
      redirect_uri: 'https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html',
      token: 'access'
    };
    
    const response = await axios.post(url, toQueryString(data), {
      headers: headers,
      maxRedirects: 0,
      validateStatus: status => status >= 200 && status < 400
    });
    
    const location = response.headers.location;
    
    if (!location) {
      throw new Error('无法获取重定向地址');
    }
    
    const codeMatch = /(?<=access=).*?(?=&)/.exec(location);
    
    if (!codeMatch || !codeMatch[0]) {
      throw new Error('无法从重定向地址中提取code');
    }
    
    const code = codeMatch[0];
    console.log('🔐 获取Code成功');
    return code;
  }, '获取Code');
}

/**
 * 获取登录token和用户ID
 * @param {string} code - 登录code
 * @returns {Promise<Object>} 返回包含loginToken和userId的对象
 */
async function getLoginTokenAndUserId(code) {
  return withRetry(async () => {
    const url = 'https://account.huami.com/v2/client/login';
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': 'MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)'
    };
    const data = {
      app_name: 'com.xiaomi.hm.health',
      app_version: '4.6.0',
      code: code,
      country_code: 'CN',
      device_id: '2C8B4939-0CCD-4E94-8CBA-CB8EA6E613A1',
      device_model: 'phone',
      grant_type: 'access_token',
      third_name: 'huami_phone'
    };
    
    const response = await axios.post(url, toQueryString(data), {
      headers: headers
    });
    
    if (!response.data.token_info || !response.data.token_info.login_token || !response.data.token_info.user_id) {
      throw new Error('响应数据中缺少必要的token_info字段');
    }
    
    const loginToken = response.data.token_info.login_token;
    const userId = response.data.token_info.user_id;
    
    console.log('🔐 获取LoginToken和UserId成功');
    return { loginToken, userId };
  }, '获取LoginToken和UserId');
}

/**
 * 获取应用token
 * @param {string} loginToken - 登录token
 * @returns {Promise<string>} 返回app token
 */
async function getAppToken(loginToken) {
  return withRetry(async () => {
    const url = `https://account-cn.huami.com/v1/client/app_tokens?app_name=com.xiaomi.hm.health&dn=api-user.huami.com,api-mifit.huami.com,app-analytics.huami.com&login_token=${loginToken}`;
    const headers = {
      'User-Agent': 'MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)'
    };
    
    const response = await axios.get(url, {
      headers: headers
    });
    
    if (!response.data.token_info || !response.data.token_info.app_token) {
      throw new Error('响应数据中缺少必要的app_token字段');
    }
    
    const appToken = response.data.token_info.app_token;
    
    console.log('🔐 获取AppToken成功');
    return appToken;
  }, '获取AppToken');
}

/**
 * 发送数据
 * @param {string} userId - 用户ID
 * @param {string} appToken - 应用token
 * @param {string} dataJson - 要发送的数据JSON字符串
 * @returns {Promise<string>} 返回操作结果消息
 */
async function sendData(userId, appToken, dataJson) {
  return withRetry(async () => {
    const url = `https://api-mifit-cn.huami.com/v1/data/band_data.json?t=${new Date().getTime()}`;
    const headers = {
      'apptoken': appToken,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)'
    };
    const data = {
      userid: userId,
      last_sync_data_time: '1597306380',
      device_type: '0',
      last_deviceid: 'DA932FFFFE8816E7',
      data_json: dataJson
    };
    
    const response = await axios.post(url, toQueryString(data), {
      headers: headers
    });
    
    if (!response.data || typeof response.data.message === 'undefined') {
      throw new Error('响应数据中缺少message字段');
    }
    
    const message = response.data.message;
    
    console.log('✅ 数据发送成功');
    return message;
  }, '发送数据');
}

module.exports = {
  getCode,
  getLoginTokenAndUserId,
  getAppToken,
  sendData
}; 