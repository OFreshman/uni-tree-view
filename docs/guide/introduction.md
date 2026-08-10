# 介绍

`uni-tree-view` 是一个基于 **uni-app + Vue 3** 的跨端树形列表/选择组件。

一套代码同时运行在：

- 微信小程序
- 支付宝小程序
- H5

::: tip 文档站入口
文档站双线部署，内容一致：主入口 [Netlify](https://uni-tree-view.netlify.app/)；无法访问时可用备用镜像 [GitHub Pages](https://ofreshman.github.io/uni-tree-view/)。
:::

## 特性

- 🌲 展开收起、单选/多选、父子联动、`check-strictly` 严格模式
- 🔍 关键词过滤、自定义 `filterMethod`、命中高亮
- ⚡ `virtual` 虚拟渲染，万级节点流畅滚动
- 🔌 `loadApi` 懒加载，内置加载态 / 失败重试
- 🎨 `themeColor`、`nodeClass` 与插槽自由定制节点外观和内容
- 📦 零运行时依赖，npm 与 DCloud 插件市场双通道分发

## 它不做什么

为了保持小程序端的体积和性能，本组件**刻意不内置**以下能力，请组合你项目中已有的组件库（如 [wot-ui](https://wot-ui.cn)）实现：

| 能力 | 建议做法 |
| --- | --- |
| 搜索输入框 | 用 `wd-search` 等组件绑定 `filter-value` |
| 弹窗选择器 | 用 `wd-popup` / `wd-action-sheet` 包裹本组件 |
| 拖拽排序 | 超出移动端树组件的常见场景，暂无计划 |

## 兼容性

| 平台 | 支持情况 |
| --- | --- |
| 微信小程序 | ✅ |
| 支付宝小程序 | ✅ |
| H5 | ✅ |
| App(nvue 除外) | 理论可用，未充分验证 |

详见[平台兼容性](/guide/platforms)。
