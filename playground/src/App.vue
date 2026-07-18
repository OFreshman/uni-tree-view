<!--<template>-->
<!--  <view>app: <uni-tree-view></uni-tree-view></view>-->
<!--</template>-->
<script lang="ts" setup>
import { onHide, onLaunch, onShow } from "@dcloudio/uni-app";

onLaunch(() => {
  // eslint-disable-next-line no-console
  console.log("App Launch");
});

onShow(() => {
  // eslint-disable-next-line no-console
  console.log("App Show");
});

onHide(() => {
  // eslint-disable-next-line no-console
  console.log("App Hide");
});
</script>

<style lang="scss">
// wot-ui v2 主题变量入口（Design Token），需在业务样式之前引入
@use "@wot-ui/ui/styles/theme/index.scss";
@use "@/styles/rebot.scss";
@use "@/styles/palette.scss";
// @import "@/styles/global.scss";
// @import "@/styles/helpers.scss";
</style>