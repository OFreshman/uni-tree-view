# `uni‐tree-view`

一个基于 Vue / uni-app 的跨平台树形列表/选择组件，兼容小程序 (dCloud 插件市场) 和 H5，可通过 npm 安装。适合需要树状结构选择 / 展示 / 复选 / 展开折叠功能的场景。

## 🚀 特性（当前版本支持）

* 树形结构展示，支持任意嵌套层级
* 展开 / 折叠子节点
* 可选复选框 (checkbox) 选择节点 / 多选
* 父子节点的默认选中 / 取消选中 + 联动 (选中父节点自动选中子节点；取消选中自动取消子节点，并自动更新父节点状态为选中 / 半选 / 取消)
* 支持叶子与非叶子节点区分 (isLeaf 标识)
* 支持动态传入数据 (props 数据变更时自动初始化)
* 支持自定义 id / label / children 字段名 (通过 `treeProps`)
* 支持默认选中 (通过 `defaultCheckedKeys`)

## 📦 安装

如果通过 npm：

```bash
npm install uni-tree-view
```

如果通过 dCloud 插件市场，可直接引入插件（视插件市场流程而定）。

## 🧩 使用示例

```vue
<template>
  <uni-tree-view 
    :data="treeData" 
    :treeProps="{ id: 'id', label: 'name', children: 'children' }"
    :showCheckbox="true"
    :multiple="true"
    :defaultCheckedKeys="[101, 102]"
  />
</template>

<script>
export default {
  data() {
    return {
      treeData: [
        {
          id: 1,
          name: '节点 A',
          children: [
            { id: 101, name: '子节点 A-1' },
            { id: 102, name: '子节点 A-2' }
          ]
        },
        {
          id: 2,
          name: '节点 B',
          children: [
            { id: 201, name: '子节点 B-1' }
          ]
        }
      ]
    };
  }
};
</script>
```

## 🔧 Props

| 属性                   | 类型                      | 默认值                                                  | 描述                               |
| -------------------- | ----------------------- | ---------------------------------------------------- | -------------------------------- |
| `data`               | `Array<TreeNode>`       | `[]`                                                 | 树形数据源 (数组)                       |
| `treeProps`          | `Object`                | `{ id: 'id', label: 'label', children: 'children' }` | 指定数据中 id / label / children 字段名称 |
| `showCheckbox`       | `boolean`               | `true`                                               | 是否显示复选框                          | | 是否严格父子不联动 (未来可扩展)                |
| `defaultCheckedKeys` | `Array<string\|number>` | `[]`                                                 | 初始化时默认选中的节点 id 列表                |

> 注意：部分功能 (例如严格非联动 / 单选 / 复杂选择逻辑) 在当前版本中为基础实现 / TODO 中，未来版本将进一步完善。

## ✅ 当前行为规范 / 逻辑说明

* 父节点选中 -> 所有子节点自动选中；父节点取消选中 -> 所有子节点取消。
* 子节点(部分/全部)选中 / 取消 -> 父节点自动变为 “选中 / 半选 / 取消” 状态 (indeterminate 状态支持)。
* 点击节点 (非复选框区域) 若为非叶子节点则展开 / 折叠子节点。
* 渲染过程中会扁平化树结构 (flatten)，内部分层 & Map 结构加速查找与操作。

## 📄 计划 / 未实现 (TODO)

以下为当前版本暂不支持 / 未来计划支持的功能 (欢迎 issues / PR 提议)：

* 多选（multiple） / 父子关联模式 (checkStrictly)
* 异步 / 延迟加载子节点 (lazy load / load on demand)
* 搜索 / 过滤功能 (按关键词查找节点)
* 自定义节点渲染 (icon, label 附加信息, 插槽 / template 支持)
* 下拉树 / 选择器 (dropdown-select) 模式
* 单选 / 多选 / 严格 / 非严格多选模式 (checkStrictly, single select 等)
* 虚拟滚动 (virtual scroll) 支持 — 提高大数据量树的性能
* 键盘导航 / 无障碍 (accessibility / ARIA) 支持


