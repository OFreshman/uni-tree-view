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

## 选中了但 v-model 没更新?

`v-model` 只在启用选择时生效，确认传了 `show-checkbox`。单选模式 `v-model` 是单个 key，多选模式（`multiple`）是 key 数组。

## 父子联动不符合预期?

默认父子联动（勾选父节点会勾选所有子节点）。如果希望父子状态互相独立，开启：

```vue
<uni-tree-view show-checkbox multiple check-strictly :data="data" />
```

## 禁用节点为什么出现在返回的 keys 里?

默认 `pack-disabledkey` 为 `true`，被勾选的禁用节点会包含在返回值中。不需要时设为 `false`。

## 虚拟渲染开启后滚动错位?

虚拟模式要求**行高固定**。内置节点会使用 `virtual-item-height`（单位 px）作为实际行高；若插槽内容更高，请同步调大该值，且不要使用可变行高内容。

## 小程序上样式没生效?

组件启用了 `virtualHost`，外层样式直接作用于组件根节点。如果你在页面里覆盖组件内部样式，注意小程序的样式隔离——建议只通过 `theme-color`、`indent` 等 props 和插槽定制，不要穿透组件内部类名。

## 懒加载子节点失败了怎么办?

监听 `load-error` 事件提示用户，并通过 ref 调用 `retryLoad(key)` 重试：

```vue
<uni-tree-view ref="tree" load-mode :load-api="loadApi" @load-error="onError" />
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
    <uni-tree-view v-model="value" show-checkbox multiple :data="data" />
  </view>
</wd-popup>
```

## 还有问题?

提 [Issue](https://github.com/OFreshman/uni-tree-view/issues) 时请附上**最小重现**（平台、uni-app 版本、数据样例、期望/实际行为）。
