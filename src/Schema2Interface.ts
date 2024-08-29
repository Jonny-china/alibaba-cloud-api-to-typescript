import { Schema } from './interfaces';
import { ApiInfo } from './services';
import upperFirst from 'lodash/upperFirst';
import lowerFirst from 'lodash/lowerFirst';
import snakeCase from 'lodash/snakeCase';
import * as vscode from 'vscode';
import { EXTENSION_NAME } from './utils/extensionName';

interface InterfaceSchema {
  name: string;
  schema: Schema;
}

const baseTypeMap: Record<string, string> = {
  string: 'string',
  integer: 'number',
  boolean: 'boolean',
};

export class Schema2Interface {
  /**
   * 接口列表
   */
  private interfaces: string[] = [];
  /**
   * 枚举列表
   */
  private enums: string[] = [];

  /**
   * 接口名称集合
   */
  private typeNames: Set<string> = new Set();

  /**
   * 是否使用export
   */
  private useExport: boolean;
  /**
   * 属性格式化
   */
  private propertyFormat: 'auto' | 'lowerFirst' | 'upperFirst' = 'auto';
  /**
   * 注释是否禁用
   */
  private commentsDisabled: boolean;
  /**
   * 注释是否插入示例
   */
  private commentsInsertExample: boolean;

  /**
   * 接口名称前缀
   */
  private interfaceNamePrefix: string;

  /**
   * 联合类型是否转换为枚举
   */
  private unionToEnum: boolean;

  /**
   * 当前生成接口名称
   */
  private api: string;

  constructor(options: { api: string }) {
    this.api = options.api;

    const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
    this.useExport = config.get<boolean>('useExport') ?? true;
    this.propertyFormat = config.get<'auto' | 'lowerFirst' | 'upperFirst'>('propertyFormat') ?? 'auto';
    this.commentsDisabled = config.get<boolean>('comments.disabled') ?? false;
    this.commentsInsertExample = config.get<boolean>('comments.insertExample') ?? false;
    this.interfaceNamePrefix = config.get<string>('interfaceNamePrefix') ?? '';
    this.unionToEnum = config.get<boolean>('unionToEnum') ?? true;
  }

  /**
   * 生成接口
   */
  async generate(info: ApiInfo) {
    const { parameters, responses } = info;

    const response = responses?.['200']?.schema;

    this.generateInterfaces(
      this.generateInterfaceName(`${this.api}Response`),
      response?.type === 'object' && response.properties
        ? Object.entries(response.properties).map(([name, schema]) => ({ name, schema: schema }))
        : baseTypeMap[response.type!],
    );

    this.generateInterfaces(this.generateInterfaceName(`${this.api}Parameters`), parameters as InterfaceSchema[]);
    return `${this.enums.join('\n')}${this.interfaces.join('\n')}`;
  }

  private generateInterfaceName(name: string) {
    let interfaceName = upperFirst(name);
    let i = 0;
    while (this.typeNames.has(interfaceName)) {
      i += 1;
      interfaceName += i;
    }
    interfaceName = `${this.interfaceNamePrefix}${interfaceName}`;
    this.typeNames.add(interfaceName);
    return interfaceName;
  }

  private getExport() {
    return `${this.useExport ? 'export ' : ''}`;
  }

  private generateInterfaces(interfaceName: string, schemaList: InterfaceSchema[] | string) {
    if (typeof schemaList === 'string') {
      return `${this.getExport()}type ${interfaceName} = ${schemaList || 'any'}`;
    }
    let text = `${this.getExport()}interface ${interfaceName} {`;
    const typesName = new Set<string>(); // 去除重复的属性名
    schemaList.forEach(({ name, schema }) => {
      if (typesName.has(name)) return;
      typesName.add(name);
      text += this.property2Type(name, schema);
    });
    text += `${text.startsWith('\n') ? '' : '\n'}}\n`;
    // 插入最前方
    this.interfaces.unshift(text);
  }

  /**
   * 生成枚举类型
   */
  private generateEnum(name: string, enumValueTitles: Schema['enumValueTitles'], description: Schema['description']) {
    if (!this.unionToEnum) {
      return `${Object.keys(enumValueTitles!)
        .map((val) => JSON.stringify(val))
        .join(' | ')}`;
    }
    if (this.typeNames.has(name)) {
      return `\`\${${name}}\``;
    }
    this.typeNames.add(name);
    let text = '';
    if (!this.commentsDisabled && description?.trim()) {
      text += `/**`;
      description.split('\n').forEach((t) => {
        text += `\n * ${t}`;
      });
      text += `\n */\n`;
    }
    text = `${this.getExport()}enum ${name} {`;
    Object.entries(enumValueTitles!).forEach(([value, desc]) => {
      if (!this.commentsDisabled && desc?.trim()) {
        text += `\n  /**`;
        text += `\n   * ${desc}`;
        text += `\n   */`;
      }
      text += `\n  ${snakeCase(value).toLocaleUpperCase()} = '${value}',`;
    });
    text += `\n}\n`;
    this.enums.unshift(text);
    return `\`\${${name}}\``;
  }

  private property2Type(name: string, schema: Schema) {
    let text = '';
    let commentContent = '';
    if (!this.commentsDisabled) {
      if (schema.description) {
        const descList = schema.description
          .replace(/\(~~([\d]+)~~\)/g, `(https://help.aliyun.com/document_detail/$1.html)`)
          .split('\n');
        descList.forEach((item) => {
          commentContent += `   * ${item.trim()}\n`;
        });
      }
      if (schema.deprecated) {
        commentContent += `   *\n`;
        commentContent += `   * @deprecated\n`;
      }
      if (this.commentsInsertExample && schema.example) {
        commentContent += `   *\n`;
        commentContent += `   * @example\n`;
        const exampleList = schema.example.split('\n');
        exampleList.forEach((item) => {
          commentContent += `   * ${item}\n`;
        });
      }
      if (commentContent) {
        text += `\n  /**\n`;
        text += commentContent;
        text += `   */`;
      }
    }
    let propertyType = 'any';
    switch (schema.type) {
      case 'string': {
        if (schema.enumValueTitles) {
          propertyType = this.generateEnum(`${upperFirst(name)}Enum`, schema.enumValueTitles, schema.description);
        } else {
          propertyType = 'string';
        }
        break;
      }
      case 'integer':
        propertyType = 'number';
        break;
      case 'boolean': {
        propertyType = 'boolean';
        break;
      }
      case 'array': {
        const getArrayPropertyType = (items: Schema) => {
          let type = '';
          if (items.type === 'array' && items.items) {
            type = `${getArrayPropertyType(items.items)}[]`; // 递归，多重数组的情况
          } else if (items.type === 'object' && items.properties) {
            const interfaceName = this.generateInterfaceName(`${this.api}${upperFirst(name)}`);
            type = `${interfaceName}[]`;
            this.generateInterfaces(
              interfaceName,
              Object.entries(items.properties).map(([name, schema]) => ({ name, schema })),
            );
          } else if (items.type === 'string' && items.enumValueTitles) {
            propertyType = this.generateEnum(`${upperFirst(name)}Enum`, items.enumValueTitles, schema.description);
          } else {
            type = `${baseTypeMap[items.type!] || 'any'}[]`;
          }
          return type;
        };
        propertyType = getArrayPropertyType(schema.items || {});
        break;
      }
      case 'object': {
        if (schema.properties) {
          propertyType = this.generateInterfaceName(`${this.api}${upperFirst(name)}`);
          this.generateInterfaces(
            propertyType,
            Object.entries(schema.properties).map(([name, schema]) => ({ name, schema })),
          );
        } else {
          propertyType = 'any';
        }
        break;
      }
    }
    // 格式化name
    let formatName = name;
    if (this.propertyFormat === 'lowerFirst') {
      formatName = lowerFirst(name);
    } else if (this.propertyFormat === 'upperFirst') {
      formatName = upperFirst(name);
    }
    text += `\n  ${formatName}${schema.required === false ? '?' : ''}: ${propertyType};`;
    return text;
  }
}
