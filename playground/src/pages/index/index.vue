<template>
  <!-- <view> -->
  <!--  212121 -->
  <!-- </view> -->
  <!-- <app-page> -->
  <view>playground/src/pages/index/index.vue <uni-tree-list :data="[]"></uni-tree-list></view>

  <!-- </app-page> -->
</template>

<script setup lang='ts'>
import UniTreeList from "uni-tree-list";
import { onBeforeMount, onMounted } from "vue";

// const refVal = ref(0);
// const state = reactive({});
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