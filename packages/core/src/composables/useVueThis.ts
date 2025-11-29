import { getCurrentInstance } from "vue";
import type { ComponentPublicInstance } from "vue";

export type VueThis = ComponentPublicInstance;

export function useVueThis() {
  const vm = getCurrentInstance();

  return vm!.proxy;
}