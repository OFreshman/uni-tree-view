import type { ComponentPublicInstance } from "vue";

export declare function getDeviceInfo(): UniApp.GetDeviceInfoResult | UniApp.GetSystemInfoResult;

export declare function getWindowInfo(): UniApp.GetWindowInfoResult | UniApp.GetSystemInfoResult;

export declare function getAppBaseInfo(): UniApp.GetAppBaseInfoResult | UniApp.GetSystemInfoResult;

export declare function getVersion(): string;

export declare function compareVersion(v1: string, v2: string): 0 | 1 | -1;

export declare function querySelect(
  component: ComponentPublicInstance,
  selector: string,
  fields: UniApp.NodeField
): Promise<UniApp.NodeInfo>;