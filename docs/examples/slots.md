---
demo: slots
demoTitle: 自定义插槽
---

# 自定义插槽

## 自定义节点文本

`label` 插槽只替换文本部分，保留缩进、箭头、选择控件：

```vue
<uni-tree-view :data="treeData" selectable multiple>
  <template #label="{ node, data }">
    <text :style="{ fontWeight: node.level === 0 ? 600 : 400 }">
      {{ node.label }}
    </text>
    <text v-if="data.isNew" style="color: #fa4350; font-size: 20rpx;">
      NEW
    </text>
  </template>
</uni-tree-view>
```

## 图标与尾部内容

```vue
<uni-tree-view :data="treeData">
  <template #icon="{ node }">
    <wd-icon :name="node.isLeaf ? 'file' : 'folder'" size="32rpx" />
  </template>
  <template #append="{ data }">
    <wd-tag v-if="data.count" type="primary" variant="plain">
      {{ data.count }}
    </wd-tag>
  </template>
</uni-tree-view>
```

## 完全接管节点内容

`default` 插槽替换整个内容区（icon + label + append），缩进、箭头和选择控件仍由组件负责：

```vue
<uni-tree-view :data="treeData" selectable multiple>
  <template #default="{ node, data }">
    <view class="custom-node">
      <wd-img v-if="data.avatar" :src="data.avatar" width="48rpx" height="48rpx" round />
      <view class="custom-node__body">
        <text class="custom-node__title">{{ node.label }}</text>
        <text class="custom-node__desc">{{ data.description }}</text>
      </view>
    </view>
  </template>
</uni-tree-view>
```

::: warning
自定义内容改变了行高时，若同时开启 `virtual`，记得同步 `virtual-item-height`。
:::

## 空状态

```vue
<uni-tree-view :data="treeData" :filter-value="keyword">
  <template #empty="{ filterValue }">
    <wd-empty :description="filterValue ? '无匹配结果' : '暂无数据'" />
  </template>
</uni-tree-view>
```
