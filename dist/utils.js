"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toQueryString = toQueryString;
exports.getRandomInt = getRandomInt;
exports.formatDate = formatDate;
/**
 * 将对象转换为URL查询字符串
 * @param {object} obj - 要转换的对象
 * @returns {string} 转换后的查询字符串
 */
function toQueryString(obj) {
    return Object.keys(obj).map(key => `${key}=${obj[key]}`).join('&');
}
/**
 * 获取包含最小值和最大值在内的随机整数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * 格式化日期为指定格式
 * @param {Date} date - 日期对象
 * @param {string} timezone - 时区，例如 'UTC', 'Asia/Shanghai'
 * @param {string} offset - 与UTC的偏移，例如 '+8'
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, timezone, offset) {
    const options = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    return new Intl.DateTimeFormat('zh-CN', options).format(date) + ` (UTC${offset})`;
}
