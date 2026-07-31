# Props

## 数据

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `TreeDataItem[]` | `[]` | 树形数据 |
| `v-model` / `modelValue` | `TreeKey \| TreeKey[] \| null` | - | 选中值。单选为单个 key，多选为 key 数组 |
| `tree-props` | `Partial<TreeProps>` | - | 字段映射，见下方 [TreeProps](#treeprops) |
| `default-checked-keys` | `TreeKey \| TreeKey[]` | `[]` | 非受控场景的初始选中 keys |

### TreeProps

```ts
interface TreeProps {
  id: string;        // 默认 "id"
  label: string;     // 默认 "label"
  children: string;  // 默认 "children"
  disabled?: string; // 默认 "disabled"
  leaf?: string;     // 默认 "leaf"
  append?: string;   // 默认 "append"
  icon?: string;     // 默认 "icon"
}
```


## 选择

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `selectable` | `boolean` | `false` | 是否启用并展示选择控件 |
| `multiple` | `boolean` | `false` | 是否多选。`false` 时为单选（radio） |
| `show-radio-icon` | `boolean` | `true` | 单选模式是否展示 radio 图标 |
| `check-strictly` | `boolean` | `false` | 父子选中状态是否互相独立 |
| `only-radio-leaf` | `boolean` | `false` | 单选模式是否只允许选叶子节点 |
| `check-on-click-node` | `boolean` | `false` | 点击整行是否切换选中 |
| `checked-disabled` | `boolean` | `false` | 禁用节点是否允许被选中操作 |
| `pack-disabled-key` | `boolean` | `true` | 已选禁用节点是否包含在返回 keys / nodes 与 `v-model` 中 |

> `pack-disabledkey` 是旧拼写，当前仅作为废弃别名兼容；新代码请使用 `pack-disabled-key`。当两个属性同时传入时，以 `pack-disabled-key` 为准。

## 展开

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `default-expand-all` | `boolean` | `false` | 初始是否展开全部 |
| `default-expanded-keys` | `TreeKey[]` | `[]` | 初始展开的 keys |
| `expand-checked` | `boolean` | `false` | 初始是否展开已选节点的祖先链 |
| `expand-on-click-node` | `boolean` | `false` | 点击整行是否展开/收起 |
| `cache-expanded-keys` | `boolean` | `false` | 数据重建时保留运行时展开状态 |

## 过滤

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `filter-value` | `string` | `""` | 过滤关键词，命中节点及其祖先链、后代节点保持可见 |
| `filter-method` | `(value, node) => boolean` | - | 自定义匹配函数 |
| `highlight-filter` | `boolean` | `true` | 内置 label 中高亮命中的关键词 |

## 懒加载

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `load-mode` | `boolean` | `false` | 懒加载模式，节点可在子节点未就绪时展开 |
| `load-api` | `(node) => TreeDataItem[] \| Promise<...>` | - | 子节点加载函数 |
| `is-leaf-fn` | `(item, node) => boolean` | - | 自定义叶子节点判断 |
| `always-first-load` | `boolean` | `false` | 首次展开时即使已有静态 children 也执行加载 |

## 外观

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `theme-color` | `string` | `#007aff` | 主题色（选中控件、高亮） |
| `node-class` | `string` | `""` | 添加到每个节点行的自定义 class，不必依赖组件内部类名 |
| `indent` | `number` | `40` | 每级缩进，单位 **rpx** |
| `selection-placement` | `"left" \| "right"` | `"left"` | radio / checkbox 选择控件位置 |
| `empty-text` | `string` | `暂无数据` | 空数据文案 |
| `show-path` | `boolean` | `false` | label 下方展示节点路径 |
| `path-separator` | `string` | `" / "` | 路径分隔符 |

普通 `class` 仍按 Vue / uni-app 约定作用于组件根容器；需要定制节点行时使用 `node-class`：

```vue
<uni-tree-view
  class="department-tree"
  node-class="department-tree-node"
  :data="data"
/>

<style scoped>
:deep(.department-tree-node) {
  min-height: 44px;
}
</style>
```

使用 scoped 样式或小程序端时，仍需遵循对应平台的组件样式隔离规则。

## 虚拟渲染

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `virtual` | `boolean` | `false` | 开启定高虚拟渲染 |
| `virtual-height` | `number` | `400` | 滚动容器高度，单位 **px** |
| `virtual-item-height` | `number` | `36` | 行高，单位 **px**；虚拟模式会据此固定内置节点行高 |
| `virtual-overscan` | `number` | `8` | 可视区上下额外渲染的行数 |
