/**
 * 获取接口数据
 *
 * @param {string} url
 */
export default async function request<T = unknown>(url: string): Promise<T> {
  return fetch(url).then((res) => res.json() as Promise<T>);
}
