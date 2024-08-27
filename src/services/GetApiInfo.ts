import { Schema } from '../interfaces';
import request from '../utils/request';

export interface GetApiInfoRequest {
  product: string;
  version: string;
  api: string;
}

export interface ApiInfo {
  parameters: Parameter[];
  responses: Record<'200', Response>;
  errorCodes: Record<string, ErrorDetail>;
  title: string;
  summary: string;
}
interface Parameter {
  /**
   * 参数名称
   */
  name: string;

  /**
   * 参数位置
   */
  in: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 是否必填
   */
  required: boolean;

  /**
   * 是否已弃用
   */
  deprecated?: boolean;

  /**
   * 参数的风格
   */
  style?: string;

  /**
   * 数据结构
   */
  schema?: Schema;
}

interface Response {
  /**
   * 响应描述
   */
  description?: string;

  /**
   * 响应头
   */
  headers?: Record<string, string>;

  /**
   * 数据结构
   */
  schema: Schema;
}

interface ErrorDetail {
  errorCode: string;
  errorMessage: string;
}

/**
 * 获取接口详情
 */
export async function GetApiInfo(data: GetApiInfoRequest) {
  return request<ApiInfo>(
    `https://api.aliyun.com/meta/v1/products/${data.product}/versions/${data.version}/apis/${data.api}/api.json`,
  );
}
