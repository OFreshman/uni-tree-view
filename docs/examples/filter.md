---
demo: filter
demoTitle: 搜索过滤
outline: false
pageClass: examples-page
---

# 搜索过滤

组件不内置搜索框，把任意输入组件的值绑定到 `filter-value` 即可。命中节点及其祖先链、全部后代保持可见。

本页代码与右侧实时预览共用[基础用法中的示例数据](/examples/basic#示例数据)，预览里的「前端」「设计」「顾宁」三个快捷词就是从这份数据里挑的。

## 实时预览对应代码

下面是右侧预览搜索区的完整可运行写法：

```vue
<template>
  <wd-search
    v-model="keyword"
    placeholder="搜索部门或成员"
    hide-cancel
    placeholder-left
  />

  <text v-if="keyword">
    直接命中 {{ resultCount }} 个，相关可见 {{ visibleCount }} 个
  </text>

  <uni-tree-view
    :data="treeData"
    :filter-value="keyword"
    default-expand-all
    highlight-filter
    show-path
    theme-color="#299764"
    @filter-change="onFilterChange"
  >
    <template #empty="{ filterValue }">
      <view class="demo-empty">没有找到“{{ filterValue }}”</view>
    </template>
  </uni-tree-view>
</template>

<script setup>
import { ref } from "vue";

// 关键词为空字符串时不过滤，展示全部节点
const keyword = ref("");
// 直接命中数与最终可见数由 filter-change 事件回填
const resultCount = ref(0);
const visibleCount = ref(0);

function onFilterChange({ matchedKeys, keys }) {
  resultCount.value = matchedKeys.length;
  visibleCount.value = keys.length;
}
</script>
```

几个属性各自负责一件事：

| 属性 | 作用 |
| --- | --- |
| `filter-value` | 关键词，空字符串表示不过滤 |
| `highlight-filter` | 在内置 label 中高亮命中片段 |
| `show-path` | 命中节点下方补一行完整层级路径，过滤时更容易判断节点位置 |
| `default-expand-all` | 让「未输入关键词」时也是全展开状态；过滤期间命中链会被强制显示，不受收起状态影响 |

::: warning
`highlight-filter` 只作用于组件内置的 label 渲染。一旦使用自定义 `label` 或 `default` 插槽，高亮就由你自己实现（`filter-value` 仍会照常过滤）。
:::

## 自定义匹配规则

默认按 label 包含匹配（不区分大小写）。需要拼音搜索、多字段匹配等场景时传 `filter-method`：

```vue
<template>
  <uni-tree-view
    :data="treeData"
    :filter-value="keyword"
    :filter-method="matchFn"
  />
</template>

<script setup>
import { ref } from "vue";

const keyword = ref("");

// value 是当前关键词，node 是组件内部节点对象
function matchFn(value, node) {
  const kw = value.toLowerCase();
  // node.source 是你传入的原始数据项，可以读任意业务字段
  return (
    node.label.toLowerCase().includes(kw)
    || String(node.source.description ?? "").toLowerCase().includes(kw)
  );
}
</script>
```

上面这份规则搜「视觉」也能命中「苏禾」，因为它的 `description` 是「视觉设计」。

## 监听过滤结果

```vue
<template>
  <uni-tree-view
    :data="treeData"
    :filter-value="keyword"
    @filter-change="onFilter"
  />
</template>

<script setup>
function onFilter({ value, keys, matchedKeys, matchedNodes }) {
  console.log(`“${value}” 直接命中 ${matchedKeys.length} 个节点`);
  console.log(`连同祖先和后代，共显示 ${keys.length} 个相关节点`);
  console.log("直接命中的原始数据", matchedNodes.map(node => node.source));
}
</script>
```

::: tip
- `keys/nodes`：过滤后的最终可见集合，包含直接命中节点、其祖先和全部后代。
- `matchedKeys/matchedNodes`：只包含直接通过默认规则或 `filter-method` 命中的节点。
- 关键词为空时，`matchedKeys/matchedNodes` 为空数组。
:::

## 无结果空状态

`empty` 插槽同时覆盖「无数据」和「过滤无结果」两种情况，靠作用域参数 `filterValue` 区分：

```vue
<uni-tree-view :data="treeData" :filter-value="keyword">
  <template #empty="{ filterValue }">
    <wd-empty :description="filterValue ? `没有匹配 “${filterValue}” 的节点` : '暂无数据'" />
  </template>
</uni-tree-view>
```
