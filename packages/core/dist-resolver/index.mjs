const INDEX = "uni-tree-view";
const importsMap = {
  "UniTreeView": INDEX
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

export { UniTreeViewResolver };
