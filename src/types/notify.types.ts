/**
 * 通知服务相关类型定义
 */

/**
 * 通知选项接口
 */
export interface NotificationOptions {
  title: string;
  content: string;
  platform?: string;
}

/**
 * 通知结果接口
 */
export interface NotificationResult {
  success: boolean;
  message: string;
  platform: string;
}

/**
 * 各平台通知配置接口
 */
export interface NotificationConfig {
  enabled: boolean;
  key?: string;
  token?: string;
  webhook?: string;
  chatId?: string;
} 