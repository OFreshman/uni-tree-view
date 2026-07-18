# 单选与多选

## 单选

`show-checkbox` 不加 `multiple` 即为单选，`v-model` 为单个 key：

```vue
<template>
  <uni-tree-view
    v-model="selected"
    show-checkbox
    :data="treeData"
  />
</template>

<script setup>
import { ref } from "vue";

const selected = ref("room-a-101");
</script>
```

只允许选择叶子节点：

```vue
<uni-tree-view v-model="selected" show-checkbox only-radio-leaf :data="treeData" />
```

## 多选（父子联动）

`multiple` 开启多选，`v-model` 为 key 数组。勾选父节点自动勾选全部子节点，部分勾选时父节点半选：

```vue
<template>
  <uni-tree-view
    v-model="checked"
    show-checkbox
    multiple
    :data="treeData"
    @change="onChange"
  />
</template>

<script setup>
import { ref } from "vue";

const checked = ref([]);

function onChange({ keys, node }) {
  console.log(`${node.label} 变化后共选中 ${keys.length} 项`);
}
</script>
```

## 严格模式（父子独立）

```vue
<uni-tree-view v-model="checked" show-checkbox multiple check-strictly :data="treeData" />
```

## 通过方法操作选中

```vue
<template>
  <wd-button @click="checkFloor">选中 1 层</wd-button>
  <wd-button variant="plain" @click="clear">清空</wd-button>
  <uni-tree-view ref="treeRef" v-model="checked" show-checkbox multiple :data="treeData" />
</template>

<script setup>
import { ref } from "vue";

const treeRef = ref();
const checked = ref([]);

function checkFloor() {
  treeRef.value.setCheckedKeys("floor-a-1", true);
}

function clear() {
  treeRef.value.setCheckedKeys(treeRef.value.getCheckedKeys(), false);
}
</script>
```
