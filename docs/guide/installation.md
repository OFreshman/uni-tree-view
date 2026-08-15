# 安装

支持 npm 与 DCloud 插件市场两种方式，二选一即可。

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
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
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

## 方式二：DCloud 插件市场

从 [Uni Tree View 插件页](https://ext.dcloud.net.cn/plugin?id=28897) 点击“下载插件并导入 HBuilderX”。

::: warning 插件市场条目当前为 0.3.2
当前插件市场条目仍按**普通组件**形态导入，实际目录为：

```text
src/components/uni-tree-view
```

这不是 Vue 2 / Vue 3 的区别，也不是“下载插件并导入 HBuilderX”按钮决定的；落到 `components` 还是 `uni_modules`，由插件市场条目的**发布类型**决定。
:::

当前目录符合 easycom 的组件目录约定，可直接在模板中使用：

```vue
<template>
  <uni-tree-view :data="treeData" />
</template>
```

标准 `uni_modules` 发布形态对应的目录应为：

```text
src/uni_modules/KieranYin9527-tree
```

Vue 3 项目同样可以使用 `uni_modules` 组件；`uni_modules` 并非 Vue 2 专属。后续若插件市场条目迁移为 `uni_modules` 发布，HBuilderX 的导入目录会随发布类型变化，组件标签仍保持 `<uni-tree-view>`。迁移前请勿在同一项目同时保留 `src/components/uni-tree-view` 与 `src/uni_modules/KieranYin9527-tree` 两份组件，以免 easycom 匹配到重复实现。

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| Vue | >= 3.3 |
| uni-app 编译器 | Vue 3 版本（HBuilderX 4.15+ 或 CLI） |
| sass | 项目需支持 scss（uni-app 模板默认支持） |
