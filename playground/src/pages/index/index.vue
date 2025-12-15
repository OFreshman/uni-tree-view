<template>
  <view>
    <text>playground/src/pages/index/index.vue</text>
    <uni-tree-view
      :data="treeData"
      :tree-props="{
        id: 'code',
        label: 'name',
        children: 'children'
      }"></uni-tree-view>
  </view>

  <!-- </app-page> -->
</template>

<script setup lang='ts'>
/* eslint-disable no-console */

import UniTreeView from "uni-tree-view";
import { onBeforeMount, onMounted } from "vue";
// import districtsData from "@/mockData/districts.json";
import districtsData from "@/mockData/districts-mini.json";

const treeData = ref([districtsData[0]]);
onBeforeMount(() => {});
onMounted(() => {
  console.log("playground treeData", treeData.value);
});
</script>

<style scoped lang='scss'>
:deep() {
  .utl-tree-item {
    // background-color: red;
  }
}
</style>

<route type="home">
{
  "style": {
    "navigationBarTitleText": "Uni Tree List"
  }
}
</route>