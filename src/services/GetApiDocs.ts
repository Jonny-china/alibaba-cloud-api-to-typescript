import request from '../utils/request';
import { ApiInfo } from './GetApiInfo';

interface GetApiDocsRequest {
  /**
   * 产品名称
   */
  product: string;

  /**
   * 版本
   */
  version: string;
}

interface GetApiDocsResponse {
  apis: Record<string, ApiInfo>;
}

/**
 * 获取接口详情
 */
export async function GetApiDocs(data: GetApiDocsRequest) {
  return request<GetApiDocsResponse>(
    `https://api.aliyun.com/meta/v1/products/${data.product}/versions/${data.version}/api-docs.json`,
  ).then((res) => {
    if (res?.apis) {
      return Object.entries(res.apis).map(([name, item]) => {
        return {
          data: item,
          label: name,
          description: `【${item.title}】`,
          detail: item.summary,
        };
      });
    }
    return [];
  });
}
