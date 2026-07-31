# uni-tree-view

<p align="center">
  <img src="https://raw.githubusercontent.com/OFreshman/uni-tree-view/main/assets/uni-tree-view-logo.svg" alt="uni-tree-view Logo" width="180" />
</p>

[![npm version](https://img.shields.io/npm/v/uni-tree-view.svg)](https://www.npmjs.com/package/uni-tree-view)
[![CI](https://github.com/OFreshman/uni-tree-view/actions/workflows/ci.yml/badge.svg)](https://github.com/OFreshman/uni-tree-view/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/uni-tree-view.svg)](./LICENSE)

适用于 uni-app + Vue 3 的跨端树形列表/选择组件，一套代码运行在微信小程序、支付宝小程序和 H5。

**📖 [完整文档](https://uni-tree-view.netlify.app/)** · [在线演示](https://uni-tree-view.netlify.app/ui/#/) · [快速上手](https://uni-tree-view.netlify.app/guide/quick-start) · [API 参考](https://uni-tree-view.netlify.app/apis/props) · [常见问题](https://uni-tree-view.netlify.app/guide/faq)

> **项目状态：** 当前处于 `0.x` 早期阶段。核心能力已有自动化测试，并完成 H5 交互验证及微信/支付宝小程序构建验证；但在 `1.0.0` 前公开 API 和边界行为仍可能调整，升级前请查阅 [CHANGELOG](https://github.com/OFreshman/uni-tree-view/blob/main/CHANGELOG.md)。

## 特性

- 🌲 展开收起、单选/多选、父子联动、严格模式、禁用节点
- 🔍 关键词过滤、自定义匹配、命中高亮
- ⚡ 固定行高虚拟渲染，万级节点流畅滚动
- 🔌 懒加载子节点，内置加载态与失败重试
- 🎨 主题色、`node-class` 与 label/icon/append/empty 插槽自由定制
- 📦 零运行时依赖，npm 与 uni_modules（插件市场）双通道分发

## 安装

```bash
pnpm add uni-tree-view
```

或在 [DCloud 插件市场](https://ext.dcloud.net.cn/) 导入插件 `KieranYin9527-tree`（显示名称：`keryin-tree-view`，easycom 免配置）。

## 使用

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

function handleCheckChange({ keys, nodes }) {
  console.log("当前选中:", keys);
}
</script>
```

`selectable` 控制是否启用选择，`multiple` 控制单选/多选：

| 用法 | 行为 |
| --- | --- |
| 不传 `selectable` | 纯展示树 |
| `selectable` | 单选（radio） |
| `selectable multiple` | 多选（checkbox，父子联动） |

普通 `class` 作用于组件根容器；需要使用自己的类名定制每个节点行时，传入 `node-class`：

```vue
<uni-tree-view
  class="department-tree"
  node-class="department-tree-node"
  :data="treeData"
/>
```

`tree-props` 只负责数据字段映射，不包含样式配置。

完整的 Props / Events / Slots / Methods 列表、懒加载与虚拟渲染示例请见 **[文档站](https://uni-tree-view.netlify.app/)**。

## 平台兼容性

| 平台 | 状态 |
| --- | --- |
| H5 | ✅ 构建 + 交互验证 |
| 微信小程序 | ✅ 构建验证 |
| 支付宝小程序 | ✅ 构建验证 |
| App / 其他小程序 | 理论可用，未充分验证 |

实现层面的兼容性说明（hover-class、内联 iconfont、scroll-view 虚拟滚动等）见 [平台兼容性文档](https://uni-tree-view.netlify.app/guide/platforms)。

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
