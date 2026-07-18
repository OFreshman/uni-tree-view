# 快速上手

## 最小示例

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
      { id: "floor-a-1", label: "1 层" },
      { id: "floor-a-2", label: "2 层" }
    ]
  }
];
</script>
```

不传 `show-checkbox` 时是纯展示树，点击箭头展开收起。

## 多选 + v-model

```vue
<template>
  <uni-tree-view
    v-model="checkedValue"
    show-checkbox
    multiple
    :data="treeData"
    @change="handleChange"
  />
</template>

<script setup>
import { ref } from "vue";

const checkedValue = ref(["floor-a-1"]);

function handleChange({ keys, nodes }) {
  console.log("当前选中:", keys);
}
</script>
```

`showCheckbox` 控制是否启用选择，`multiple` 控制单选/多选：

| 用法 | 行为 |
| --- | --- |
| 不传 `show-checkbox` | 纯展示树，无选择入口 |
| `show-checkbox` | 单选，radio 控件 |
| `show-checkbox multiple` | 多选，checkbox 控件，父子联动 |

## 自定义字段名

后端数据字段不叫 `id` / `label` / `children`？用 `tree-props` 映射：

```vue
<template>
  <uni-tree-view
    :data="treeData"
    :tree-props="{
      id: 'code',
      label: 'name',
      children: 'items',
      disabled: 'readonly'
    }"
  />
</template>
```

## 搜索过滤

组件不内置搜索框，把任意输入框的值绑到 `filter-value` 即可：

```vue
<template>
  <wd-search v-model="keyword" placeholder="搜索节点" />
  <uni-tree-view
    :data="treeData"
    :filter-value="keyword"
    highlight-filter
  />
</template>

<script setup>
import { ref } from "vue";

const keyword = ref("");
</script>
```

命中节点及其祖先链保持可见，`highlight-filter` 开启关键词高亮。

## 下一步

- 完整属性列表 → [Props](/apis/props)
- 懒加载、虚拟渲染 → [示例](/examples/lazy-load)
- 常见问题 → [FAQ](/guide/faq)
