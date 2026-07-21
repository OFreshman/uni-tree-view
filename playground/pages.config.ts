import { defineUniPages } from "@uni-helper/vite-plugin-uni-pages";

export default defineUniPages({
  easycom: {
    custom: {
      "^wd-(.*)": "@wot-ui/ui/components/wd-$1/wd-$1.vue"
    }
  },
  globalStyle: {
    navigationBarTitleText: "Uni Tree View",
    navigationBarTextStyle: "black",
    navigationBarBackgroundColor: "#ffffff",
    "mp-weixin": {
      handleWebviewPreload: "auto"
    }
  }
});