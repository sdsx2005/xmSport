// xmSport GitHub Action 脚本
const axios = require('axios');
const core = require('@actions/core');
const { processData } = require('./dataProcessor');
const { getCode, getLoginTokenAndUserId, getAppToken, sendData } = require('./apiService');
const { getRandomInt, formatDate } = require('./utils');
const { sendNotification, getNotifyTitle } = require('./notify');

// 执行主函数 - 使用立即执行的异步函数表达式
(async () => {
  const startTime = Date.now();
  let step = 0;
  let resultMessage = '';
  let status = 'failure'; // 默认状态为失败

  try {
    console.log('==========================================');
    console.log('🏃‍♂️ 开始执行 小米运动修改步数 脚本...');
    console.log('==========================================');
    
    // 获取当前时间
    const now = new Date();
    
    // 标准时间
    console.log(`📅 标准时间: ${formatDate(now, 'UTC', '+0')}`);
    // 北京时间
    console.log(`📅 北京时间: ${formatDate(now, 'Asia/Shanghai', '+8')}`);
    
    // 检查必要的环境变量
    if (!process.env.PHONE_NUMBER) {
      throw new Error('缺少必要的环境变量: PHONE_NUMBER');
    }
    
    if (!process.env.PASSWORD) {
      throw new Error('缺少必要的环境变量: PASSWORD');
    }
    
    if (!process.env.DATA_JSON) {
      throw new Error('缺少必要的环境变量: DATA_JSON');
    }
    
    // 获取步数范围
    const minStep = parseInt(process.env.xmSportMinStep || '10000', 10);
    const maxStep = parseInt(process.env.xmSportMaxStep || '19999', 10);
    
    // 验证步数范围的有效性
    if (minStep <= 0) {
      throw new Error('最小步数必须大于0');
    }
    
    if (maxStep <= minStep) {
      throw new Error('最大步数必须大于最小步数');
    }
    
    console.log(`👟 步数范围: ${minStep} - ${maxStep}`);
    
    // 生成随机步数
    step = getRandomInt(minStep, maxStep);
    console.log(`🎲 生成随机步数: ${step}`);
    
    // 处理数据模板
    console.log('📦 处理数据模板...');
    const dataJson = processData(step, process.env.DATA_JSON);
    
    // 执行API请求序列
    console.log('🔄 开始API请求序列...');
    const phoneNumber = process.env.PHONE_NUMBER;
    const password = process.env.PASSWORD;
    
    // 1. 获取code
    console.log('🔄 第1步: 获取登录Code...');
    const code = await getCode(phoneNumber, password);
    
    // 2. 获取loginToken和userId
    console.log('🔄 第2步: 获取LoginToken和UserId...');
    const { loginToken, userId } = await getLoginTokenAndUserId(code);
    
    // 3. 获取appToken
    console.log('🔄 第3步: 获取AppToken...');
    const appToken = await getAppToken(loginToken);
    
    // 4. 发送数据
    console.log('🔄 第4步: 发送步数数据...');
    const result = await sendData(userId, appToken, dataJson);
    
    // 完成
    console.log('==========================================');
    console.log(`✅ 成功完成! 步数已更新为: ${step} 步`);
    console.log(`📊 服务器响应: ${result}`);
    console.log('==========================================');
    
    // 设置输出
    core.setOutput('time', now.toISOString());
    core.setOutput('result', result);
    core.setOutput('step', step);
    
    // 设置通知信息
    status = 'success'; // 更新状态为成功
    resultMessage = `✅ 成功完成! 步数已更新为: ${step} 步`;
    
  } catch (error) {
    console.error('==========================================');
    console.error(`❌ 错误: ${error.message}`);
    if (error.response) {
      console.error('📡 服务器响应:');
      console.error(`状态码: ${error.response.status}`);
      console.error(`数据: ${JSON.stringify(error.response.data)}`);
    }
    console.error('==========================================');
    
    core.setFailed(`执行失败: ${error.message}`);
    
    // 设置错误通知信息
    resultMessage = `❌ 执行失败: ${error.message}`;
    if (error.response) {
      resultMessage += `\n📡 状态码: ${error.response.status}`;
    }
  } finally {
    // 无论成功还是失败都会执行的代码
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    console.log(`⏱️ 总执行时间: ${executionTime.toFixed(2)}秒`);
    console.log('==========================================');
    
    // 检查是否启用通知功能
    const enableNotify = process.env.ENABLE_NOTIFY === 'true';
    
    if (enableNotify) {
      // 构建通知内容
      let content = `${resultMessage}\n⏱️ 总执行时间: ${executionTime.toFixed(2)}秒`;
      
      // 如果存在手机号，添加到通知内容中（脱敏处理）
      if (process.env.PHONE_NUMBER) {
        content += `\n📱 手机号: ${process.env.PHONE_NUMBER.substring(0, 3)}xxxx${process.env.PHONE_NUMBER.substring(7)}`;
      }
      
      // 如果步数大于0，添加到通知内容中
      if (step > 0) {
        content += `\n👟 步数: ${step}`;
      }
      
      // 发送通知
      try {
        await sendNotification(content);
      } catch (notifyError) {
        console.error(`📳 发送通知时出错: ${notifyError.message}`);
      }
    }
  }
})(); 