<template>
  <view>111111-{{ hello }}</view>
</template>

<script lang="ts" setup>
import { ref } from "vue";

defineOptions({
  name: "UniTreeList",
  options: {
    // #ifdef MP-WEIXIN || MP-ALIPAY
    virtualHost: true
    // #endif
  }
});

const hello = ref("hello word");
</script>

<style lang="scss" scoped></style>