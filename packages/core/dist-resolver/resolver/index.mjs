const INDEX = "uni-tree-view";
const importsMap = {
  "UniTreeList": INDEX
  // "provideEcharts": SHARED,
  // "provideEchartsTheme": SHARED,
  // "provideEchartsOption": SHARED,
  // "provideEchartsInitOptions": SHARED,
  // "provideEchartsUpdateOptions": SHARED,
  // "provideEchartsLoadingOptions": SHARED
};
function UniTreeListResolver(options = {}) {
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

export { UniTreeListResolver };
