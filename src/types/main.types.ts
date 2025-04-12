/**
 * 主程序相关类型定义
 */

/**
 * 程序执行环境配置
 */
export interface ExecutionEnvironment {
  isGitHubAction: boolean;
  isLocalTest: boolean;
}

/**
 * 程序执行结果
 */
export interface ExecutionResult {
  status: 'success' | 'failure';
  message: string;
  step?: number;
  executionTime?: number;
} 