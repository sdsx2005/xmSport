/**
 * 数据处理相关类型定义
 */

/**
 * 步数数据配置接口
 */
export interface StepDataConfig {
  minStep: number;
  maxStep: number;
}

/**
 * 步数数据处理结果接口
 */
export interface ProcessDataResult {
  success: boolean;
  message: string;
  dataJson?: string;
  step?: number;
} 