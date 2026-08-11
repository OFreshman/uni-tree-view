---
demo: virtual
demoTitle: 虚拟渲染
outline: false
pageClass: examples-page
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

节点按层级依次命名为「区域 / 城市 / 片区 / 街道 / 社区 / 网格」，名称中的编号是**从根节点数下来的逐层序号路径**。例如 `网格 1-1-1-1-1-1` 表示：第 1 个区域 → 其第 1 个城市 → … → 其第 1 个网格，是一个稳定存在的第 6 层节点；对应节点 key 为 `area-1-1-1-1-1-1`。

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
| `virtual-height` | 滚动视口高度，只接受数值，单位固定为 **px**；默认 400 |
| `virtual-item-height` | 每行高度，只接受数值，单位固定为 **px**；组件会据此固定虚拟行高度 |
| `virtual-overscan` | 可视区外额外渲染的行数，滚动越快可适当调大 |

`virtual-height` 当前不能传 `rpx`、`%`、`vh` 或 `calc()`。虚拟列表需要用明确的像素高度计算起止索引；小程序端也请传换算后的 px 数值。

节点较少、内容不足 `virtual-height` 时，组件会渲染全部节点，但仍保留固定高度视口，剩余区域留空。若页面需要随内容高度自适应，请关闭 `virtual`。

## 与懒加载组合

`virtual` 与 `load-mode` 可以同时开启，两者职责不同：懒加载控制“数据何时进入状态树”，虚拟渲染控制“当前可见节点中哪些行进入视图”。懒加载完成后，可见列表和虚拟窗口会自动重新计算。

```vue
<uni-tree-view
  virtual
  load-mode
  :virtual-height="320"
  :virtual-item-height="36"
  :data="rootData"
  :load-api="loadChildren"
/>
```

右侧实时预览包含两个案例：

1. **万级区域树**：12,000 个静态节点的虚拟渲染
2. **按需加载网点**（向下滚动可见）：虚拟渲染 + 懒加载组合

懒加载案例说明（`pnpm play` 首页同样包含）：

- 首屏提供 80 个异步根节点（标签为「异步区域 N」）
- 每次展开按需加载 16 个子节点
- **「异步区域 1」首次展开会故意失败**，再次点击箭头即可验证重试功能
- 其他节点正常加载

预览中两个树下方都有状态提示，会实时显示操作结果。共用数据和加载函数如下：

<<< ../../playground/src/utils/lazyVirtualTreeData.ts

需要注意：`scrollToKey` 只能定位已经加载进状态树的 key，未知后代不会因为定位操作而自动请求。懒加载的完整约定见[懒加载](/examples/lazy-load)。

## 滚动到指定节点

生成器会返回一个稳定存在的 6 级节点 `targetKey`（即实时预览状态栏中显示的「可定位目标」）。实时预览和 playground 都使用同一个目标执行定位：

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
