/**
 * API 接口相关类型定义
 */

/**
 * 登录响应接口
 */
export interface LoginResponse {
  token_info: {
    login_token: string;
    app_token: string;
    user_id: string;
  };
  result: string;
}

/**
 * App Token 响应接口
 */
export interface AppTokenResponse {
  token_info: {
    app_token: string;
  };
  result: string;
}

/**
 * 通用 API 响应接口
 */
export interface ApiResponse {
  message?: string;
  [key: string]: any;
}

/**
 * 获取登录 Token 和用户 ID 的结果接口
 */
export interface LoginTokenAndUserIdResult {
  loginToken: string;
  userId: string;
}

/**
 * API 请求选项接口
 */
export interface ApiRequestOptions {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: string | Record<string, any>;
  operationName?: string;
  [key: string]: any;
} 