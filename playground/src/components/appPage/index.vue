<template>
  <wd-config-provider
    class="app-page"
    :theme="theme"
    :theme-vars="themeVars">
    <slot></slot>

    <wd-toast></wd-toast>
    <wd-notify></wd-notify>
    <wd-dialog></wd-dialog>
  </wd-config-provider>
</template>

<script lang="ts" setup>
import type { Slots } from "./types";
import { useTheme } from "@/composable/useTheme";

defineOptions({
  name: "AppPage",
  options: {
    // #ifdef MP-WEIXIN || MP-ALIPAY
    virtualHost: true
    // #endif
  }
});

defineSlots<Slots>();

const { theme } = useTheme();

// 品牌绿覆盖 wot 默认蓝：config-provider 会把这些键转成 --wot-* 行内变量，
// 优先级高于其组件内部 .wot-theme-light 的 scoped 声明（palette.scss 只能覆盖到 page 层）
const themeVars = {
  primary5: "#34a973",
  primary6: "#299764",
  primary7: "#1f7a4f"
};
</script>

<style lang="scss" scoped>
.app-page {
  position: relative;
}
</style>