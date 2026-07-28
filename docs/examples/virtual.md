---
demo: virtual
demoTitle: 虚拟渲染
---

# 虚拟渲染

实时预览和 `pnpm play` 的“大数据虚拟渲染”共用同一个数据生成器：默认稳定生成 **12,000 个节点**，叶子随机分布在 **2～6 层**。开启 `virtual` 后，组件只渲染可视区域及缓冲区内的行。

数据使用固定种子的伪随机算法，而不是每次刷新都变化的真随机算法，因此两处示例的数据结构、节点 key 和定位目标始终一致，便于复现和比较性能。

## 实时预览对应代码

下面直接引入右侧实时预览使用的 Vue 组件源码，文档代码与实际运行内容保持同源：

<<< ../../playground/src/components/docs-demos/VirtualDemo.vue

## 共享的万级数据生成器

实时预览和 playground 首页都调用下面同一个 `createLargeTreeData()`：

<<< ../../playground/src/utils/largeTreeData.ts

默认参数：

| 参数 | 默认值 | 说明 |
| --- | ---: | --- |
| `total` | `12000` | 生成的总节点数，默认不少于一万 |
| `seed` | `20260728` | 固定随机种子，相同种子生成相同结构 |
| 层级 | `2～6` | 根节点为第 1 层，叶子随机分布在第 2～6 层 |

如需构造不同但仍可复现的数据，可以传入另一个种子：

```ts
const { data, count } = createLargeTreeData({
  total: 15_000,
  seed: 9527
});
```

## 关键参数

| 参数 | 说明 |
| --- | --- |
| `virtual-height` | 滚动容器高度（px），**必须指定** |
| `virtual-item-height` | 每行高度（px）；组件会据此固定虚拟行高度 |
| `virtual-overscan` | 可视区外额外渲染的行数，滚动越快可适当调大 |

## 滚动到指定节点

生成器会返回一个稳定存在的 6 级节点 `targetKey`。实时预览和 playground 都使用同一个目标执行定位：

```ts
const largeTree = createLargeTreeData();

async function locateTarget() {
  const located = await treeRef.value?.scrollToKey(largeTree.targetKey, {
    expandParents: true
  });

  if (!located) {
    uni.showToast({ title: "节点不存在", icon: "none" });
  }
}
```

## 注意事项

::: warning 行高必须固定
虚拟模式按 `virtual-item-height` 计算并固定内置节点行高。若插槽内容高度超过该值，内容可能溢出；请同步调大 `virtual-item-height`，且不要使用可变行高内容。
:::

::: warning 虚拟渲染不等于免数据计算
`virtual` 主要减少实际渲染的节点行数；万级树的数据生成、扁平化、索引和选择状态计算仍然会发生。生产环境应按需生成或请求大数据，不要为了展示而无条件初始化。
:::

::: tip 何时开启
- 可见节点 < 500：无需开启，直接渲染更简单
- 可见节点 ≥ 1000：建议开启
- `default-expand-all` + 大数据：强烈建议开启
:::
