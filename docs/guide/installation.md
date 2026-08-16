# 安装

支持 npm 与 DCloud 插件市场（`uni_modules`）两种方式，二选一即可。

::: tip 该选哪个
**推荐 npm**：更新时只改一行版本号，不会与项目里的组件源码产生冲突，配合 resolver 还能免导入。CLI 工程（Vite / vue-cli）优先走这条。

`uni_modules` 适合用 HBuilderX 可视化开发、项目里没有 npm 依赖管理的场景：即插即用、天然支持 easycom，代价是升级时会覆盖工程里对应的 `uni_modules` 插件目录。
:::

## 方式一：npm（推荐）

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

## 方式二：DCloud 插件市场（uni_modules）

从 [Uni Tree View 插件页](https://ext.dcloud.net.cn/plugin?id=28897) 点击“下载插件并导入 HBuilderX”，选择目标工程即可。插件按 `uni_modules` 规范发布，导入后统一落在以插件 ID 命名的目录下：

| 工程类型 | 导入目录 |
| --- | --- |
| HBuilderX 可视化工程 | `uni_modules/KieranYin9527-tree` |
| CLI 工程（Vite / vue-cli） | `src/uni_modules/KieranYin9527-tree` |

也可以在插件页下载 ZIP，把解压出的 `KieranYin9527-tree` 目录放进上表对应位置，效果等同。

导入 `uni_modules` 规范插件需要 HBuilderX 3.1.0 以上版本。`uni_modules` 并非 Vue 2 专属，Vue 3 工程同样适用。

组件目录符合 easycom 约定，无需任何配置即可直接使用：

```vue
<template>
  <uni-tree-view :data="treeData" />
</template>
```

### 类型提示

插件自带类型声明，不需要配置 `types`：插件目录里的 `global.d.ts` 声明了 `<uni-tree-view>` 的全局组件类型，只要插件目录落在 `tsconfig.json` 的 `include` 范围内（CLI 工程默认的 `src/**/*` 已覆盖）就生效。

需要显式导入类型时，指向工程内的插件目录，而不是 npm 包名：

```ts
// CLI 工程：插件在 src/uni_modules 下，`@` 指向 src
import type {
  TreeDataItem,
  TreeKey,
  UniTreeViewExposed
} from "@/uni_modules/KieranYin9527-tree";
```

HBuilderX 可视化工程没有 `@` 别名、插件也在工程根目录，改用相对路径，例如页面位于 `pages/demo/` 时写 `../../uni_modules/KieranYin9527-tree`。

::: warning 不要与 npm 方式混用
同一工程里不要同时保留 `uni_modules/KieranYin9527-tree` 和 npm 安装的 `uni-tree-view`，否则 easycom 与显式导入会解析到两份实现。换用另一种方式前，先把上一种彻底删掉。
:::

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| Vue | >= 3.3 |
| uni-app 编译器 | Vue 3 版本（HBuilderX 4.15+ 或 CLI） |
| sass | 项目需支持 scss（uni-app 模板默认支持） |
