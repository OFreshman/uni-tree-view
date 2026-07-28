import type { ComponentResolverObject } from "@uni-helper/vite-plugin-uni-components";

const INDEX = "uni-tree-view";
// const SHARED = `${INDEX}/shared`;

const importsMap: Record<string, string> = {
  "UniTreeView": INDEX
  // "provideEcharts": SHARED,
  // "provideEchartsTheme": SHARED,
  // "provideEchartsOption": SHARED,
  // "provideEchartsInitOptions": SHARED,
  // "provideEchartsUpdateOptions": SHARED,
  // "provideEchartsLoadingOptions": SHARED
};

export interface UniTreeViewResolverOptions {
  exclude?: RegExp;
}

export function UniTreeViewResolver(options: UniTreeViewResolverOptions = {}): ComponentResolverObject {
  return {
    type: "component",
    resolve(name: string) {
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