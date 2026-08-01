# 常见问题

## 树不显示 / 数据不渲染?

按顺序检查：

1. `data` 是否为**数组**（不是对象）
2. 数据字段名与默认字段（`id` / `label` / `children`）不一致时，是否配置了 `tree-props`
3. 组件外层容器是否有高度——组件默认 `height: 100%`，父容器高度为 0 时不可见

每个节点的 `id`（或 `tree-props.id` 映射字段）必须在整棵树中全局唯一，否则展开、选择和渲染 key 会互相覆盖。

## 修改 data 后为什么没有刷新?

为避免万级节点场景对 `data` 做深度监听，组件采用不可变数据更新：`push`、`splice` 或直接修改节点字段后，请同时替换根数组引用。

```ts
treeData.value[0].children.push(newNode);
treeData.value = [...treeData.value];
```

替换根数组时，非受控选中状态会按仍然存在的节点 key 保留；受控场景始终以 `v-model` 为准。

`tree-props` 的映射配置发生响应式变化时，组件会重新解析整棵树；但它只负责声明字段名，不会改变上述 `data` 不做深度监听的约定。

## 选中了但 v-model 没更新?

`v-model` 只在启用选择时生效，确认传了 `selectable`。单选模式 `v-model` 是单个 key，多选模式（`multiple`）是 key 数组。

## 父组件拒绝了选中值，如何回滚?

组件的选中操作是“先更新内部状态，再发出事件”，不是严格受控模式。父组件即使不接受新的 `v-model` 值，组件内部状态也不会自动回滚。需要校验失败时，请通过 ref 调用 `setCheckedKeys` 恢复；注意该方法同样会触发 `update:modelValue` 和 `check-change`，回滚逻辑必须加防重入标记。下面示例使用 `check-strictly`，回滚单个节点：

```vue
<uni-tree-view
  ref="treeRef"
  v-model="value"
  selectable
  multiple
  check-strictly
  :data="data"
  @check-change="handleCheckChange"
/>
```

```ts
import { ref } from "vue";
import type { TreeCheckChangePayload, TreeKey, UniTreeViewExposed } from "uni-tree-view/shared";

const treeRef = ref<UniTreeViewExposed>();
const value = ref<TreeKey[]>([]);
const maxChecked = 3;
let rollingBack = false;

function handleCheckChange(payload: TreeCheckChangePayload) {
  if (rollingBack || payload.keys.length <= maxChecked) {
    return;
  }

  rollingBack = true;
  try {
    treeRef.value?.setCheckedKeys(payload.node.id, false);
  } finally {
    rollingBack = false;
  }
}
```

如果需要恢复一组复杂的父子选中状态，请在同一个防重入区间内完成清空与重新设置，避免回滚事件再次进入校验逻辑。

## 父子联动不符合预期?

默认父子联动（勾选父节点会勾选所有子节点）。如果希望父子状态互相独立，开启：

```vue
<uni-tree-view selectable multiple check-strictly :data="data" />
```

## 禁用节点为什么出现在 keys 里，为什么全选/清空不改变它?

`checked-disabled` 和 `pack-disabled-key` 控制的是两件事：

- `checked-disabled` 决定禁用节点是否允许改变选中状态。默认是 `false`，因此用户点击、全选、清空、父子联动、实例方法和受控值回放都会保持禁用节点的当前状态；需要改变时显式设为 `true`。
- `pack-disabled-key` 只决定**已经选中的**禁用节点是否包含在返回 keys / nodes 与 `v-model` 中，默认是 `true`；不需要返回时设为 `false`。

因此，一个禁用节点可能保留此前的选中状态并继续出现在结果中，但默认不会被后续全选或清空改变。

## 虚拟渲染开启后滚动错位?

虚拟模式要求**行高固定**。内置节点会使用 `virtual-item-height`（单位 px）作为实际行高；若插槽内容更高，请同步调大该值，且不要使用可变行高内容。

## 小程序上样式没生效?

组件启用了 `virtualHost`，普通 `class` 可作用于组件根节点。需要定制每个节点行时，请通过 `node-class` 传入自己的稳定类名；主题、缩进和内容分别使用 `theme-color`、`indent` 与插槽。不要直接依赖组件内部类名，并注意小程序的组件样式隔离规则。

## 懒加载子节点失败了怎么办?

监听 `load-error` 事件提示用户，并通过 ref 调用 `retryLoad(key)` 重试：

```vue
<uni-tree-view ref="treeRef" load-mode :load-api="loadApi" @load-error="onError" />
```

```ts
function onError({ node, error }) {
  uni.showToast({ title: "加载失败", icon: "none" });
  // 稍后重试: treeRef.value.retryLoad(node.id)
}
```

## 如何做成弹窗选择器?

组合你项目中的弹窗组件即可，例如 wot-ui：

```vue
<wd-popup v-model="show" position="bottom">
  <view style="height: 60vh;">
    <uni-tree-view v-model="value" selectable multiple :data="data" />
  </view>
</wd-popup>
```

## 还有问题?

提 [Issue](https://github.com/OFreshman/uni-tree-view/issues) 时请附上**最小重现**（平台、uni-app 版本、数据样例、期望/实际行为）。
