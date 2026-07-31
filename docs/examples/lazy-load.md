---
demo: lazy-load
demoTitle: 懒加载
---

# 懒加载

节点子级按需加载，适合层级深、数据量大的异步数据源（如组织架构、地区选择）。

## 基本用法

```vue
<template>
  <uni-tree-view
    load-mode
    :data="rootData"
    :load-api="loadChildren"
    @load="onLoad"
    @load-error="onLoadError"
  />
</template>

<script setup>
const rootData = [
  { id: "dept-1", label: "总公司" }
];

async function loadChildren(node) {
  const res = await uni.request({
    url: "/api/departments",
    data: { parentId: node.id }
  });
  // 返回子节点数组即可，组件负责挂载
  return res.data.list;
}

function onLoad({ node, children }) {
  console.log(`${node.label} 加载了 ${children.length} 个子节点`);
}

function onLoadError({ node, error }) {
  uni.showToast({ title: `${node.label} 加载失败`, icon: "none" });
}
</script>
```

`load-mode` 下所有节点默认视为可展开，展开时调用 `load-api`;返回空数组的节点自动变为叶子。

## 判断叶子节点

数据里有 `leaf` 字段时自动识别;字段名不同或需要按逻辑判断时：

```vue
<uni-tree-view
  load-mode
  :data="rootData"
  :load-api="loadChildren"
  :is-leaf-fn="(item) => item.type === 'employee'"
/>
```

## 失败重试

加载失败的节点会停在失败态，通过 ref 重试：

```vue
<template>
  <uni-tree-view ref="treeRef" load-mode :data="rootData" :load-api="loadChildren" @load-error="onError" />
</template>

<script setup>
import { ref } from "vue";

const treeRef = ref();

function onError({ node }) {
  uni.showModal({
    title: "加载失败",
    content: `重新加载 ${node.label}?`,
    success: ({ confirm }) => {
      if (confirm) {
        treeRef.value.retryLoad(node.id);
      }
    }
  });
}
</script>
```

## 带静态 children 也强制走一次加载

节点在数据里自带静态 `children` 时，默认会被视为已加载，展开不会调用 `load-api`。开启 `always-first-load` 后，这类节点首次展开时也会强制调用一次 `load-api`（加载成功后同样不再重复请求）：

```vue
<uni-tree-view load-mode always-first-load :data="rootData" :load-api="loadChildren" />
```
