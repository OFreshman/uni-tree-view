# 搜索过滤

组件不内置搜索框，把任意输入组件的值绑定到 `filter-value` 即可。命中节点及其祖先链保持可见。

## 配合 wd-search

```vue
<template>
  <wd-search v-model="keyword" placeholder="搜索节点" hide-cancel />
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

`highlight-filter` 会在内置 label 中高亮命中的关键词（使用自定义 `label` 插槽时不生效）。

## 自定义匹配规则

默认按 label 包含匹配。需要拼音搜索、多字段匹配等场景时传 `filter-method`：

```vue
<template>
  <uni-tree-view
    :data="treeData"
    :filter-value="keyword"
    :filter-method="matchFn"
  />
</template>

<script setup>
function matchFn(value, node) {
  const kw = value.toLowerCase();
  // 同时匹配 label 和原始数据中的 code 字段
  return (
    node.label.toLowerCase().includes(kw)
    || String(node.source.code ?? "").toLowerCase().includes(kw)
  );
}
</script>
```

## 监听过滤结果

```vue
<uni-tree-view
  :data="treeData"
  :filter-value="keyword"
  @filter-change="onFilter"
/>
```

```ts
function onFilter({ value, keys }) {
  console.log(`“${value}” 命中 ${keys.length} 个节点`);
}
```

## 无结果空状态

```vue
<uni-tree-view :data="treeData" :filter-value="keyword">
  <template #empty="{ filterValue }">
    <wd-empty :description="`没有匹配 “${filterValue}” 的节点`" />
  </template>
</uni-tree-view>
```
