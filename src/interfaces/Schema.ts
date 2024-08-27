/**
 * Api Schema
 */
export interface Schema {
  /**
   * 枚举值
   */
  enum?: string[];

  /**
   * 名称
   */
  name?: string;

  /**
   * 标题
   */
  title?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 类型
   */
  type?: string;

  /**
   * 格式
   */
  format?: string;

  /**
   * 对象类型的属性
   */
  properties?: Schema;

  /**
   * 数组类型的元素
   */
  items?: Schema;

  /**
   * 是否弃用
   */
  deprecated?: boolean;

  /**
   * 是否必填
   */
  required?: boolean;

  /**
   * 默认值
   */
  default?: string;

  /**
   * 示例
   */
  example?: string;

  /**
   * 枚举值标题
   */
  enumValueTitles?: Record<string, string>;
}
