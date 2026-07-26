---
demo: basic
demoTitle: 基础用法
---

# 基础用法

## 纯展示树

不传 `show-checkbox` 时为纯展示树，点击箭头展开收起：

```vue
<template>
  <uni-tree-view :data="treeData" />
</template>

<script setup>
const treeData = [
  {
    id: "building-a",
    label: "A 栋",
    children: [
      {
        id: "floor-a-1",
        label: "1 层",
        children: [
          { id: "room-a-101", label: "101 会议室" },
          { id: "room-a-102", label: "102 办公区" }
        ]
      },
      { id: "floor-a-2", label: "2 层" }
    ]
  },
  { id: "building-b", label: "B 栋" }
];
</script>
```

## 默认展开

```vue
<!-- 展开全部 -->
<uni-tree-view :data="treeData" default-expand-all />

<!-- 展开指定节点 -->
<uni-tree-view :data="treeData" :default-expanded-keys="['building-a']" />
```

## 禁用节点

数据中的 `disabled: true` 节点不可选中，样式置灰：

```js
{ id: "room-a-202", label: "202 设备间", disabled: true }
```

## 整行交互

默认只有箭头/选择控件可点。移动端希望整行可点时：

```vue
<uni-tree-view
  :data="treeData"
  show-checkbox
  multiple
  check-on-click-node
  expand-on-click-node
/>
```

## 节点路径

```vue
<uni-tree-view :data="treeData" show-path path-separator=" > " />
```
