# 虚拟渲染

可见节点达到千级以上时，开启 `virtual` 只渲染可视区域内的行，小程序端也能流畅滚动。

## 基本用法

```vue
<template>
  <uni-tree-view
    v-model="checked"
    show-checkbox
    multiple
    virtual
    :virtual-height="600"
    :virtual-item-height="36"
    :data="bigTreeData"
    default-expand-all
  />
</template>
```

三个关键参数：

| 参数 | 说明 |
| --- | --- |
| `virtual-height` | 滚动容器高度（px），**必须指定** |
| `virtual-item-height` | 每行高度（px）；组件会据此固定虚拟行高度 |
| `virtual-overscan` | 可视区外额外渲染的行数，滚动越快可适当调大 |

## 滚动到指定节点

```vue
<template>
  <wd-button @click="locate">定位到目标节点</wd-button>
  <uni-tree-view ref="treeRef" virtual :virtual-height="600" :data="bigTreeData" />
</template>

<script setup>
import { ref } from "vue";

const treeRef = ref();

async function locate() {
  // expandParents: 自动展开祖先链后再滚动
  const ok = await treeRef.value.scrollToKey("area-3-2-1", { expandParents: true });
  if (!ok) {
    uni.showToast({ title: "节点不存在", icon: "none" });
  }
}
</script>
```

## 注意事项

::: warning 行高必须固定
虚拟模式按 `virtual-item-height` 计算并固定内置节点行高。若插槽内容高度超过该值，内容可能溢出；请同步调大 `virtual-item-height`，且不要使用可变行高内容。
:::

::: tip 何时开启
- 可见节点 < 500：无需开启，直接渲染更简单
- 可见节点 ≥ 1000：建议开启
- `default-expand-all` + 大数据：强烈建议开启
:::
