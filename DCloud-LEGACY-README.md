# Uni Tree View（已迁移）

> ⚠️ 本插件条目已停止更新，请使用[新版插件条目](https://ext.dcloud.net.cn/plugin?id=29379)。

## 迁移说明

由于插件市场作者 ID 由 `KieranYin9527` 变更为 `keryin`，插件 ID 也由：

```text
KieranYin9527-tree
```

变更为：

```text
keryin-tree-view
```

因此，新版插件在 DCloud 插件市场中创建了新的条目，不能与本条目合并。插件市场自 `0.6.3` 起使用新版条目，本条目不再发布后续版本。

新版插件地址：

<https://ext.dcloud.net.cn/plugin?id=29379>

## 如何迁移

1. 删除项目中旧插件目录：

   ```text
   uni_modules/KieranYin9527-tree
   ```

   CLI 工程对应目录为：

   ```text
   src/uni_modules/KieranYin9527-tree
   ```

2. 从[新版插件条目](https://ext.dcloud.net.cn/plugin?id=29379)重新导入插件。
3. 确认新版目录为：

   ```text
   uni_modules/keryin-tree-view
   ```

   CLI 工程对应目录为：

   ```text
   src/uni_modules/keryin-tree-view
   ```

4. 如果项目中有显式的类型导入路径，请将 `KieranYin9527-tree` 改为 `keryin-tree-view`。

请不要同时保留新旧两个插件目录，否则两个插件都会注册 `<uni-tree-view>`，可能导致 easycom 使用到错误版本。

## 致歉

因插件市场 ID 变更给升级带来不便，敬请谅解。后续更新、问题修复和新功能将统一在新版插件条目中发布。
