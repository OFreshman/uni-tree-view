<template>
  <view class="uni-tree-list-container">
    <scroll-view class="scroll-view-container" scroll-y="true">
      <view
        v-for="(node, index) in treeList"
        :key="node[idKey]"
        :style="[{
          paddingLeft: `${node.level * 15}px`
        }]"
        class="utl-tree-item"
        :class="{
          show: node.show,
          last: node.isLeaf,
          'show-child': node.showChild
        }">

        <view
          v-if="selectable"
          class="utl-tree-item__checkbox"
          :class="{ 'is--disabled': node.disabled }"
          @click="treeNodeChange(node, index)">
          <view v-if="node.check === CHECK_STATUS_MAP.checked" class="utl-tree-item__checkbox--icon utl-tree-checkbox-checked"></view>
          <view v-else-if="node.check === CHECK_STATUS_MAP.indeterminate" class="utl-tree-item__checkbox--icon utl-tree-checkbox-indeterminate"></view>
          <view v-else class="utl-tree-item__checkbox--icon utl-tree-checkbox-outline"></view>
        </view>

        <view class="utl-tree-node-label">
          {{ node.label }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { ref, toRaw, watch } from "vue";
import { CHECK_STATUS_MAP, defaultTreeProps } from "./constants";
import districtsData from "./mockData/districts.json";
import type {
  TreeNode,
  UniTreeListProps
} from "./types";

defineOptions({
  name: "UniTreeList",
  options: {
    // #ifdef MP-WEIXIN || MP-ALIPAY
    virtualHost: true
    // #endif
  }
});

const props = withDefaults(defineProps<UniTreeListProps>(), {
  data: () => [],
  treeProps: () => defaultTreeProps,
  selectable: true,
  defaultCheckedIdList: () => ["410300"]
});

interface anyObj {
  [key: string]: any;
}

console.log(33333, props.treeProps, CHECK_STATUS_MAP);

watch(() => props.data, (treePropsData) => {
  initTreeData(treePropsData);
});

// const checkStatusMap = CHECK_STATUS_MAP
// type UncheckedStatus = Extract<CheckStatus, "unchecked">;
const mockData: TreeNode[] = generateLargeTreeData().map((node) => ({
  ...node,
  check: CHECK_STATUS_MAP.unchecked,
  isCheck: [],
  disabled: false
})) as TreeNode[];

const treeList = ref<TreeNode[]>([]);
const treeData = ref<TreeNode[]>(mockData);
const childrenMap = ref<Map<string | number, TreeNode[]>>(new Map());
const nodeMap = ref<Map<string | number, TreeNode>>(new Map());
const { id: idKey, label: labelKey, children: childrenKey } = props.treeProps;

// const mergedTreeProps = computed(() => {
//   return {
//     ...defaultTreeProps,
//     ...props.treeProps
//   };
// });

initTreeData(toRaw(treeData.value));

function initTreeData(treeData: TreeNode[] = []) {
  treeList.value = [];
  console.log("treeData--", treeData, props.treeProps);
  _flatTreeData(treeData);
}

// 扁平化树结构, key 也有一层转化
function _flatTreeData(
  list: TreeNode[] = [],
  level = 0,
  parentId: (string | number)[] = [],
  parents: anyObj[] = []
) {
  list.forEach((item) => {
    Object.freeze(item);
    const checked =
      (props.defaultCheckedIdList.includes(item[idKey]) || !!item.check)
        ? CHECK_STATUS_MAP.checked
        : CHECK_STATUS_MAP.unchecked;
    console.log("item--", item[labelKey], checked, props.defaultCheckedIdList, item);
    treeList.value.push({
      id: item[idKey],
      label: item[labelKey],
      source: item,
      parentId, // 父级id数组
      parents, // 父级id数组
      level, // 层级
      showChild: false, // 子级是否显示(图标样式)
      open: false, // 是否打开
      show: level === 0, // 自身是否显示, 默认仅展示第一级
      hideArr: [],
      disabled: item.disabled || false,
      checked
    } as TreeNode);
    if (Array.isArray(item[childrenKey]) && item[childrenKey].length > 0) {
      const parentIdList: (string | number)[] = [...parentId];
      const parentArr: anyObj[] = [...parents];
      parentIdList.push(item[idKey]);
      parentArr.push({
        [idKey]: item[idKey],
        [labelKey]: item[labelKey]
      });
      _flatTreeData(item[childrenKey], level + 1, parentIdList, parentArr);
    } else {
      treeList.value[treeList.value.length - 1].isLeaf = true;
    }
  });

  // this.treeList = this.treeList.slice(0, 2500)
  // treeList.value = list;
  _buildFlatListMap(treeList.value);
  // _updateParentStatus();
  console.log("flat result: ", treeList.value);
}

// function _updateParentStatus() {
//   // 自底向上更新
//   const reversed = [...treeList.value].reverse();
//   for (const node of reversed) {
//     const children = childrenMap.value.get(node.id);
//     if (!children?.length) continue;
//
//     const allChecked = children.every(c => c.checked === CHECK_STATUS_MAP.checked);
//     const allUnchecked = children.every(c => c.checked === CHECK_STATUS_MAP.unchecked);
//
//     if (allChecked) node.checked = CHECK_STATUS_MAP.checked;
//     else if (allUnchecked) node.checked = CHECK_STATUS_MAP.unchecked;
//     else node.checked = CHECK_STATUS_MAP.indeterminate;
//   }
// }

function _buildFlatListMap(flatList: TreeNode[]) {
  // 建立父 -> 子映射
  const children_map = new Map<string | number, TreeNode[]>();
  const node_map = new Map<string | number, TreeNode>();

  for (const node of flatList) {
    node_map.set(node.id, node);
    const parentId = node.parentId.at(-1);
    if (parentId !== undefined) {
      if (!children_map.has(parentId)) {
        children_map.set(parentId, []);
      }
      children_map.get(parentId)!.push(node);
    }
  }
  childrenMap.value = children_map;
  nodeMap.value = node_map;
}


// TODO: 调整一下
function treeNodeChange() {
//   const { id: idKey, label: labelKey, children: childrenKey } = this.TreeProps;
//   if (item.isLeaf === true) {
//     //点击最后一级时触发事件
//     this.treeList[index].checked = !this.treeList[index].checked
//     this._fixMultiple(index)
//     return;
//   }
//   let list = this.treeList;
//   let id = item.id;
//   item.showChild = !item.showChild;
//   item.open = item.showChild ? true : !item.open;
//
//   console.log("_treeItemTap  item", item);
//   list.forEach((childItem, i) => {
//     if (item.showChild === false) {
//       //隐藏所有子级
//       if (!childItem.parentId.includes(id)) {
//         return;
//       }
//       if (!this.foldAll) {
//         if (childItem.isLeaf !== true && !childItem.open) {
//           childItem.showChild = false;
//         }
//         // 为隐藏的内容添加一个标记
//         if (childItem.show) {
//           childItem.hideArr[item.level] = id
//         }
//       } else {
//         if (childItem.isLeaf !== true) {
//           childItem.showChild = false;
//         }
//       }
//       childItem.show = false;
//     } else {
//       // 打开子集
//       if (childItem.parentId[childItem.parentId.length - 1] === id) {
//         childItem.show = true;
//       }
//       // 打开被隐藏的子集
//       if (childItem.parentId.includes(id) && !this.foldAll) {
//         // console.log(childItem.hideArr)
//         if (childItem.hideArr[item.level] === id) {
//           childItem.show = true;
//           if (childItem.open && childItem.showChild) {
//             childItem.showChild = true
//           } else {
//             childItem.showChild = false
//           }
//           childItem.hideArr[item.level] = null
//         }
//         // console.log(childItem.hideArr)
//       }
//     }
//   })
//   // console.log(this.treeList)
}

// 生成大数据量的树结构
function generateLargeTreeData(): TreeNode[] {
  const rawData: any = districtsData.districts[0].districts[0];
  console.log("rawData0--", districtsData.districts, rawData);
  // 递归转换 districts → children
  const transform = (nodes: any[]): TreeNode[] => {
    return nodes.map((n) => ({
      id: n.adcode,
      pid: null,
      label: n.name,
      disabled: false,
      children: n.districts ? transform(n.districts) : undefined,
      ...n
    }));
  };
  console.log("rawData1--", transform([rawData]));
  return transform([rawData]);
}
</script>

<style lang="scss">
@font-face {
  font-family: 'uni-tree-iconfont';
  src: url('data:application/octet-stream;base64,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') format('truetype');
}
</style>

<style lang="scss" scoped>
.uni-tree-list-container {
  width: 100%;
  height: 100%;
}

.utl-tree-item {
  display: flex;
  align-items: center;
  &__checkbox {
    width: 40rpx;
    height: 40rpx;
    overflow: hidden;

    &--icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40rpx;
      height: 40rpx;

      &::after {
        position: relative;
        top: 0;
        left: 0;
        z-index: 1;
        overflow: hidden;
        /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
        font-family: 'uni-tree-iconfont' !important;
        font-size: 32rpx;
        font-style: normal;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      &.utl-tree-checkbox-outline::after {
        color: #bbb;
        content: '\ead5';
      }

      &.utl-tree-checkbox-checked::after {
        color: var(--theme-color,#007aff);
        content: '\ead4';
      }

      &.utl-tree-checkbox-indeterminate::after {
        color: var(--theme-color,#007aff);
        content: '\ebce';
      }

      &.utl-tree-radio-outline::after {
        color: #bbb;
        content: '\ecc5';
      }

      &.utl-tree-radio-checked::after {
        color: var(--theme-color,#007aff);
        content: '\ecc4';
      }

      &.utl-tree-radio-indeterminate::after {
        color: var(--theme-color,#007aff);
        content: '\ea4f';
      }
    }
  }
}
</style>