# 安装

支持 npm 与 uni-app 插件市场（uni_modules）两种方式，二选一即可。

## 方式一：npm

```bash
# pnpm
pnpm add uni-tree-view

# npm
npm i uni-tree-view

# yarn
yarn add uni-tree-view
```

### 手动导入

```vue
<script setup>
import UniTreeView from "uni-tree-view";
</script>

<template>
  <uni-tree-view :data="treeData" />
</template>
```

### 自动导入（推荐）

使用 [`@uni-helper/vite-plugin-uni-components`](https://github.com/uni-helper/vite-plugin-uni-components) 时，可以配置本包内置的 resolver 实现免导入：

```ts
// vite.config.ts
import Components from "@uni-helper/vite-plugin-uni-components";
import { UniTreeViewResolver } from "uni-tree-view/resolver";

export default defineConfig({
  plugins: [
    Components({
      resolvers: [UniTreeViewResolver()]
    }),
    uni()
  ]
});
```

### 全局类型提示

在 `tsconfig.json` 中加入：

```json
{
  "compilerOptions": {
    "types": ["uni-tree-view/global"]
  }
}
```

## 方式二：uni-app 插件市场

在 [DCloud 插件市场](https://ext.dcloud.net.cn/) 导入插件 `KieranYin9527-tree`（显示名称：`keryin-tree-view`）后，组件会安装到项目的 `uni_modules/KieranYin9527-tree`。

uni_modules 遵循 easycom 规范，**无需任何配置**，直接在模板中使用：

```vue
<template>
  <uni-tree-view :data="treeData" />
</template>
```

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| Vue | >= 3.3 |
| uni-app 编译器 | Vue 3 版本（HBuilderX 3.8+ 或 CLI） |
| sass | 项目需支持 scss（uni-app 模板默认支持） |
