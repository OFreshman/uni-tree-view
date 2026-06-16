'use strict';

const INDEX = "uni-tree-view";
const importsMap = {
  "UniTreeView": INDEX,
  "UniTreeList": INDEX
  // "provideEcharts": SHARED,
  // "provideEchartsTheme": SHARED,
  // "provideEchartsOption": SHARED,
  // "provideEchartsInitOptions": SHARED,
  // "provideEchartsUpdateOptions": SHARED,
  // "provideEchartsLoadingOptions": SHARED
};
function UniTreeViewResolver(options = {}) {
  return {
    type: "component",
    resolve(name) {
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
const UniTreeListResolver = UniTreeViewResolver;

exports.UniTreeListResolver = UniTreeListResolver;
exports.UniTreeViewResolver = UniTreeViewResolver;
