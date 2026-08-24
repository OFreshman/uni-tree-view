import type { StyleValue } from "vue";

/** 补齐 .vue.d.ts 手写类型缺失的通用组件属性，使 class/style 在 IDE 与 JSX 中可用。 */
export interface AllowedComponentProps {
  class?: any;
  style?: StyleValue;
}