import type { ComponentResolver } from "@uni-helper/vite-plugin-uni-components";

const INDEX = "uni-tree-view";
// const SHARED = `${INDEX}/shared`;

const importsMap: Record<string, string> = {
  "UniTreeList": INDEX
  // "provideEcharts": SHARED,
  // "provideEchartsTheme": SHARED,
  // "provideEchartsOption": SHARED,
  // "provideEchartsInitOptions": SHARED,
  // "provideEchartsUpdateOptions": SHARED,
  // "provideEchartsLoadingOptions": SHARED
};

export interface UniTreeListResolverOptions {
  exclude?: RegExp;
}

export function UniTreeListResolver(options: UniTreeListResolverOptions = {}): ComponentResolver {
  return {
    type: "component",
    resolve(name: any) {
      if (options.exclude && name.match(options.exclude)) {
        return;
      }

      const from = importsMap[name];

      if (from == null) {
        return;
      }

      return {
        name,
        from
      };
    }
  };
}