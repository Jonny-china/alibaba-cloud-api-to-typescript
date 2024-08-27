import request from '../utils/request';

export interface GetApiInfoListResponse {
  code: number;
  data: GetApiInfoListData;
}

interface GetApiInfoListData {
  real_total: number;
  top_values: string[];
  keywords: string[];
  tab: string;
  total: number;
  page: number;
  perPage: number;
  pages: number;
  request_id: string;
  request_misc: string;
  list: GetApiInfoListList[];
}

interface GetApiInfoListList {
  api: string;
  product: string;
  product_name: string;
  title: string;
  version: string;
  id: string;
  is_recommended: string;
  sort_values: string[];
  search_summary: string;
}

/**
 * 根据搜索条件，获取接口列表
 * @param apiName
 * @returns
 */
export async function GetApiInfoList(apiName: string) {
  const resJson = await request<GetApiInfoListResponse>(
    `https://api.aliyun.com/api/search/api?query=${apiName}&query_type=direct&biz=workbench_top_bar&page=1&perPage=1000`,
  );
  if (resJson.code !== 0) {
    return [];
  }
  return resJson.data.list.map((item) => {
    return {
      data: {
        api: item.api,
        product: item.product,
        version: item.version,
      },
      label: `【${item.product_name}】${item.api}`,
      description: `【${item.version}】`,
      detail: item.search_summary,
    };
  });
}
