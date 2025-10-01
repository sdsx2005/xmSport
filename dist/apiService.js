"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCode = getCode;
exports.getLoginTokenAndUserId = getLoginTokenAndUserId;
exports.getAppToken = getAppToken;
exports.sendData = sendData;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
// 重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 初始延迟时间（毫秒）
const RETRY_MULTIPLIER = 1.5; // 延迟时间乘数
/**
 * 通用重试函数 - 为任何异步操作添加重试逻辑
 * @param {Function} asyncFn - 异步函数
 * @param {any[]} args - 函数参数
 * @param {string} operationName - 操作名称（用于日志）
 * @param {number} maxRetries - 最大重试次数
 * @param {number} initialDelay - 初始延迟时间（毫秒）
 * @param {number} multiplier - 延迟时间乘数
 * @returns {Promise<T>} 函数结果
 */
function withRetry(asyncFn_1) {
    return __awaiter(this, arguments, void 0, function* (asyncFn, args = [], operationName = '请求操作', maxRetries = MAX_RETRIES, initialDelay = RETRY_DELAY, multiplier = RETRY_MULTIPLIER) {
        let retries = 0;
        let delay = initialDelay;
        while (true) {
            try {
                return yield asyncFn(...args);
            }
            catch (error) {
                retries++;
                // 检查是否达到最大重试次数
                if (retries >= maxRetries) {
                    console.error(`${operationName}失败，已达到最大重试次数(${maxRetries}次)`);
                    throw error;
                }
                // 计算延迟时间
                delay = Math.floor(delay * multiplier);
                console.log(`${operationName}失败，${retries}秒后重试(${retries}/${maxRetries})...`);
                // 输出错误信息
                if (error.response) {
                    console.error(`状态码: ${error.response.status}`);
                    console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
                }
                else if (error.request) {
                    console.error('无响应');
                }
                else {
                    console.error(`错误: ${error.message}`);
                }
                // 等待延迟时间
                yield new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    });
}
/**
 * 执行Axios请求
 * @param {AxiosRequestConfig} config - Axios配置
 * @returns {Promise<T>} 请求响应数据
 */
function executeRequest(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, axios_1.default)(config);
        return response.data;
    });
}
/**
 * 获取登录Code
 * @param {string} phoneNumber - 手机号
 * @param {string} password - 密码
 * @returns {Promise<string>} 登录Code
 */
/**
 * 获取登录Code及thirdName
 * @param {string} phoneNumber - 手机号
 * @param {string} password - 密码
 * @returns {Promise<{ code: string, thirdName: string }>} 登录Code和thirdName
 */
function getCode(phoneNumber, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const getLoginCode = () => __awaiter(this, void 0, void 0, function* () {
                // 构造请求配置
                const PHONE_PATTERN = /^(1)\d{10}$/;
                const isPhone = PHONE_PATTERN.test(phoneNumber);
                const processedPhone = isPhone ? `+86${phoneNumber}` : phoneNumber;
                const thirdName = isPhone ? 'huami_phone' : 'huami';
                const url = `https://api-user.huami.com/registrations/${processedPhone}/tokens`;
                const headers = {
                    'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'user-agent': 'MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)',
                    "app_name": "com.xiaomi.hm.health",
                };
                const data = {
                    client_id: 'HuaMi',
                    country_code: 'CN',
                    json_response: 'true',
                    name: processedPhone,
                    password: password,
                    redirect_uri: 'https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html',
                    state: 'REDIRECTION',
                    token: 'access'
                };
                const response = yield axios_1.default.post(url, (0, utils_1.toQueryString)(data), {
                    headers: headers,
                    maxRedirects: 0,
                    validateStatus: status => status >= 200 && status < 400
                });
                // 返回 access code 和 thirdName
                if (response.data && response.data.access) {
                    return { code: response.data.access, thirdName };
                }
                else {
                    throw new Error('未能获取到code');
                }
            });
            // 使用withRetry执行请求
            const result = yield withRetry(getLoginCode, [], '获取登录Code');
            console.log('🔐 获取Code成功');
            return result;
        }
        catch (error) {
            console.error(`获取登录Code出错: ${error.message}`);
            if (error.response) {
                console.error(`状态码: ${error.response.status}`);
                console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
            }
            return { code: '', thirdName: '' };
        }
    });
}
/**
 * 获取登录Token和用户ID
 * @param {string} code - 登录Code
 * @returns {Promise<LoginTokenAndUserIdResult>} 登录Token和用户ID
 */
function getLoginTokenAndUserId(code, thirdName) {
    return __awaiter(this, void 0, void 0, function* () {
        const getTokenAndUserId = () => __awaiter(this, void 0, void 0, function* () {
            const url = 'https://account.huami.com/v2/client/login';
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'MiFit/6.12.0 (MCE16; Android 16; Density/1.5)'
            };
            // 按照新要求重写data
            const data = {
                app_name: 'com.xiaomi.hm.health',
                country_code: 'CN',
                code: code,
                device_id: '02:00:00:00:00:00',
                device_model: 'android_phone',
                app_version: '6.12.0',
                grant_type: 'access_token',
                allow_registration: 'false',
                source: 'com.xiaomi.hm.health',
                third_name: thirdName
            };
            const response = yield axios_1.default.post(url, (0, utils_1.toQueryString)(data), {
                headers: headers
            });
            if (!response.data.token_info || !response.data.token_info.login_token || !response.data.token_info.user_id) {
                throw new Error('响应数据中缺少必要的token_info字段');
            }
            const loginToken = response.data.token_info.login_token;
            const userId = response.data.token_info.user_id;
            return { loginToken, userId };
        });
        // 使用withRetry执行请求
        const result = yield withRetry(getTokenAndUserId, [], '获取登录Token和用户ID');
        console.log('🔐 获取LoginToken和UserId成功');
        return result;
    });
}
/**
 * 获取App Token
 * @param {string} loginToken - 登录Token
 * @returns {Promise<string>} App Token
 */
function getAppToken(loginToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchAppToken = () => __awaiter(this, void 0, void 0, function* () {
            const url = `https://account-cn.huami.com/v1/client/app_tokens?app_name=com.xiaomi.hm.health&dn=api-user.huami.com,api-mifit.huami.com,app-analytics.huami.com&login_token=${loginToken}`;
            const headers = {
                'User-Agent': 'MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)'
            };
            const response = yield axios_1.default.get(url, {
                headers: headers
            });
            if (!response.data.token_info || !response.data.token_info.app_token) {
                throw new Error('响应数据中缺少必要的app_token字段');
            }
            return response.data.token_info.app_token;
        });
        // 使用withRetry执行请求
        const appToken = yield withRetry(fetchAppToken, [], '获取AppToken');
        console.log('🔐 获取AppToken成功');
        return appToken;
    });
}
/**
 * 发送数据到API
 * @param userId 用户ID
 * @param appToken APP令牌
 * @param dataJson 数据JSON
 * @returns API响应
 */
function sendData(userId, appToken, dataJson) {
    return __awaiter(this, void 0, void 0, function* () {
        const sendDataRequest = () => __awaiter(this, void 0, void 0, function* () {
            const url = `https://api-mifit-cn2.huami.com/v1/data/band_data.json`;
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'apptoken': appToken
            };
            const data = {
                userid: userId,
                last_sync_data_time: '1597306380',
                device_type: '0',
                last_deviceid: 'DA932FFFFE8816E7',
                data_json: dataJson
            };
            const config = {
                method: 'post',
                url: url,
                headers: headers,
                data: (0, utils_1.toQueryString)(data)
            };
            const response = yield executeRequest(config);
            // 如果响应中包含message字段，则认为发送成功
            if (response && typeof response.message !== 'undefined') {
                console.log(`成功发送数据: ${response.message}`);
                return response;
            }
            else {
                console.error('发送数据返回未知响应: ', response);
                throw new Error('发送数据返回未知响应');
            }
        });
        // 使用withRetry执行请求
        return yield withRetry(sendDataRequest, [], '发送数据');
    });
}
