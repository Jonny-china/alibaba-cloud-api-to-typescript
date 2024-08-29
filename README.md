# 阿里云OpenAPI转TypeScript（alibaba-cloud-api-to-typescript）

一个将阿里云OpenAPI的传参和响应参数转换为TypeScript的工具，用于快速生成TypeScript类型代码，减少重复工作，提升开发效率。

## 特性

- 快速将API的参数生成Typescript类型代码
- 字段支持注释说明
- 支持搜索整个阿里云OpenAPI数据
- 支持在特定产品版本下的选择OpenAPI

## 使用方法
将以下命令输入到命令面板中执行：
```
Alibaba Cloud API To Typescript
```
然后输入你想要转换Typescript类型的API名称，选中对应产品和版本的API，即可生成对应的接口类型代码。

![使用说明](images/guide.gif)

## 拓展配置

* `alibaba-cloud-api-to-typescript.scope.produce`: 获取对应产品下的 OpenAPI 数据，同时需要添加下方版本(Version)字段
* `alibaba-cloud-api-to-typescript.scope.version`: 获取对应产品版本下的 OpenAPI 数据，同时需要添加上方产品Code(Product)字段
* `alibaba-cloud-api-to-typescript.useExport`: 是否使用 export interface，导出接口
* `alibaba-cloud-api-to-typescript.comments.disabled`: 禁止生成字段注释
* `alibaba-cloud-api-to-typescript.comments.insertExample`: 字段注释中，是否插入JS Docs的 @example 示例
* `alibaba-cloud-api-to-typescript.propertyFormat`: 字段名称格式化，首字母小写还是大写
* `alibaba-cloud-api-to-typescript.interfaceNamePrefix`: interface 名称前缀（部分项目需要在接口名称前加`I`）
* `alibaba-cloud-api-to-typescript.unionToEnum`: 是否将联合类型生成枚举，如`CallType: 'INBOUND' | 'OUTBOUND' | ...`转为枚举类型 `enum CallTypeEnum { INBOUND='INBOUND',OUTBOUND='OUTBOUND', ... }`

## 发布日志

### 1.0.0
初始版本。

### 1.0.1
fix: 修复生成枚举类型时，给属性赋值枚举值的格式错误

### 1.0.2
fix: 修复当字段描述为空时生成空的注释符