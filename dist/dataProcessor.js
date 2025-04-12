"use strict";
/**
 * 处理步数数据的模块
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processData = processData;
/**
 * 处理步数数据
 * @param {number} step - 要设置的步数
 * @param {string} [jsonTemplate] - 可选的JSON模板字符串
 * @returns {string} 处理后的数据JSON字符串
 */
function processData(step, jsonTemplate) {
    // 步数值校验
    if (typeof step !== 'number' || isNaN(step) || step <= 0) {
        throw new Error('❌ 步数必须是大于0的有效数字');
    }
    // 如果没有提供模板，但环境变量中有DATA_JSON，则使用环境变量
    if (!jsonTemplate && process.env.DATA_JSON) {
        const envTemplate = process.env.DATA_JSON.trim();
        if (!envTemplate) {
            throw new Error('❌ DATA_JSON环境变量为空');
        }
        return processExistingTemplate(step, envTemplate);
    }
    // 如果提供了模板，则处理现有模板
    if (jsonTemplate) {
        if (typeof jsonTemplate !== 'string' || !jsonTemplate.trim()) {
            throw new Error('❌ 提供的JSON模板无效');
        }
        return processExistingTemplate(step, jsonTemplate);
    }
    // 否则抛出错误
    throw new Error('❌ 缺少数据模板，请提供jsonTemplate参数或设置DATA_JSON环境变量');
}
/**
 * 处理现有模板
 * @param {number} step - 要设置的步数
 * @param {string} jsonTemplate - JSON模板字符串
 * @returns {string} 处理后的数据JSON字符串
 */
function processExistingTemplate(step, jsonTemplate) {
    // 获取当前日期
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    try {
        // 尝试使用正则表达式匹配
        const finddate = /.*?date%22%3A%22(.*?)%22%2C%22data.*?/;
        const findstep = /.*?ttl%5C%22%3A(.*?)%2C%5C%22dis.*?/;
        let processedData = jsonTemplate;
        // 替换日期
        const dateMatch = finddate.exec(processedData);
        if (dateMatch && dateMatch[1]) {
            processedData = processedData.replace(dateMatch[1], currentDate);
            // 判断是否修改成功
            const checkDateMatch = finddate.exec(processedData);
            if (checkDateMatch && checkDateMatch[1] === currentDate) {
                console.log(`📅 日期已更新: ${currentDate}`);
            }
            else {
                console.warn('⚠️ 日期更新失败，请检查模板格式');
            }
        }
        else {
            console.warn('⚠️ 无法找到日期字段，跳过日期更新');
        }
        // 替换步数
        const stepMatch = findstep.exec(processedData);
        if (stepMatch && stepMatch[1]) {
            processedData = processedData.replace(stepMatch[1], String(step));
            // 判断是否修改成功
            const checkStepMatch = findstep.exec(processedData);
            if (checkStepMatch && checkStepMatch[1] === String(step)) {
                console.log(`👣 步数已更新: ${step}`);
            }
            else {
                console.warn('⚠️ 步数更新失败，请检查模板格式');
            }
        }
        else {
            console.warn('⚠️ 无法找到步数字段，跳过步数更新');
        }
        // 验证是否包含必要字段
        if (!processedData.includes('data_json') || !processedData.includes('ttl')) {
            console.warn('⚠️ 处理后的数据中可能缺少必要字段，请检查模板格式');
        }
        return processedData;
    }
    catch (error) {
        throw new Error(`❌ 处理模板时出错: ${error instanceof Error ? error.message : String(error)}`);
    }
}
