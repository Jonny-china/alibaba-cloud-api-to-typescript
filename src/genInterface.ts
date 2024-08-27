import * as vscode from 'vscode';
import debounce from 'lodash/debounce';
import { ApiInfo, GetApiDocs, GetApiInfo, GetApiInfoList, GetApiInfoRequest } from './services';
import { Schema2Interface } from './Schema2Interface';
import { EXTENSION_NAME } from './utils/extensionName';

interface QuickPickItem extends vscode.QuickPickItem {
  data: GetApiInfoRequest | ApiInfo;
}

function isApiInfo(data: GetApiInfoRequest | ApiInfo): data is ApiInfo {
  return !(data as GetApiInfoRequest).api;
}

const quickPickItemsCache = new Map<string, vscode.QuickPickItem[]>();

export async function genInterface() {
  const quickPick = vscode.window.createQuickPick();

  quickPick.placeholder = 'Please enter API name';

  const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
  const product = config.get<string>('scope.produce');
  const version = config.get<string>('scope.version');

  const hasProductVersion = product && version;

  const getQuickPickItems = async (apiName?: string) => {
    try {
      if (product && !version) {
        vscode.window.showErrorMessage(
          `[${EXTENSION_NAME}.scope.version] is not configured correctly, please configure it in the settings.`,
        );
      } else if (!product && version) {
        vscode.window.showErrorMessage(
          `[${EXTENSION_NAME}.scope.product] is not configured correctly, please configure it in the settings.`,
        );
      } else if (hasProductVersion) {
        // 缓存中有数据，则使用缓存中的数据
        if (quickPickItemsCache.has(`${product}@${version}`)) return quickPickItemsCache.get(`${product}@${version}`)!;
        // 调用接口获取数据
        return await GetApiDocs({ product, version }).then((data) => {
          // 缓存数据
          quickPickItemsCache.set(`${product}@${version}`, data);
          return data;
        });
      }
      return await GetApiInfoList(apiName!);
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  if (!hasProductVersion) {
    // 没有固定的product和version，则根据输入的value搜素，动态获取api列表
    const onDidChangeValueListener = debounce((apiName: string) => {
      if (!apiName) {
        quickPick.items = [];
        return;
      }
      getQuickPickItems(apiName).then((items) => {
        quickPick.items = items;
      });
    }, 300);

    quickPick.onDidChangeValue(onDidChangeValueListener);
  } else {
    // 固定product和version，直接显示所有的可用Api列表
    getQuickPickItems().then((items) => {
      quickPick.items = items;
    });
  }

  const onDidAcceptListener = () => {
    const selectedItems = quickPick.selectedItems as QuickPickItem[];
    console.log('onDidAcceptListener', selectedItems);
    if (selectedItems.length >= 1) {
      const { data, label } = selectedItems[0];
      let promise: Promise<ApiInfo>;
      let api = '';
      if (!isApiInfo(data)) {
        promise = GetApiInfo(data);
        api = data.api;
      } else {
        api = label;
        promise = Promise.resolve(data);
      }
      promise.then(async (info) => {
        new Schema2Interface({ api }).generate(info).then(async (value) => {
          const document = await vscode.workspace.openTextDocument({ content: '', language: 'typescript' });
          const editor = await vscode.window.showTextDocument(document);
          // 插入代码
          editor.edit((editBuilder) => {
            editBuilder.insert(new vscode.Position(0, 0), value);
          });
        });
      });
    }

    quickPick.hide();
  };

  quickPick.onDidAccept(onDidAcceptListener);

  quickPick.show();
}
