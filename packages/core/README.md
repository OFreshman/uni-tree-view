# uni-tree-view

<p align="center">
  <img src="https://raw.githubusercontent.com/OFreshman/uni-tree-view/main/assets/uni-tree-view-logo.svg" alt="uni-tree-view Logo" width="180" />
</p>

[![npm version](https://img.shields.io/npm/v/uni-tree-view.svg)](https://www.npmjs.com/package/uni-tree-view)
[![CI](https://github.com/OFreshman/uni-tree-view/actions/workflows/ci.yml/badge.svg)](https://github.com/OFreshman/uni-tree-view/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/uni-tree-view.svg)](./LICENSE)

适用于 uni-app + Vue 3 的跨端树形列表/选择组件，一套代码运行在微信小程序、支付宝小程序和 H5。

**📖 [完整文档](https://uni-tree-view.netlify.app/)** · [在线演示](https://uni-tree-view.netlify.app/ui/#/) · [快速上手](https://uni-tree-view.netlify.app/guide/quick-start) · [API 参考](https://uni-tree-view.netlify.app/apis/props) · [常见问题](https://uni-tree-view.netlify.app/guide/faq)

> 文档站双线部署，内容一致：主入口为 Netlify（上方链接）；备用镜像 [GitHub Pages](https://ofreshman.github.io/uni-tree-view/)。

> 使用 AI Coding 工具时，可将 [llms.txt](https://uni-tree-view.netlify.app/llms.txt) 作为精简的文档导航入口。

> **项目状态：** 当前处于 `0.x` 早期阶段。核心能力已有自动化测试，并完成 H5 交互验证及微信/支付宝小程序构建验证；但在 `1.0.0` 前公开 API 和边界行为仍可能调整，升级前请查阅 [CHANGELOG](https://github.com/OFreshman/uni-tree-view/blob/main/CHANGELOG.md)。

## 特性

- 🌲 展开收起、单选/多选、父子联动、严格模式、禁用节点
- 🔍 关键词过滤、自定义匹配、命中高亮
- ⚡ 固定行高虚拟渲染，只渲染可视区域，适合大数据树
- 🔌 懒加载子节点，内置加载中、加载失败和重试状态
- 🎨 主题色、`node-class` 以及文本、图标、尾部内容和空状态插槽自由定制
- 📦 零运行时依赖，npm 与 DCloud 插件市场双通道分发

## 安装

```bash
pnpm add uni-tree-view
```

或在 [DCloud 插件市场](https://ext.dcloud.net.cn/plugin?id=28897) 导入 `Uni Tree View`。当前市场版本按普通组件形态安装到 `src/components/uni-tree-view`，可通过 easycom 使用；目录差异见[安装说明](https://ofreshman.github.io/uni-tree-view/guide/installation)。

## 使用

### npm 方式

通过 npm 安装后需要导入组件：

```vue
<template>
  <uni-tree-view
    v-model="checkedValue"
    selectable
    multiple
    :data="treeData"
    @check-change="handleCheckChange"
  />
</template>

<script setup>
import UniTreeView from "uni-tree-view";
import { ref } from "vue";

const checkedValue = ref([]);
const treeData = [
  {
    id: "building-a",
    label: "A 栋",
    children: [
      { id: "floor-a-1", label: "1 层" },
      { id: "floor-a-2", label: "2 层", disabled: true }
    ]
  }
];

function handleCheckChange({ keys }) {
  console.log("当前选中:", keys);
}
</script>
```

### DCloud 插件市场方式

从插件市场安装后，通过 easycom 自动导入，无需手动 import：

```vue
<template>
  <uni-tree-view
    v-model="checkedValue"
    selectable
    multiple
    :data="treeData"
    @check-change="handleCheckChange"
  />
</template>

<script setup>
import { ref } from "vue";

const checkedValue = ref([]);
const treeData = [
  {
    id: "building-a",
    label: "A 栋",
    children: [
      { id: "floor-a-1", label: "1 层" },
      { id: "floor-a-2", label: "2 层", disabled: true }
    ]
  }
];

function handleCheckChange({ keys }) {
  console.log("当前选中:", keys);
}
</script>
```

`selectable` 控制是否启用选择，`multiple` 控制单选/多选：

| 用法 | 行为 |
| --- | --- |
| 不传 `selectable` | 纯展示树 |
| `selectable` | 单选（单选按钮） |
| `selectable multiple` | 多选（复选框，父子联动） |

禁用节点默认锁定当前选中状态。全选、清空、父子联动、实例方法以及外部更新 `v-model` 时，都不会改变它；需要允许变更时传入 `checked-disabled`。

普通 `class` 作用于组件根容器；需要使用自己的类名定制每个节点行时，传入 `node-class`：

```vue
<uni-tree-view
  class="department-tree"
  node-class="department-tree-node"
  :data="treeData"
/>
```

`tree-props` 只负责数据字段映射，不包含样式配置。

完整的属性、事件、插槽和实例方法（Props / Events / Slots / Methods），以及懒加载与虚拟渲染示例，请见 **[文档站](https://uni-tree-view.netlify.app/)**。

## 平台兼容性

| 平台 | 状态 |
| --- | --- |
| H5 | ✅ 构建 + 交互验证 |
| 微信小程序 | ✅ 构建验证 |
| 支付宝小程序 | ✅ 构建验证 |
| App / 其他小程序 | 理论可用，未充分验证 |

点击反馈、内联图标和 `scroll-view` 虚拟滚动等实现说明，见 [平台兼容性文档](https://uni-tree-view.netlify.app/guide/platforms)。

## 开发

```bash
pnpm install
pnpm play        # H5 playground
pnpm test        # 单元测试
pnpm build       # 构建组件包
pnpm docs        # 本地文档站
```

贡献前请阅读 [CONTRIBUTING.md](https://github.com/OFreshman/uni-tree-view/blob/main/CONTRIBUTING.md)。

## License

[MIT](./LICENSE) © OFreshman
