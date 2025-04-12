/**
 * 工具函数集合
 */

/**
 * 将对象转换为URL查询字符串
 * @param {Object} obj - 要转换的对象
 * @returns {string} URL查询字符串
 */
function toQueryString(obj) {
  return Object.keys(obj).map(key => `${key}=${obj[key]}`).join('&');
}

/**
 * 获取指定范围内的随机整数
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
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {string} timezone - 时区
 * @param {string} offset - 时区偏移显示值
 * @returns {string} 格式化后的时间字符串
 */
function formatDate(date, timezone, offset) {
  const options = { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false,
    timeZone: timezone
  };
  
  const formattedDate = date.toLocaleString('zh-CN', options);
  return `${formattedDate} (${offset})`;
}

module.exports = {
  toQueryString,
  getRandomInt,
  formatDate
}; 