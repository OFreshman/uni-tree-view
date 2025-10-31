<template>
  <view>
    <text>playground/src/pages/index/index.vue</text>
    <uni-tree-list
      :data="treeMockData"
      :tree-props="{
        id: 'adcode',
        label: 'name',
        children: 'districts'
      }"></uni-tree-list>
  </view>

  <!-- </app-page> -->
</template>

<script setup lang='ts'>
import UniTreeList from "uni-tree-list";
import { onBeforeMount, onMounted } from "vue";

const treeMockData = ref([]);
onBeforeMount(() => {});
onMounted(() => {});
</script>

<style scoped lang='scss'>
</style>

<route type="home">
{
  "style": {
    "navigationBarTitleText": "Uni Tree List"
  }
}
</route>