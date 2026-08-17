# 安装

支持 npm 与 DCloud 插件市场（`uni_modules`）两种方式，二选一即可。

::: tip 该选哪个
**推荐 npm**：依赖版本和锁文件由包管理器统一维护，配合 resolver 还能免导入。CLI 工程（Vite / vue-cli）优先选择这种方式。

`uni_modules` 更适合使用 HBuilderX 可视化开发，或项目没有 npm 依赖管理的场景。插件源码直接放在工程内，并可由 easycom 自动发现；如果修改过插件源码，升级前需要核对并保留这些本地改动。
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

从 [Uni Tree View 插件页](https://ext.dcloud.net.cn/plugin?id=28897) 点击“下载插件并导入 HBuilderX”，选择目标工程即可。该插件按 `uni_modules` 规范发布，并以插件 ID 作为自己的目录名：

| 工程类型 | 导入目录 |
| --- | --- |
| HBuilderX 可视化工程 | `uni_modules/KieranYin9527-tree` |
| CLI 工程（Vite / vue-cli） | `src/uni_modules/KieranYin9527-tree` |

::: info 重新安装或更新会影响哪些目录
假设 `uni_modules` 下有 `a`、`b`、`c` 三个插件，重新安装或更新 `c` 时，操作目标是 `c` 对应的目录，`a` 和 `b` 不会因此被替换。这里所说的“覆盖”仅指 `c` 目录内与新版同路径的文件；HBuilderX 更新时会显示文件差异，应在确认前检查并备份需要保留的本地修改。
:::

也可以在插件页下载 ZIP，把解压出的 `KieranYin9527-tree` 目录放进上表对应位置。这样可以得到相同的运行时目录结构，但后续升级需要自行重新下载，并合并或替换这个插件目录。

HBuilderX 3.1.0 起支持导入 `uni_modules` 规范插件；这是 `uni_modules` 机制本身的最低版本，不是本组件的运行环境要求。本组件要求 HBuilderX 4.15 以上版本，详见下方[环境要求](#环境要求)。`uni_modules` 并非 Vue 2 专属，Vue 3 工程同样适用。

组件目录符合 easycom 约定。在项目保持 easycom 自动扫描开启、且没有冲突的自定义规则时，无需手动导入组件：

```vue
<template>
  <uni-tree-view :data="treeData" />
</template>
```

### 类型提示

插件自带类型声明，不需要把插件名加入 `compilerOptions.types`。在 TypeScript 工程中，插件目录里的 `global.d.ts` 声明了 `<uni-tree-view>` 的全局组件类型；只要该文件落在 `tsconfig.json` 的 `include` 范围内即可生效（常见 CLI 工程的 `src/**/*` 已覆盖 `src/uni_modules`）。

需要显式导入类型时，指向工程内的插件目录，而不是 npm 包名：

```ts
// CLI 工程：插件在 src/uni_modules 下，`@` 指向 src
import type {
  TreeDataItem,
  TreeKey,
  UniTreeViewExposed
} from "@/uni_modules/KieranYin9527-tree";
```

如果 HBuilderX 可视化工程没有配置 `@` 别名，应改用相对路径。以 `pages/demo/index.vue` 为例，可以写 `../../uni_modules/KieranYin9527-tree`；如果工程自行配置了别名，则以实际配置为准。

::: warning 不要同时使用两种安装方式
同一工程同时保留 npm 包和 `uni_modules` 插件时，不同页面或不同导入方式可能使用不同版本的组件，排查问题时容易混淆。切换安装方式时，只移除不再使用的那一份：

- 改用 `uni_modules`：通过当前包管理器卸载 `uni-tree-view`。
- 改用 npm：删除 `uni_modules/KieranYin9527-tree`；CLI 工程删除 `src/uni_modules/KieranYin9527-tree`。同级的其他插件目录不受影响。
:::

## 环境要求

| 依赖 | 版本 |
| --- | --- |
| Vue | >= 3.3 |
| uni-app 编译器 | Vue 3 版本；HBuilderX >= 4.15，CLI 工程使用对应的 Vue 3 版 `@dcloudio` 依赖 |
| sass | 项目需支持 scss（uni-app 模板默认支持） |
