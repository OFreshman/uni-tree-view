# Slots

| 插槽 | 作用域参数 | 说明 |
| --- | --- | --- |
| `default` | `{ node, data, path }` | 整个节点内容区（替换 icon + label + append） |
| `label` | `{ node, data, path }` | 仅节点文本 |
| `icon` | `{ node, data, path }` | 节点前置图标 |
| `append` | `{ node, data, path }` | 节点尾部附加内容 |
| `empty` | `{ filterValue }` | 空数据 / 过滤无结果时的内容 |

作用域参数说明：

- `node: TreeNode` — 组件内部节点对象（含 `level`、`checked`、`expanded` 等状态）
- `data: TreeDataItem` — 你传入的原始数据项
- `path: TreeNode[]` — 根到该节点的路径

## 示例

### 自定义 label 与尾部徽标

```vue
<uni-tree-view :data="treeData" show-checkbox multiple>
  <template #label="{ node }">
    <text :style="node.level === 0 ? 'font-weight:600' : ''">
      {{ node.label }}
    </text>
  </template>
  <template #append="{ data }">
    <wd-tag v-if="data.count" type="primary" variant="plain">
      {{ data.count }}
    </wd-tag>
  </template>
</uni-tree-view>
```

### 自定义空状态

```vue
<uni-tree-view :data="treeData" :filter-value="keyword">
  <template #empty="{ filterValue }">
    <wd-empty
      :description="filterValue ? `没有匹配 “${filterValue}” 的节点` : '暂无数据'"
    />
  </template>
</uni-tree-view>
```

::: warning 虚拟渲染注意
使用 `default` 插槽大幅改变节点结构时，若开启 `virtual`，请保证行高固定并与 `virtual-item-height` 一致。
:::
